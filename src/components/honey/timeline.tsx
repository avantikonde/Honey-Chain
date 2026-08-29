import { BadgeCheck, Boxes, FlaskConical, Package, Truck, Sprout, Droplets, Store } from "lucide-react";
import type { ComponentType } from "react";
import { cn } from "@/lib/utils";
import { eventLabel, formatDateTime } from "@/lib/honey";
import type { TraceEvent } from "@/lib/data";

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  harvest: Sprout,
  extraction: Droplets,
  processing: Boxes,
  quality_check: FlaskConical,
  packaging: Package,
  distribution: Truck,
  retail: Store,
};

export function TraceTimeline({ events, compact = false }: { events: TraceEvent[]; compact?: boolean }) {
  if (events.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No journey events recorded yet.
      </p>
    );
  }

  return (
    <ol className="relative space-y-0">
      {events.map((event, i) => {
        const Icon = ICONS[event.event_type] ?? Boxes;
        const last = i === events.length - 1;
        return (
          <li key={event.id} className="relative flex gap-4 pb-6 last:pb-0">
            {!last && <span className="absolute left-[19px] top-11 bottom-0 w-px bg-border" aria-hidden />}
            <span
              className={cn(
                "z-10 grid size-10 shrink-0 place-items-center rounded-full border",
                event.verified
                  ? "border-forest/25 bg-forest/10 text-forest"
                  : "border-border bg-muted text-muted-foreground",
              )}
            >
              <Icon className="size-[18px]" />
            </span>
            <div className="min-w-0 flex-1 rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h4 className="font-display text-base font-semibold capitalize">{eventLabel(event.event_type)}</h4>
                {event.verified ? (
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-forest">
                    <BadgeCheck className="size-3.5" /> Verified
                  </span>
                ) : null}
              </div>
              <p className="mt-0.5 text-sm text-muted-foreground">{event.actor}</p>
              {!compact && event.notes ? <p className="mt-1.5 text-sm">{event.notes}</p> : null}
              <p className="mt-2 text-xs text-muted-foreground">
                {formatDateTime(event.occurred_at)}
                {event.location ? ` · ${event.location}` : ""}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
