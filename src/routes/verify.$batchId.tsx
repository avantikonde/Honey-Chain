import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { BadgeCheck, CircleAlert, Fingerprint, Loader2, MapPin, ShieldCheck, Sprout } from "lucide-react";
import { ChainModeBadge, Logo } from "@/components/honey/brand";
import { TraceTimeline } from "@/components/honey/timeline";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useBatchByCode, useChainRecords, useQualityTests, useTraceEvents, verifyBatchIntegrity } from "@/lib/data";
import { formatDate } from "@/lib/honey";

export const Route = createFileRoute("/verify/$batchId")({
  head: ({ params }) => ({
    meta: [
      { title: `Batch ${params.batchId} — Honey Chain verification` },
      { name: "description", content: `Origin, harvest date, processing history and provenance validity for honey batch ${params.batchId}.` },
      { property: "og:title", content: `Honey batch ${params.batchId} verified` },
      { property: "og:description", content: "See exactly where this honey came from and how it was processed." },
    ],
  }),
  component: VerifyBatch,
});

function VerifyBatch() {
  const { batchId } = Route.useParams();
  const batch = useBatchByCode(batchId);
  const events = useTraceEvents(batch.data?.id);
  const tests = useQualityTests(batch.data?.id);
  const chain = useChainRecords(batch.data?.id);
  const [checking, setChecking] = useState(false);
  const [result, setResult] = useState<Awaited<ReturnType<typeof verifyBatchIntegrity>> | null>(null);

  const runCheck = async () => {
    if (!batch.data) return;
    setChecking(true);
    try {
      setResult(await verifyBatchIntegrity(batch.data.id));
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-4">
          <Logo />
          <Button asChild variant="ghost" size="sm">
            <Link to="/verify">Verify another</Link>
          </Button>
        </div>
      </header>

      <main className="mx-auto max-w-3xl space-y-5 px-4 py-8">
        {batch.isLoading ? (
          <Skeleton className="h-72 rounded-xl" />
        ) : !batch.data ? (
          <Card className="border-destructive/40 shadow-soft">
            <CardContent className="flex flex-col items-center gap-3 p-10 text-center">
              <CircleAlert className="size-10 text-destructive" />
              <h1 className="font-display text-2xl font-semibold">No record found for {batchId}</h1>
              <p className="text-sm text-muted-foreground">
                This batch code is not in the Honey Chain registry. Check the label, or treat this jar with caution.
              </p>
              <Button asChild variant="outline" className="mt-2">
                <Link to="/verify">Try another code</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card className="overflow-hidden shadow-lift">
              <div className="gradient-honey px-6 py-6">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-honey-foreground/80">
                  Honey batch verification
                </p>
                <h1 className="mt-1 font-display text-3xl font-semibold text-honey-foreground">
                  {batch.data.batch_code}
                </h1>
                <p className="mt-1 flex items-center gap-1.5 text-sm text-honey-foreground/90">
                  <MapPin className="size-4" /> {batch.data.location}
                </p>
              </div>
              <CardContent className="grid gap-4 p-6 sm:grid-cols-2">
                <Fact label="Produced by" value={batch.data.beekeeper_name} icon={<Sprout className="size-4" />} />
                <Fact label="Apiary & hive" value={`${batch.data.apiary} · Hive ${batch.data.hive_code}`} />
                <Fact label="Harvest date" value={formatDate(batch.data.harvest_date)} />
                <Fact label="Quantity" value={`${batch.data.quantity_kg} kg`} />
                <Fact label="Honey type" value={batch.data.honey_type} />
                <Fact label="Processing" value={batch.data.extraction_method} />
                <div className="sm:col-span-2 flex flex-wrap gap-2">
                  <TrustChip ok label={`Quality: ${batch.data.quality_status === "passed" ? "Passed" : batch.data.quality_status}`} />
                  <TrustChip ok={(chain.data ?? []).length > 0} label={`Provenance record: ${(chain.data ?? []).length > 0 ? "Valid" : "Incomplete"}`} />
                  <TrustChip ok={(events.data ?? []).length >= 4} label={`Traceability: ${(events.data ?? []).length >= 4 ? "Complete" : "Partial"}`} />
                  <ChainModeBadge />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="font-display">The journey of this honey</CardTitle>
                <CardDescription>Every step was recorded by the actor who performed it.</CardDescription>
              </CardHeader>
              <CardContent>
                <TraceTimeline events={events.data ?? []} />
              </CardContent>
            </Card>

            {(tests.data ?? []).length > 0 ? (
              <Card className="shadow-soft">
                <CardHeader>
                  <CardTitle className="font-display">Quality results</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-2 sm:grid-cols-2">
                  {(tests.data ?? []).map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                      <div>
                        <p className="text-sm font-medium">{t.test_name}</p>
                        <p className="text-xs text-muted-foreground">{t.value}</p>
                      </div>
                      <BadgeCheck className="size-5 text-forest" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            ) : null}

            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display">
                  <Fingerprint className="size-5 text-primary" /> Blockchain record
                </CardTitle>
                <CardDescription>
                  Each journey step is hashed with SHA-256 and anchored as a proof. Running in clearly labelled
                  simulation mode until a testnet endpoint is configured — no database row is presented as a real
                  on-chain transaction.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button onClick={runCheck} disabled={checking} size="lg" className="w-full sm:w-auto">
                  {checking ? <Loader2 className="size-4 animate-spin" /> : <ShieldCheck className="size-4" />}
                  Verify blockchain record
                </Button>
                {result ? (
                  <div className="grid gap-2 sm:grid-cols-3">
                    <CheckRow ok={result.hashesValid} label="Data hash" detail={`${result.recomputed}/${result.anchored} recomputed`} />
                    <CheckRow ok={result.chainValid} label="Blockchain record" detail={`${result.anchored} proofs anchored`} />
                    <CheckRow ok={result.events > 0 && result.anchored >= result.events} label="Traceability integrity" detail={`${result.events} events`} />
                  </div>
                ) : null}
                <div className="space-y-2">
                  {(chain.data ?? []).map((r) => (
                    <div key={r.id} className="rounded-lg border border-border px-4 py-2.5">
                      <p className="text-sm font-medium capitalize">{r.event_type.replace(/_/g, " ")}</p>
                      <p className="break-all font-mono text-xs text-muted-foreground">{r.data_hash}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <footer className="border-t border-border bg-card py-6 text-center text-xs text-muted-foreground">
        Honey Chain · Verified honey provenance for Honey Mission beekeepers
      </footer>
    </div>
  );
}

function Fact({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <div>
      <p className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function TrustChip({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={
        ok
          ? "inline-flex items-center gap-1.5 rounded-full border border-forest/25 bg-forest/10 px-3 py-1 text-sm font-medium text-forest"
          : "inline-flex items-center gap-1.5 rounded-full border border-warning/40 bg-warning/15 px-3 py-1 text-sm font-medium text-warning"
      }
    >
      {ok ? <BadgeCheck className="size-4" /> : <CircleAlert className="size-4" />}
      {label}
    </span>
  );
}

function CheckRow({ ok, label, detail }: { ok: boolean; label: string; detail: string }) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="flex items-center gap-2 font-medium">
        {ok ? <BadgeCheck className="size-4 text-forest" /> : <CircleAlert className="size-4 text-destructive" />}
        {label}
      </p>
      <p className="mt-0.5 text-xs text-muted-foreground">{ok ? "Matches" : "Mismatch"} · {detail}</p>
    </div>
  );
}
