import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Activity, Droplets, Grid2x2, Plus, Scale, Search, Thermometer } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useApiaries, useHives } from "@/lib/data";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { EmptyState, StatusBadge } from "@/components/honey/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard/hives/")({
  head: () => ({
    meta: [
      { title: "Hive management — Honey Chain" },
      { name: "description", content: "All hives with live virtual telemetry, health score and status." },
      { property: "og:title", content: "Hive management — Honey Chain" },
      { property: "og:description", content: "Track every hive in your apiary at a glance." },
    ],
  }),
  component: HivesPage,
});

function HivesPage() {
  const hives = useHives();
  const apiaries = useApiaries();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState("");
  const [location, setLocation] = useState("");
  const [apiaryId, setApiaryId] = useState("");
  const [saving, setSaving] = useState(false);

  const list = (hives.data ?? []).filter(
    (h) => h.code.toLowerCase().includes(query.toLowerCase()) || (h.location ?? "").toLowerCase().includes(query.toLowerCase()),
  );

  const createHive = async () => {
    setSaving(true);
    try {
      let targetApiary = apiaryId || apiaries.data?.[0]?.id;
      if (!targetApiary) {
        const { data, error } = await supabase
          .from("apiaries")
          .insert({
            name: `${profile?.full_name || "My"} Apiary`,
            location: profile?.location ?? "India",
            beekeeper_name: profile?.full_name ?? "",
            owner_id: user?.id ?? null,
          })
          .select()
          .single();
        if (error) throw new Error(error.message);
        targetApiary = data.id;
      }
      const { error } = await supabase.from("hives").insert({
        apiary_id: targetApiary,
        owner_id: user?.id ?? null,
        code: code.trim().toUpperCase(),
        location: location || null,
      });
      if (error) throw new Error(error.message);
      toast.success(`Hive ${code.toUpperCase()} added`);
      setOpen(false);
      setCode("");
      setLocation("");
      await hives.refetch();
      await apiaries.refetch();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add hive");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Hives</h1>
          <p className="text-sm text-muted-foreground">Virtual IoT readings across every colony you manage.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search hives" className="w-52 pl-9" />
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4" /> Add hive
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle className="font-display">Add a hive</DialogTitle>
                <DialogDescription>Registers a new colony with baseline virtual telemetry.</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="hive-code">Hive ID</Label>
                  <Input id="hive-code" value={code} onChange={(e) => setCode(e.target.value)} placeholder="H-105" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="hive-loc">Location</Label>
                  <Input id="hive-loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Block C, Satara" />
                </div>
                {(apiaries.data?.length ?? 0) > 0 ? (
                  <div className="space-y-2">
                    <Label htmlFor="apiary">Apiary</Label>
                    <Select value={apiaryId || apiaries.data?.[0]?.id || ""} onValueChange={setApiaryId}>
                      <SelectTrigger id="apiary">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(apiaries.data ?? []).map((a) => (
                          <SelectItem key={a.id} value={a.id}>
                            {a.name} · {a.location}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ) : null}
              </div>
              <DialogFooter>
                <Button onClick={createHive} disabled={!code.trim() || saving}>
                  {saving ? "Adding…" : "Add hive"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {hives.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-52 rounded-xl" />
          ))}
        </div>
      ) : list.length === 0 ? (
        <EmptyState
          icon={<Grid2x2 className="size-6" />}
          title="No hives yet"
          description="Add your first hive to start generating virtual IoT telemetry."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {list.map((h) => (
            <Card key={h.id} className="shadow-soft transition-shadow hover:shadow-lift">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{h.code}</h2>
                    <p className="text-xs text-muted-foreground">{h.location ?? "Location not set"}</p>
                  </div>
                  <StatusBadge status={h.status} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <Metric icon={<Thermometer className="size-4" />} label="Temperature" value={`${Number(h.temperature).toFixed(1)}°C`} />
                  <Metric icon={<Droplets className="size-4" />} label="Humidity" value={`${Math.round(Number(h.humidity))}%`} />
                  <Metric icon={<Scale className="size-4" />} label="Weight" value={`${Number(h.weight_kg).toFixed(1)} kg`} />
                  <Metric icon={<Activity className="size-4" />} label="Activity" value={`${Math.round(Number(h.activity_pct))}%`} />
                </dl>

                <div className="mt-4">
                  <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
                    <span>Health score</span>
                    <span className="font-semibold text-foreground">{h.health_score}/100</span>
                  </div>
                  <Progress value={h.health_score} className="h-2" />
                </div>

                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/dashboard/hives/$hiveId" params={{ hiveId: h.id }}>
                    Open hive details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function Metric({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border px-3 py-2">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-0.5 font-semibold">{value}</dd>
    </div>
  );
}
