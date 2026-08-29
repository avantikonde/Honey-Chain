import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BarChart3,
  Boxes,
  Grid2x2,
  LayoutDashboard,
  LogOut,
  Menu,
  ScanLine,
  Truck,
} from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth, useProfile } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ChainModeBadge, Logo } from "@/components/honey/brand";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardLayout,
});

const NAV: { to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }[] = [
  { to: "/dashboard", label: "Overview", icon: LayoutDashboard, exact: true },
  { to: "/dashboard/hives", label: "Hives", icon: Grid2x2 },
  { to: "/dashboard/batches", label: "Honey batches", icon: Boxes },
  { to: "/dashboard/supply-chain", label: "Supply chain", icon: Truck },
  { to: "/dashboard/analytics", label: "Analytics", icon: BarChart3 },
];

function DashboardLayout() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile(user?.id);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await supabase.auth.signOut();
    await navigate({ to: "/" });
  };

  const nav = (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = item.exact ? pathname === item.to : pathname.startsWith(item.to);
        return (
          <Link
            key={item.to}
            to={item.to as never}
            onClick={() => setOpen(false)}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-background lg:grid lg:grid-cols-[264px_1fr]">
      <aside className="hidden border-r border-sidebar-border bg-sidebar p-4 lg:sticky lg:top-0 lg:flex lg:h-screen lg:flex-col">
        <div className="px-2 py-2">
          <Logo inverted />
        </div>
        <div className="mt-6 flex-1">{nav}</div>
        <div className="space-y-3 border-t border-sidebar-border pt-4">
          <div className="px-2">
            <p className="truncate text-sm font-medium text-sidebar-foreground">
              {profile?.full_name || user?.email}
            </p>
            <p className="text-xs capitalize text-sidebar-foreground/60">{profile?.role ?? "beekeeper"}</p>
          </div>
          <Button variant="ghost" size="sm" onClick={signOut} className="w-full justify-start text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-3 border-b border-border bg-background/90 px-4 backdrop-blur">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Toggle navigation">
              <Menu className="size-5" />
            </Button>
            <div className="lg:hidden">
              <Logo />
            </div>
            <ChainModeBadge className="hidden sm:inline-flex" />
          </div>
          <Button asChild variant="outline" size="sm">
            <Link to="/verify">
              <ScanLine className="size-4" /> Consumer view
            </Link>
          </Button>
        </header>

        {open ? (
          <div className="border-b border-sidebar-border bg-sidebar p-4 lg:hidden">
            {nav}
            <Button variant="ghost" size="sm" onClick={signOut} className="mt-3 w-full justify-start text-sidebar-foreground/75">
              <LogOut className="size-4" /> Sign out
            </Button>
          </div>
        ) : null}

        <main className="min-w-0 flex-1 p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
