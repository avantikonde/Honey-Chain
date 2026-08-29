import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BrainCircuit,
  Boxes,
  Cpu,
  Fingerprint,
  LineChart,
  QrCode,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Sprout,
  TrendingUp,
  Users,
} from "lucide-react";
import heroImage from "@/assets/hero-apiary.jpg";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChainModeBadge, Logo } from "@/components/honey/brand";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Honey Chain — From Hive to Home. Verified. Traceable. Intelligent." },
      {
        name: "description",
        content:
          "Honey Chain gives beekeepers smart hive insights and consumers transparent, blockchain-backed honey provenance — with a fully software-based virtual IoT hive simulator.",
      },
      { property: "og:title", content: "Honey Chain — Verified honey traceability" },
      {
        property: "og:description",
        content:
          "Smart beekeeping management, AI-assisted colony health analysis and QR-based honey verification.",
      },
    ],
  }),
  component: Landing,
});

const PROBLEMS = [
  { title: "Counterfeit honey", body: "Adulterated honey floods the market and undercuts genuine rural producers." },
  { title: "Low consumer trust", body: "Buyers have no way to confirm origin, harvest date or processing method." },
  { title: "Weak market linkage", body: "Beekeepers sell through intermediaries with little price visibility." },
  { title: "No hive intelligence", body: "Colony stress is discovered during inspection — often far too late." },
];

const FEATURES = [
  { icon: Cpu, title: "Virtual IoT Hive Simulator", body: "Software-generated temperature, humidity, weight, activity and acoustic telemetry. No hardware, no sensors, no installation." },
  { icon: BrainCircuit, title: "AI-assisted colony analysis", body: "Explainable anomaly detection turns readings into a risk score, health score and a concrete next action." },
  { icon: TrendingUp, title: "Productivity prediction", body: "Least-squares weight projection estimates harvest volume, window and confidence." },
  { icon: Boxes, title: "Batch & supply chain", body: "Create honey batches and record every journey step from harvest to distribution." },
  { icon: Fingerprint, title: "Blockchain proofs", body: "Only the event, its identifier, timestamp and SHA-256 hash are anchored. Everything else stays off-chain." },
  { icon: QrCode, title: "QR verification", body: "Consumers scan a jar and instantly see origin, beekeeper, processing and proof validity." },
];

const STEPS = [
  { icon: Activity, title: "Monitor", body: "Virtual hive telemetry streams into the beekeeper dashboard." },
  { icon: Sparkles, title: "Analyse", body: "AI-assisted rules flag stress early and recommend an action." },
  { icon: Sprout, title: "Harvest", body: "A honey batch is created with a unique traceable batch code." },
  { icon: ShieldCheck, title: "Anchor", body: "Each supply-chain event is hashed and anchored as a proof." },
  { icon: ScanLine, title: "Verify", body: "The consumer scans the QR and validates the full journey." },
];

const IMPACT = [
  { value: "3×", label: "Faster colony-stress response with early alerts" },
  { value: "100%", label: "Of supply-chain events cryptographically anchored" },
  { value: "0", label: "Hardware devices required to run the system" },
  { value: "1 scan", label: "For a consumer to verify origin and quality" },
];

const TECH = [
  "TanStack Start + React 19",
  "TypeScript (strict)",
  "Tailwind CSS + shadcn/ui",
  "Recharts analytics",
  "PostgreSQL + Row Level Security",
  "Supabase-backed auth",
  "SHA-256 Web Crypto proofs",
  "EVM-ready chain abstraction",
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Logo />
          <nav className="hidden items-center gap-6 text-sm text-muted-foreground md:flex">
            <a href="#problem" className="transition-colors hover:text-foreground">Problem</a>
            <a href="#solution" className="transition-colors hover:text-foreground">Solution</a>
            <a href="#how" className="transition-colors hover:text-foreground">How it works</a>
            <a href="#features" className="transition-colors hover:text-foreground">Features</a>
            <a href="#technology" className="transition-colors hover:text-foreground">Technology</a>
          </nav>
          <div className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link to="/verify">Verify honey</Link>
            </Button>
            <Button asChild size="sm">
              <Link to="/auth">Sign in</Link>
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="gradient-field relative overflow-hidden">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-[1.05fr_1fr] lg:items-center lg:py-24">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="outline" className="border-honey/40 bg-honey/15 text-honey-foreground">
                  SIH software prototype
                </Badge>
                <ChainModeBadge />
              </div>
              <h1 className="mt-5 font-display text-4xl font-semibold leading-[1.05] sm:text-5xl lg:text-6xl">
                Honey Chain
                <span className="mt-2 block text-2xl font-normal text-muted-foreground sm:text-3xl">
                  From Hive to Home — <span className="text-gradient-honey font-semibold">Verified. Traceable. Intelligent.</span>
                </span>
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
                Empowering beekeepers with smart hive insights and giving consumers transparent, trustworthy
                honey provenance.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Button asChild size="lg">
                  <Link to="/auth" search={{ demo: true }}>
                    Launch demo <ArrowRight className="size-4" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline">
                  <Link to="/verify/$batchId" params={{ batchId: "HC-2026-00124" }}>
                    <ScanLine className="size-4" /> Verify a sample jar
                  </Link>
                </Button>
              </div>
              <p className="mt-5 text-xs text-muted-foreground">
                100% software prototype — no ESP32, Arduino, sensors or physical hives. IoT is represented by a
                virtual hive simulator.
              </p>
            </div>

            <div className="relative">
              <div className="overflow-hidden rounded-3xl border border-border shadow-lift">
                <img
                  src={heroImage}
                  alt="Rural apiary with wooden bee boxes in a flowering field at golden hour"
                  width={1600}
                  height={1104}
                  className="h-full w-full object-cover"
                />
              </div>
              <Card className="absolute -bottom-6 left-4 w-[248px] shadow-lift sm:left-8">
                <CardContent className="p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Hive H-102</p>
                  <p className="mt-1 font-display text-2xl font-semibold">92<span className="text-base text-muted-foreground">/100</span></p>
                  <p className="text-xs text-muted-foreground">Health score · 34.6°C · 61% RH</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Problem */}
        <section id="problem" className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <SectionHead
              eyebrow="The problem"
              title="Honey Mission supports beekeepers. Trust is still missing."
              body="Rural beekeepers receive bee boxes and extraction toolkits, but the market around them stays opaque."
            />
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PROBLEMS.map((p) => (
                <Card key={p.title} className="h-full shadow-soft">
                  <CardContent className="p-5">
                    <h3 className="font-display text-lg font-semibold">{p.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{p.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Solution */}
        <section id="solution" className="comb-pattern">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <SectionHead
              eyebrow="The solution"
              title="One integrated ecosystem for hive to home"
              body="Honey Chain combines smart beekeeping management with a verifiable provenance record — entirely in software."
            />
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                { icon: Users, title: "Beekeeper", body: "Apiaries, hives, virtual telemetry, AI alerts, harvest prediction and batch creation." },
                { icon: Boxes, title: "Processor / Distributor", body: "Receive batches, log processing, quality checks and distribution events." },
                { icon: ScanLine, title: "Consumer", body: "Scan a QR code and see the complete verified journey — no account needed." },
              ].map((r) => (
                <Card key={r.title} className="h-full border-honey/25 shadow-soft">
                  <CardContent className="p-6">
                    <span className="grid size-11 place-items-center rounded-xl bg-honey/20 text-honey-foreground">
                      <r.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-xl font-semibold">{r.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className="border-y border-border bg-card">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <SectionHead eyebrow="How it works" title="Five steps from colony to consumer" />
            <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
              {STEPS.map((s, i) => (
                <li key={s.title} className="relative rounded-xl border border-border bg-background p-5 shadow-soft">
                  <span className="absolute right-4 top-4 font-display text-3xl font-semibold text-muted-foreground/25">
                    {i + 1}
                  </span>
                  <span className="grid size-10 place-items-center rounded-lg bg-forest/10 text-forest">
                    <s.icon className="size-5" />
                  </span>
                  <h3 className="mt-3 font-display text-lg font-semibold">{s.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Features */}
        <section id="features">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <SectionHead eyebrow="Features" title="Everything the prototype demonstrates" />
            <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((f) => (
                <Card key={f.title} className="h-full shadow-soft transition-shadow hover:shadow-lift">
                  <CardContent className="p-6">
                    <span className="grid size-11 place-items-center rounded-xl bg-muted text-foreground">
                      <f.icon className="size-5" />
                    </span>
                    <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                    <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Impact */}
        <section className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto max-w-6xl px-4 py-16">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-sidebar-primary">Impact</p>
            <h2 className="mt-3 max-w-2xl font-display text-3xl font-semibold sm:text-4xl">
              Fair prices for beekeepers, honest honey for households.
            </h2>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {IMPACT.map((s) => (
                <div key={s.label} className="rounded-xl border border-sidebar-border bg-sidebar-accent p-5">
                  <p className="font-display text-4xl font-semibold text-sidebar-primary">{s.value}</p>
                  <p className="mt-2 text-sm text-sidebar-foreground/80">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Technology */}
        <section id="technology" className="border-b border-border bg-card">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 lg:grid-cols-2">
            <div>
              <SectionHead eyebrow="Technology" title="Built to plug into a real chain later" />
              <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
                The blockchain layer is an abstraction. Today it runs in a clearly labelled{" "}
                <strong className="text-foreground">Simulation Mode</strong>: every traceability event is hashed
                with SHA-256 and stored as a proof record. Database rows are never presented as real on-chain
                transactions. Adding an EVM testnet RPC endpoint and contract address switches the same service to
                real anchoring — no changes to the rest of the app.
              </p>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-forest">On-chain</p>
                  <p className="mt-1 text-sm text-muted-foreground">Batch id, event type, timestamp, data hash.</p>
                </div>
                <div className="rounded-xl border border-border p-4">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Off-chain</p>
                  <p className="mt-1 text-sm text-muted-foreground">Users, sensor data, images, analytics, batch detail.</p>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap content-start gap-2">
              {TECH.map((t) => (
                <Badge key={t} variant="secondary" className="rounded-full px-3 py-1.5 text-sm font-medium">
                  {t}
                </Badge>
              ))}
              <div className="mt-4 w-full rounded-xl border border-border bg-background p-5">
                <p className="flex items-center gap-2 font-display text-lg font-semibold">
                  <LineChart className="size-5 text-primary" /> Demo dataset included
                </p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Beekeeper Rajesh Patil (Maharashtra), hives H-101 to H-104 with 48 hours of readings, and batch
                  HC-2026-00124 with a complete verified journey.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="gradient-field">
          <div className="mx-auto max-w-4xl px-4 py-20 text-center">
            <h2 className="font-display text-3xl font-semibold sm:text-4xl">Run the full demo in two minutes</h2>
            <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
              Sign in as a beekeeper, simulate hive stress, create a batch and verify the jar as a consumer.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg">
                <Link to="/auth" search={{ demo: true }}>
                  Get started <ArrowRight className="size-4" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link to="/verify">Verify a batch code</Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row">
          <Logo />
          <p className="text-xs text-muted-foreground">
            Honey Chain · Software-only prototype · AI-assisted analysis is decision support, not a validated
            veterinary diagnosis.
          </p>
        </div>
      </footer>
    </div>
  );
}

function SectionHead({ eyebrow, title, body }: { eyebrow: string; title: string; body?: string }) {
  return (
    <div className="max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">{eyebrow}</p>
      <h2 className="mt-3 font-display text-3xl font-semibold sm:text-4xl">{title}</h2>
      {body ? <p className="mt-3 text-muted-foreground">{body}</p> : null}
    </div>
  );
}
