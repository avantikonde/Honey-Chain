import { createFileRoute } from "@tanstack/react-router";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Boxes, Grid2x2, ShieldCheck, TriangleAlert, Users } from "lucide-react";
import { StatCard } from "@/components/honey/brand";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useApiaries, useBatches, useHives, usePredictions } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/dashboard/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — Honey Chain" },
      { name: "description", content: "Programme-level analytics: production, hive health distribution and verified batches." },
      { property: "og:title", content: "Analytics — Honey Chain" },
      { property: "og:description", content: "Regional production and colony health across the network." },
    ],
  }),
  component: Analytics,
});

const tooltipStyle = {
  background: "var(--color-popover)",
  border: "1px solid var(--color-border)",
  borderRadius: "10px",
  color: "var(--color-popover-foreground)",
  fontSize: 12,
};

function Analytics() {
  const hives = useHives();
  const batches = useBatches();
  const apiaries = useApiaries();
  const predictions = usePredictions();

  if (hives.isLoading || batches.isLoading) return <Skeleton className="h-96 rounded-xl" />;

  const all = hives.data ?? [];
  const allBatches = batches.data ?? [];
  const production = allBatches.reduce((s, b) => s + Number(b.quantity_kg), 0);
  const verified = allBatches.filter((b) => b.quality_status === "passed").length;
  const alerts = (predictions.data ?? []).filter((p) => p.status !== "healthy").length;
  const beekeepers = new Set((apiaries.data ?? []).map((a) => a.beekeeper_name)).size;

  const distribution = [
    { name: "Healthy", value: all.filter((h) => h.status === "healthy").length, color: "var(--color-chart-2)" },
    { name: "Attention", value: all.filter((h) => h.status === "attention").length, color: "var(--color-chart-1)" },
    { name: "Critical", value: all.filter((h) => h.status === "critical").length, color: "var(--color-chart-4)" },
  ];

  const regional = Object.entries(
    allBatches.reduce<Record<string, number>>((acc, b) => {
      acc[b.location] = (acc[b.location] ?? 0) + Number(b.quantity_kg);
      return acc;
    }, {}),
  ).map(([name, kg]) => ({ name, kg: Number(kg.toFixed(1)) }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Programme analytics</h1>
        <p className="text-sm text-muted-foreground">Network-wide view for Honey Mission administrators.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard label="Beekeepers" value={beekeepers} icon={<Users className="size-5" />} tone="honey" />
        <StatCard label="Active hives" value={all.length} icon={<Grid2x2 className="size-5" />} tone="forest" />
        <StatCard label="Honey production" value={`${production.toFixed(1)} kg`} icon={<Boxes className="size-5" />} tone="honey" />
        <StatCard label="Verified batches" value={verified} icon={<ShieldCheck className="size-5" />} tone="forest" />
        <StatCard label="Active alerts" value={alerts} icon={<TriangleAlert className="size-5" />} tone="warning" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Hive health distribution</CardTitle>
            <CardDescription>Colony status across every registered hive.</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distribution} dataKey="value" nameKey="name" innerRadius={60} outerRadius={100} paddingAngle={3}>
                  {distribution.map((d) => (
                    <Cell key={d.name} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tooltipStyle} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Regional production</CardTitle>
            <CardDescription>Honey volume by location (kg).</CardDescription>
          </CardHeader>
          <CardContent className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={regional}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--color-muted-foreground)" />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="kg" fill="var(--color-chart-1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
