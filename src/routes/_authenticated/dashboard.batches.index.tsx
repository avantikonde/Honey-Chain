import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Boxes, Plus } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, StatusBadge } from "@/components/honey/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
import { useAuth, useProfile } from "@/hooks/useAuth";
import { useBatches, useCreateBatch, useHives } from "@/lib/data";
import { eventLabel, formatDate, generateBatchCode } from "@/lib/honey";

export const Route = createFileRoute("/_authenticated/dashboard/batches/")({
  head: () => ({
    meta: [
      { title: "Honey batches — Honey Chain" },
      { name: "description", content: "Create honey batches and track their traceability lifecycle." },
      { property: "og:title", content: "Honey batches — Honey Chain" },
      { property: "og:description", content: "Batch creation, journey tracking and QR generation." },
    ],
  }),
  component: BatchesPage,
});

function BatchesPage() {
  const batches = useBatches();
  const hives = useHives();
  const createBatch = useCreateBatch();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);

  const [open, setOpen] = useState(false);
  const [hiveId, setHiveId] = useState("");
  const [harvestDate, setHarvestDate] = useState(new Date().toISOString().slice(0, 10));
  const [quantity, setQuantity] = useState("24.5");
  const [honeyType, setHoneyType] = useState("Multiflora");
  const [method, setMethod] = useState("Cold Extraction");

  const submit = async () => {
    const hive = (hives.data ?? []).find((h) => h.id === hiveId) ?? hives.data?.[0];
    const sequence = (batches.data?.length ?? 0) + 125;
    try {
      const batch = await createBatch.mutateAsync({
        batch_code: generateBatchCode(sequence),
        hive_id: hive?.id ?? null,
        hive_code: hive?.code ?? "",
        owner_id: user?.id ?? null,
        beekeeper_name: profile?.full_name || "Rajesh Patil",
        apiary: hive?.location ?? "Sahyadri Apiary",
        location: profile?.location || "Satara, Maharashtra",
        harvest_date: harvestDate,
        quantity_kg: Number(quantity),
        honey_type: honeyType,
        extraction_method: method,
        quality_status: "pending",
        stage: "harvest",
      });
      toast.success(`Batch ${batch.batch_code} created and harvest event anchored`);
      setOpen(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the batch");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Honey batches</h1>
          <p className="text-sm text-muted-foreground">Every batch carries a unique code and a verifiable journey.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="size-4" /> Create batch
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle className="font-display">Create honey batch</DialogTitle>
              <DialogDescription>A harvest event is recorded and anchored automatically.</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="hive">Hive</Label>
                <Select value={hiveId || hives.data?.[0]?.id || ""} onValueChange={setHiveId}>
                  <SelectTrigger id="hive">
                    <SelectValue placeholder="Select a hive" />
                  </SelectTrigger>
                  <SelectContent>
                    {(hives.data ?? []).map((h) => (
                      <SelectItem key={h.id} value={h.id}>
                        {h.code} · {h.location ?? "—"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Harvest date</Label>
                <Input id="date" type="date" value={harvestDate} onChange={(e) => setHarvestDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qty">Quantity (kg)</Label>
                <Input id="qty" type="number" step="0.1" value={quantity} onChange={(e) => setQuantity(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Honey type</Label>
                <Input id="type" value={honeyType} onChange={(e) => setHoneyType(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="method">Extraction method</Label>
                <Input id="method" value={method} onChange={(e) => setMethod(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button onClick={submit} disabled={createBatch.isPending}>
                {createBatch.isPending ? "Creating…" : "Create batch"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {batches.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (batches.data ?? []).length === 0 ? (
        <EmptyState icon={<Boxes className="size-6" />} title="No batches yet" description="Create your first honey batch after a harvest." />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {(batches.data ?? []).map((b) => (
            <Card key={b.id} className="shadow-soft transition-shadow hover:shadow-lift">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="font-display text-xl font-semibold">{b.batch_code}</h2>
                    <p className="text-xs text-muted-foreground">
                      {b.honey_type} · {b.quantity_kg} kg · Hive {b.hive_code || "—"}
                    </p>
                  </div>
                  <StatusBadge status={b.quality_status} />
                </div>
                <dl className="mt-4 space-y-1 text-sm text-muted-foreground">
                  <p>Harvested {formatDate(b.harvest_date)}</p>
                  <p>{b.location}</p>
                  <p>Current stage: <span className="font-medium capitalize text-foreground">{eventLabel(b.stage)}</span></p>
                </dl>
                <Button asChild variant="outline" className="mt-4 w-full">
                  <Link to="/dashboard/batches/$batchId" params={{ batchId: b.id }}>
                    Open batch
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
