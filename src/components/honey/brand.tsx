import { Link } from "@tanstack/react-router";
import { Hexagon, ShieldCheck, TriangleAlert, CircleCheck, CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { chainMode } from "@/lib/honey";

export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <Link to="/" className="group inline-flex items-center gap-2.5">
      <span className="gradient-honey relative grid size-9 place-items-center rounded-xl shadow-soft">
        <Hexagon className="size-5 text-honey-foreground" strokeWidth={2.2} />
      </span>
      <span
        className={cn(
          "font-display text-lg font-semibold tracking-tight",
          inverted ? "text-sidebar-foreground" : "text-foreground",
        )}
      >
        Honey<span className="text-gradient-honey">Chain</span>
      </span>
    </Link>
  );
}

export function ChainModeBadge({ className }: { className?: string }) {
  const mode = chainMode();
  return (
    <Badge
      variant="outline"
      className={cn(
        "gap-1.5 border-forest/30 bg-forest/10 font-medium text-forest",
        className,
      )}
    >
      <ShieldCheck className="size-3.5" />
      {mode === "testnet" ? "Blockchain: EVM testnet" : "Blockchain: Simulation Mode"}
    </Badge>
  );
}

const STATUS_STYLES: Record<string, string> = {
  healthy: "border-success/30 bg-success/12 text-success",
  attention: "border-warning/40 bg-warning/15 text-warning",
  critical: "border-destructive/30 bg-destructive/12 text-destructive",
  passed: "border-success/30 bg-success/12 text-success",
  pending: "border-warning/40 bg-warning/15 text-warning",
  failed: "border-destructive/30 bg-destructive/12 text-destructive",
};

const STATUS_TEXT: Record<string, string> = {
  healthy: "Healthy",
  attention: "Attention Required",
  critical: "Critical",
  passed: "Passed",
  pending: "Pending",
  failed: "Failed",
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const Icon = status === "healthy" || status === "passed" ? CircleCheck : status === "critical" || status === "failed" ? CircleAlert : TriangleAlert;
  return (
    <Badge
      variant="outline"
      className={cn("gap-1.5 font-medium", STATUS_STYLES[status] ?? "border-border bg-muted text-muted-foreground", className)}
    >
      <Icon className="size-3.5" />
      {STATUS_TEXT[status] ?? status}
    </Badge>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon,
  tone = "default",
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  icon?: ReactNode;
  tone?: "default" | "honey" | "forest" | "warning" | "destructive";
}) {
  const toneRing: Record<string, string> = {
    default: "bg-muted text-muted-foreground",
    honey: "bg-honey/20 text-honey-foreground",
    forest: "bg-forest/12 text-forest",
    warning: "bg-warning/18 text-warning",
    destructive: "bg-destructive/12 text-destructive",
  };
  return (
    <Card className="shadow-soft">
      <CardContent className="flex items-start justify-between gap-3 p-5">
        <div className="min-w-0">
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-2 font-display text-3xl font-semibold leading-none">{value}</p>
          {hint ? <p className="mt-2 text-xs text-muted-foreground">{hint}</p> : null}
        </div>
        {icon ? <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", toneRing[tone])}>{icon}</span> : null}
      </CardContent>
    </Card>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon?: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card/60 px-6 py-14 text-center">
      {icon ? <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-muted text-muted-foreground">{icon}</span> : null}
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
