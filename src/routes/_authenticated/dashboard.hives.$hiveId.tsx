import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowLeft,
  AudioLines,
  BrainCircuit,
  Droplets,
  Flame,
  Pause,
  Play,
  Scale,
  Sparkles,
  Thermometer,
  TrendingUp,
  TriangleAlert,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { EmptyState, StatusBadge } from "@/components/honey/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import {
  useCreatePrediction,
  useHive,
  usePredictions,
  useReadings,
  useSaveReading,
  useUpdateHive,
} from "@/lib/data";
import {
  analyseHive,
  formatDate,
  formatDateTime,
  nextReading,
  predictProductivity,
  type SensorSample,
  type SimulationScenario,
} from "@/lib/honey";

export const Route = createFileRoute("/_authenticated/dashboard/hives/$hiveId")({
  head: () => ({
    meta: [
      { title: "Hive detail — Honey Chain" },
      { name: "description", content: "Virtual IoT hive simulator, AI-assisted colony analysis and harvest prediction." },
      { property: "og:title", content: "Hive detail — Honey Chain" },
      { property: "og:description", content: "Live simulated telemetry with explainable colony risk analysis." },
    ],
  }),
  component: HiveDetail,
});

const SCENARIOS: { key: SimulationScenario; label: string; icon: typeof Flame }[] = [
  { key: "normal", label: "Normal conditions", icon: Sparkles },
  { key: "stress", label: "Simulate hive stress", icon: TriangleAlert },
  { key: "heat", label: "Abnormal temperature", icon: Flame },
  { key: "humidity", label: "High humidity", icon: Droplets },
];

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-popover-foreground)",
  fontSize: 12,
};

function HiveDetail() {
  const { hiveId } = Route.useParams();
  const hive = useHive(hiveId);
  const readings = useReadings(hiveId, 72);
  const predictions = usePredictions(hiveId);
  const saveReading = useSaveReading();
  const updateHive = useUpdateHive();
  const createPrediction = useCreatePrediction();

  const [running, setRunning] = useState(false);
  const [scenario, setScenario] = useState<SimulationScenario>("normal");
  const [live, setLive] = useState<SensorSample | null>(null);
  const [liveSeries, setLiveSeries] = useState<{ label: string; Temperature: number; Humidity: number; Weight: number; Activity: number }[]>([]);
  const lastAlertRisk = useRef(0);

  // Seed the live sample from the stored hive state
  useEffect(() => {
    if (hive.data && !live) {
      setLive({
        temperature: Number(hive.data.temperature),
        humidity: Number(hive.data.humidity),
        weight_kg: Number(hive.data.weight_kg),
        activity_pct: Number(hive.data.activity_pct),
        acoustic_index: Number(hive.data.acoustic_index),
      });
    }
  }, [hive.data, live]);

  const analysis = useMemo(() => {
    if (!live) return null;
    const hist = readings.data ?? [];
    const trend =
      hist.length > 6
        ? Number(hist[hist.length - 1]!.weight_kg) - Number(hist[Math.max(0, hist.length - 7)]!.weight_kg)
        : 0;
    return analyseHive(live, trend);
  }, [live, readings.data]);

  const prediction = useMemo(() => {
    const hist = readings.data ?? [];
    if (hist.length < 4) return null;
    const t0 = new Date(hist[0]!.recorded_at).getTime();
    return predictProductivity(
      hist.map((r) => ({ t: (new Date(r.recorded_at).getTime() - t0) / 36e5, weight: Number(r.weight_kg) })),
      analysis?.healthScore ?? hive.data?.health_score ?? 80,
    );
  }, [readings.data, analysis?.healthScore, hive.data?.health_score]);

  // Simulation tick
  useEffect(() => {
    if (!running || !live) return;
    const id = setInterval(() => {
      setLive((prev) => {
        if (!prev) return prev;
        const next = nextReading(prev, scenario);
        setLiveSeries((s) =>
          [
            ...s,
            {
              label: new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
              Temperature: next.temperature,
              Humidity: next.humidity,
              Weight: next.weight_kg,
              Activity: next.activity_pct,
            },
          ].slice(-40),
        );
        return next;
      });
    }, 1800);
    return () => clearInterval(id);
  }, [running, scenario, live]);

  // Persist telemetry + raise AI alerts as the simulation runs
  useEffect(() => {
    if (!running || !live || !hive.data || !analysis) return;
    const id = setTimeout(() => {
      saveReading.mutate({ hive_id: hiveId, ...live });
      updateHive.mutate({
        id: hiveId,
        patch: {
          ...live,
          health_score: analysis.healthScore,
          status: analysis.status,
          updated_at: new Date().toISOString(),
        },
      });
      if (analysis.riskScore >= 55 && analysis.riskScore - lastAlertRisk.current >= 12) {
        lastAlertRisk.current = analysis.riskScore;
        createPrediction.mutate({
          hive_id: hiveId,
          risk_score: analysis.riskScore,
          status: analysis.status === "critical" ? "high" : analysis.status,
          title: `${analysis.title} in Hive ${hive.data!.code}`,
          recommendation: analysis.recommendation,
          factors: analysis.factors.filter((f) => f.severity !== "ok").map((f) => f.label),
        });
        toast.warning(`${analysis.title} — Hive ${hive.data!.code}`, {
          description: `Risk ${analysis.riskScore}% · ${analysis.recommendation}`,
        });
      }
      if (analysis.riskScore < 40) lastAlertRisk.current = 0;
    }, 900);
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [live, running]);

  if (hive.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!hive.data)
    return (
      <EmptyState
        icon={<TriangleAlert className="size-6" />}
        title="Hive not found"
        description="This hive may have been removed."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/hives">Back to hives</Link>
          </Button>
        }
      />
    );

  const h = hive.data;
  const history = (readings.data ?? []).map((r) => ({
    label: new Date(r.recorded_at).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit" }),
    Temperature: Number(r.temperature),
    Humidity: Number(r.humidity),
    Weight: Number(r.weight_kg),
    Activity: Number(r.activity_pct),
  }));
  const chartData = liveSeries.length > 3 ? liveSeries : history;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
            <Link to="/dashboard/hives">
              <ArrowLeft className="size-4" /> All hives
            </Link>
          </Button>
          <h1 className="font-display text-3xl font-semibold">Hive {h.code}</h1>
          <p className="text-sm text-muted-foreground">
            {h.location ?? "Location not set"} · updated {formatDateTime(h.updated_at)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge status={analysis?.status ?? h.status} />
          <Badge variant="outline" className="gap-1.5">
            <Activity className="size-3.5" /> {running ? "Simulating" : "Idle"}
          </Badge>
        </div>
      </div>

      {/* Virtual IoT simulator */}
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">Virtual IoT Hive Simulator</CardTitle>
          <CardDescription>
            Software-generated telemetry — no physical sensors, boards or hive hardware are involved.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <Reading icon={<Thermometer className="size-4" />} label="Temperature" value={`${(live?.temperature ?? 0).toFixed(1)}°C`} alert={(live?.temperature ?? 0) > 37} />
            <Reading icon={<Droplets className="size-4" />} label="Humidity" value={`${Math.round(live?.humidity ?? 0)}%`} alert={(live?.humidity ?? 0) > 75} />
            <Reading icon={<Scale className="size-4" />} label="Hive weight" value={`${(live?.weight_kg ?? 0).toFixed(2)} kg`} />
            <Reading icon={<Activity className="size-4" />} label="Bee activity" value={`${Math.round(live?.activity_pct ?? 0)}%`} alert={(live?.activity_pct ?? 100) < 60} />
            <Reading icon={<AudioLines className="size-4" />} label="Acoustic index" value={`${Math.round(live?.acoustic_index ?? 0)}`} alert={(live?.acoustic_index ?? 0) > 85} />
          </div>

          <div className="flex flex-wrap gap-2">
            <Button onClick={() => setRunning(true)} disabled={running}>
              <Play className="size-4" /> Start simulation
            </Button>
            <Button onClick={() => setRunning(false)} variant="outline" disabled={!running}>
              <Pause className="size-4" /> Stop simulation
            </Button>
            <span className="mx-1 hidden w-px bg-border sm:block" />
            {SCENARIOS.map((s) => (
              <Button
                key={s.key}
                variant={scenario === s.key ? "default" : "secondary"}
                onClick={() => {
                  setScenario(s.key);
                  setRunning(true);
                  toast.info(`Scenario: ${s.label}`);
                }}
              >
                <s.icon className="size-4" /> {s.label}
              </Button>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Temperature & humidity
              </p>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" minTickGap={24} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" domain={[20, 48]} />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" domain={[20, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="l" type="monotone" dataKey="Temperature" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} isAnimationActive={false} />
                    <Line yAxisId="r" type="monotone" dataKey="Humidity" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Weight & bee activity
              </p>
              <div className="h-[230px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="hw" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" minTickGap={24} />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" domain={[0, 100]} />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area yAxisId="l" type="monotone" dataKey="Weight" stroke="var(--color-chart-2)" fill="url(#hw)" strokeWidth={2} isAnimationActive={false} />
                    <Line yAxisId="r" type="monotone" dataKey="Activity" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-2">
        {/* AI analysis */}
        <Card className={cn("shadow-soft", analysis?.status === "critical" && "border-destructive/40")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <BrainCircuit className="size-5 text-primary" /> AI Hive Intelligence
            </CardTitle>
            <CardDescription>
              AI-assisted colony health analysis. Explainable anomaly detection — decision support, not a validated
              veterinary diagnosis.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {analysis ? (
              <>
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border p-4">
                  <div>
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Risk score</p>
                    <p className="font-display text-4xl font-semibold">{analysis.riskScore}%</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs uppercase tracking-wider text-muted-foreground">Health score</p>
                    <p className="font-display text-4xl font-semibold">{analysis.healthScore}<span className="text-base text-muted-foreground">/100</span></p>
                  </div>
                  <StatusBadge status={analysis.status} className="text-sm" />
                </div>

                <div>
                  <p className="font-medium">{analysis.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{analysis.recommendation}</p>
                </div>

                <div className="space-y-2">
                  {analysis.factors.map((f) => (
                    <div key={f.label} className="rounded-lg border border-border px-3 py-2">
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">{f.label}</span>
                        <span
                          className={cn(
                            "text-xs font-semibold",
                            f.severity === "high" ? "text-destructive" : f.severity === "warn" ? "text-warning" : "text-success",
                          )}
                        >
                          +{f.contribution} risk
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{f.detail}</p>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <Skeleton className="h-56 rounded-xl" />
            )}
          </CardContent>
        </Card>

        {/* Productivity prediction */}
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <TrendingUp className="size-5 text-forest" /> Productivity prediction
            </CardTitle>
            <CardDescription>Least-squares projection of hive weight, adjusted by colony health.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {prediction ? (
              <>
                <div className="grid grid-cols-2 gap-3">
                  <Fact label="Current hive weight" value={`${prediction.currentWeight} kg`} />
                  <Fact label="Predicted harvest" value={`${prediction.predictedHarvestKg} kg`} />
                  <Fact label="Expected window" value={`${formatDate(prediction.windowStart)} – ${formatDate(prediction.windowEnd)}`} />
                  <Fact label="Daily weight trend" value={`${prediction.dailyGain > 0 ? "+" : ""}${prediction.dailyGain} kg/day`} />
                </div>
                <div>
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Prediction confidence</span>
                    <span className="font-semibold text-foreground">{prediction.confidence}%</span>
                  </div>
                  <Progress value={prediction.confidence} className="h-2" />
                </div>
                <div className="h-[210px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={prediction.projection}>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                      <XAxis dataKey="label" tick={{ fontSize: 10 }} stroke="var(--color-muted-foreground)" minTickGap={20} />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" domain={["auto", "auto"]} />
                      <Tooltip contentStyle={tooltipStyle} />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Line type="monotone" dataKey="weight" name="Recorded weight" stroke="var(--color-chart-2)" strokeWidth={2} dot={false} connectNulls />
                      <Line type="monotone" dataKey="projected" name="Projected" stroke="var(--color-chart-1)" strokeWidth={2} strokeDasharray="5 4" dot={false} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </>
            ) : (
              <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
                Not enough weight history yet. Run the simulator to build a trend.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="font-display">Alert history</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {(predictions.data ?? []).length === 0 ? (
            <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
              No alerts recorded for this hive.
            </p>
          ) : (
            (predictions.data ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border px-4 py-3">
                <div className="min-w-0">
                  <p className="font-medium">{p.title}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(p.created_at)} · {p.recommendation}</p>
                </div>
                <Badge variant="outline" className="shrink-0">Risk {p.risk_score}%</Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Reading({ icon, label, value, alert = false }: { icon: React.ReactNode; label: string; value: string; alert?: boolean }) {
  return (
    <div className={cn("rounded-xl border px-4 py-3", alert ? "border-destructive/40 bg-destructive/8" : "border-border bg-card")}>
      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1 font-display text-2xl font-semibold", alert && "text-destructive")}>{value}</p>
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-semibold">{value}</p>
    </div>
  );
}
