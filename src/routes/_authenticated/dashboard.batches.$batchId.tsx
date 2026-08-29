import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { ArrowLeft, Download, FlaskConical, Link2, Plus, QrCode, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { EmptyState, StatusBadge, ChainModeBadge } from "@/components/honey/brand";
import { TraceTimeline } from "@/components/honey/timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  useAddEvent,
  useAddQualityTest,
  useBatch,
  useChainRecords,
  useQualityTests,
  useTraceEvents,
} from "@/lib/data";
import { LIFECYCLE, formatDate, formatDateTime } from "@/lib/honey";

export const Route = createFileRoute("/_authenticated/dashboard/batches/$batchId")({
  head: () => ({
    meta: [
      { title: "Batch detail — Honey Chain" },
      { name: "description", content: "Traceability timeline, quality tests, blockchain proofs and QR code." },
      { property: "og:title", content: "Batch detail — Honey Chain" },
      { property: "og:description", content: "Manage a honey batch journey end to end." },
    ],
  }),
  component: BatchDetail,
});

function BatchDetail() {
  const { batchId } = Route.useParams();
  const batch = useBatch(batchId);
  const events = useTraceEvents(batchId);
  const tests = useQualityTests(batchId);
  const chain = useChainRecords(batchId);
  const addEvent = useAddEvent();
  const addTest = useAddQualityTest();

  const [qr, setQr] = useState<string>("");
  const [eventType, setEventType] = useState("processing");
  const [actor, setActor] = useState("Processing Unit A");
  const [location, setLocation] = useState("Pune, Maharashtra");
  const [testName, setTestName] = useState("Moisture content");
  const [testValue, setTestValue] = useState("17.2%");

  const verifyUrl =
    typeof window !== "undefined" && batch.data
      ? `${window.location.origin}/verify/${batch.data.batch_code}`
      : "";

  useEffect(() => {
    if (!verifyUrl) return;
    void QRCode.toDataURL(verifyUrl, { width: 480, margin: 1, color: { dark: "#3a2a12", light: "#ffffff" } }).then(setQr);
  }, [verifyUrl]);

  if (batch.isLoading) return <Skeleton className="h-96 rounded-xl" />;
  if (!batch.data)
    return (
      <EmptyState
        icon={<TriangleAlert className="size-6" />}
        title="Batch not found"
        description="This batch may have been removed."
        action={
          <Button asChild variant="outline">
            <Link to="/dashboard/batches">Back to batches</Link>
          </Button>
        }
      />
    );

  const b = batch.data;

  const submitEvent = async () => {
    try {
      await addEvent.mutateAsync({ batch: b, event_type: eventType, actor, location });
      toast.success("Event recorded and proof anchored");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not record the event");
    }
  };

  const submitTest = async () => {
    try {
      await addTest.mutateAsync({ batch_id: b.id, test_name: testName, value: testValue, result: "passed", lab: "AgriLab Certified" });
      toast.success("Quality test added");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add the test");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <Button asChild variant="ghost" size="sm" className="-ml-2 mb-1">
          <Link to="/dashboard/batches">
            <ArrowLeft className="size-4" /> All batches
          </Link>
        </Button>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-3xl font-semibold">{b.batch_code}</h1>
          <StatusBadge status={b.quality_status} />
          <ChainModeBadge />
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {b.honey_type} · {b.quantity_kg} kg · Hive {b.hive_code} · harvested {formatDate(b.harvest_date)} ·{" "}
          {b.location}
        </p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.5fr_1fr]">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Traceability journey</CardTitle>
            <CardDescription>Hive → harvest → extraction → processing → quality → packaging → distribution → consumer.</CardDescription>
          </CardHeader>
          <CardContent>
            {events.isLoading ? <Skeleton className="h-64 rounded-xl" /> : <TraceTimeline events={events.data ?? []} />}
          </CardContent>
        </Card>

        <div className="space-y-4">
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 font-display">
                <QrCode className="size-5" /> Consumer QR code
              </CardTitle>
              <CardDescription>Printed on the jar label. Opens the public verification page.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {qr ? (
                <img src={qr} alt={`QR code for batch ${b.batch_code}`} width={220} height={220} className="mx-auto rounded-xl border border-border" />
              ) : (
                <Skeleton className="mx-auto size-[220px] rounded-xl" />
              )}
              <p className="break-all text-center text-xs text-muted-foreground">{verifyUrl}</p>
              <div className="flex gap-2">
                <Button asChild variant="outline" className="flex-1">
                  <a href={qr} download={`${b.batch_code}-qr.png`}>
                    <Download className="size-4" /> Download
                  </a>
                </Button>
                <Button asChild className="flex-1">
                  <Link to="/verify/$batchId" params={{ batchId: b.batch_code }}>
                    <Link2 className="size-4" /> Open page
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="font-display">Add supply-chain event</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="etype">Event</Label>
                <Select value={eventType} onValueChange={setEventType}>
                  <SelectTrigger id="etype"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {LIFECYCLE.map((s) => (
                      <SelectItem key={s.key} value={s.key}>{s.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="actor">Actor</Label>
                <Input id="actor" value={actor} onChange={(e) => setActor(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="eloc">Location</Label>
                <Input id="eloc" value={location} onChange={(e) => setLocation(e.target.value)} />
              </div>
              <Button onClick={submitEvent} disabled={addEvent.isPending} className="w-full">
                <Plus className="size-4" /> {addEvent.isPending ? "Anchoring…" : "Record & anchor event"}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display">
              <FlaskConical className="size-5" /> Quality tests
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(tests.data ?? []).map((t) => (
              <div key={t.id} className="flex items-center justify-between rounded-lg border border-border px-4 py-2.5">
                <div>
                  <p className="font-medium">{t.test_name}</p>
                  <p className="text-xs text-muted-foreground">{t.value} · {t.lab ?? "Lab"} · {formatDate(t.tested_at)}</p>
                </div>
                <StatusBadge status={t.result} />
              </div>
            ))}
            <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Input value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Test name" />
              <Input value={testValue} onChange={(e) => setTestValue(e.target.value)} placeholder="Value" />
              <Button onClick={submitTest} disabled={addTest.isPending}>Add</Button>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-soft">
          <CardHeader>
            <CardTitle className="font-display">Blockchain proof records</CardTitle>
            <CardDescription>
              On-chain payload: batch id, event type, timestamp and data hash. Everything else stays off-chain.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {(chain.data ?? []).length === 0 ? (
              <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
                No proofs anchored yet.
              </p>
            ) : (
              (chain.data ?? []).map((r) => (
                <div key={r.id} className="rounded-lg border border-border px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="font-medium capitalize">{r.event_type.replace(/_/g, " ")}</p>
                    <span className="text-xs uppercase tracking-wider text-muted-foreground">
                      {r.mode === "simulated" ? "Simulation mode" : "Testnet"} · block {r.block_number}
                    </span>
                  </div>
                  <p className="mt-1 break-all font-mono text-xs text-muted-foreground">hash {r.data_hash}</p>
                  <p className="break-all font-mono text-xs text-muted-foreground">tx {r.tx_hash}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.recorded_at)}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
