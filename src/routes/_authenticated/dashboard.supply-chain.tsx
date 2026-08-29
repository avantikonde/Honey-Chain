import { createFileRoute, Link } from "@tanstack/react-router";
import { Truck } from "lucide-react";
import { EmptyState, StatusBadge } from "@/components/honey/brand";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatches } from "@/lib/data";
import { LIFECYCLE, eventLabel, formatDate } from "@/lib/honey";

export const Route = createFileRoute("/_authenticated/dashboard/supply-chain")({
  head: () => ({
    meta: [
      { title: "Supply chain — Honey Chain" },
      { name: "description", content: "Processor and distributor view of received honey batches and their stage." },
      { property: "og:title", content: "Supply chain — Honey Chain" },
      { property: "og:description", content: "Track processing, quality checks and distribution events." },
    ],
  }),
  component: SupplyChain,
});

function SupplyChain() {
  const batches = useBatches();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Supply chain</h1>
        <p className="text-sm text-muted-foreground">
          Processor and distributor view — open a batch to add processing, quality or distribution events.
        </p>
      </div>

      {batches.isLoading ? (
        <Skeleton className="h-64 rounded-xl" />
      ) : (batches.data ?? []).length === 0 ? (
        <EmptyState icon={<Truck className="size-6" />} title="No batches received" description="Batches appear here as soon as beekeepers harvest them." />
      ) : (
        <div className="space-y-4">
          {(batches.data ?? []).map((b) => {
            const stageIndex = Math.max(0, LIFECYCLE.findIndex((s) => s.key === b.stage));
            return (
              <Card key={b.id} className="shadow-soft">
                <CardHeader className="pb-3">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <CardTitle className="font-display">{b.batch_code}</CardTitle>
                      <CardDescription>
                        {b.beekeeper_name} · {b.quantity_kg} kg {b.honey_type} · harvested {formatDate(b.harvest_date)}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={b.quality_status} />
                      <Button asChild size="sm">
                        <Link to="/dashboard/batches/$batchId" params={{ batchId: b.id }}>
                          Add event
                        </Link>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <ol className="flex flex-wrap gap-2">
                    {LIFECYCLE.map((s, i) => (
                      <li
                        key={s.key}
                        className={
                          i <= stageIndex
                            ? "rounded-full border border-forest/25 bg-forest/10 px-3 py-1 text-xs font-medium text-forest"
                            : "rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
                        }
                      >
                        {eventLabel(s.key)}
                      </li>
                    ))}
                  </ol>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
