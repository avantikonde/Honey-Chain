import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  Boxes,
  Droplets,
  Grid2x2,
  HeartPulse,
  Scale,
  Thermometer,
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
import { EmptyState, StatCard, StatusBadge } from "@/components/honey/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatches, useHives, useLatestReadings, usePredictions } from "@/lib/data";
import { formatDateTime } from "@/lib/honey";

export const Route = createFileRoute("/_authenticated/dashboard/")({
  head: () => ({
    meta: [
      { title: "Beekeeper dashboard — Honey Chain" },
      { name: "description", content: "Hive health overview, virtual IoT telemetry and AI-assisted colony alerts." },
      { property: "og:title", content: "Beekeeper dashboard — Honey Chain" },
      { property: "og:description", content: "Monitor apiary health, alerts and honey production in one place." },
    ],
  }),
  component: Overview,
});

function Overview() {
  const hives = useHives();
  const batches = useBatches();
  const predictions = usePredictions();
  const readings = useLatestReadings(400);

  if (hives.isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    );
  }

  if (hives.error) {
    return (
      <EmptyState
        icon={<TriangleAlert className="size-6" />}
        title="Could not load your apiary"
        description={hives.error.message}
      />
    );
  }

  const all = hives.data ?? [];
  const healthy = all.filter((h) => h.status === "healthy").length;
  const attention = all.filter((h) => h.status === "attention").length;
  const critical = all.filter((h) => h.status === "critical").length;
  const produced = (batches.data ?? []).reduce((s, b) => s + Number(b.quantity_kg), 0);
  const activeBatches = (batches.data ?? []).filter((b) => b.stage !== "retail").length;
  const openAlerts = (predictions.data ?? []).filter((p) => p.status !== "healthy");

  // Aggregate hourly averages across the apiary for the health overview chart
  const byHour = new Map<string, { t: string; temperature: number; humidity: number; weight: number; activity: number; n: number }>();
  for (const r of readings.data ?? []) {
    const key = new Date(r.recorded_at).toISOString().slice(0, 13);
    const cur = byHour.get(key) ?? { t: key, temperature: 0, humidity: 0, weight: 0, activity: 0, n: 0 };
    cur.temperature += Number(r.temperature);
    cur.humidity += Number(r.humidity);
    cur.weight += Number(r.weight_kg);
    cur.activity += Number(r.activity_pct);
    cur.n += 1;
    byHour.set(key, cur);
  }
  const series = [...byHour.values()]
    .sort((a, b) => a.t.localeCompare(b.t))
    .map((d) => ({
      label: `${d.t.slice(11)}:00`,
      Temperature: Number((d.temperature / d.n).toFixed(1)),
      Humidity: Math.round(d.humidity / d.n),
      Weight: Number((d.weight / d.n).toFixed(1)),
      Activity: Math.round(d.activity / d.n),
    }));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Apiary overview</h1>
          <p className="text-sm text-muted-foreground">
            Virtual IoT telemetry and AI-assisted colony health across your hives.
          </p>
        </div>
        <Button asChild>
          <Link to="/dashboard/batches">
            Create honey batch <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <StatCard label="Total hives" value={all.length} icon={<Grid2x2 className="size-5" />} tone="honey" />
        <StatCard label="Healthy hives" value={healthy} icon={<HeartPulse className="size-5" />} tone="forest" hint={`${all.length ? Math.round((healthy / all.length) * 100) : 0}% of colonies`} />
        <StatCard label="Attention required" value={attention} icon={<TriangleAlert className="size-5" />} tone="warning" />
        <StatCard label="Critical" value={critical} icon={<TriangleAlert className="size-5" />} tone="destructive" />
        <StatCard label="Honey produced" value={`${produced.toFixed(1)} kg`} icon={<Scale className="size-5" />} tone="honey" />
        <StatCard label="Active batches" value={activeBatches} icon={<Boxes className="size-5" />} tone="forest" />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.6fr_1fr]">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Hive health overview</CardTitle>
            <CardDescription>Apiary-wide averages from the virtual hive simulator.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {series.length === 0 ? (
              <EmptyState icon={<Activity className="size-6" />} title="No readings yet" description="Start the virtual simulator on a hive to generate telemetry." />
            ) : (
              <>
                <ChartBlock title="Temperature & humidity">
                  <LineChart data={series}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Line yAxisId="l" type="monotone" dataKey="Temperature" stroke="var(--color-chart-1)" strokeWidth={2} dot={false} />
                    <Line yAxisId="r" type="monotone" dataKey="Humidity" stroke="var(--color-chart-3)" strokeWidth={2} dot={false} />
                  </LineChart>
                </ChartBlock>
                <ChartBlock title="Hive weight & bee activity">
                  <AreaChart data={series}>
                    <defs>
                      <linearGradient id="wt" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="var(--color-chart-2)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="var(--color-chart-2)" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                    <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="l" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <YAxis yAxisId="r" orientation="right" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend wrapperStyle={{ fontSize: 12 }} />
                    <Area yAxisId="l" type="monotone" dataKey="Weight" stroke="var(--color-chart-2)" fill="url(#wt)" strokeWidth={2} />
                    <Line yAxisId="r" type="monotone" dataKey="Activity" stroke="var(--color-chart-4)" strokeWidth={2} dot={false} />
                  </AreaChart>
                </ChartBlock>
              </>
            )}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display">AI alerts</CardTitle>
              <CardDescription>AI-assisted colony health analysis — decision support, not a diagnosis.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {openAlerts.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                  No open alerts. All colonies are within normal range.
                </p>
              ) : (
                openAlerts.slice(0, 4).map((a) => {
                  const hive = all.find((h) => h.id === a.hive_id);
                  return (
                    <div key={a.id} className="rounded-xl border border-border p-4">
                      <div className="flex items-start justify-between gap-3">
                        <p className="font-medium leading-snug">{a.title}</p>
                        <StatusBadge status={a.status === "high" ? "critical" : a.status} />
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        <Progress value={a.risk_score} className="h-2" />
                        <span className="shrink-0 text-sm font-semibold">{a.risk_score}%</span>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{a.recommendation}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">{formatDateTime(a.created_at)}</span>
                        {hive ? (
                          <Button asChild variant="ghost" size="sm">
                            <Link to="/dashboard/hives/$hiveId" params={{ hiveId: hive.id }}>
                              Open {hive.code}
                            </Link>
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display">Hives at a glance</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {all.slice(0, 6).map((h) => (
                <Link
                  key={h.id}
                  to="/dashboard/hives/$hiveId"
                  params={{ hiveId: h.id }}
                  className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5 transition-colors hover:bg-muted"
                >
                  <div>
                    <p className="font-medium">{h.code}</p>
                    <p className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1"><Thermometer className="size-3" />{Number(h.temperature).toFixed(1)}°C</span>
                      <span className="inline-flex items-center gap-1"><Droplets className="size-3" />{Math.round(Number(h.humidity))}%</span>
                      <span className="inline-flex items-center gap-1"><Scale className="size-3" />{Number(h.weight_kg).toFixed(1)} kg</span>
                    </p>
                  </div>
                  <StatusBadge status={h.status} />
                </Link>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-popover-foreground)",
  fontSize: 12,
};

function ChartBlock({ title, children }: { title: string; children: React.ReactElement }) {
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
