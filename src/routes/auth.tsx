import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Loader2, ScanLine, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Logo } from "@/components/honey/brand";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — Honey Chain" },
      { name: "description", content: "Sign in or create a Honey Chain account as a beekeeper, processor or consumer." },
      { property: "og:title", content: "Sign in — Honey Chain" },
      { property: "og:description", content: "Access the Honey Chain beekeeping and traceability dashboard." },
    ],
  }),
  component: AuthPage,
});

const DEMO_EMAIL = "rajesh.demo@honeychain.app";
const DEMO_PASSWORD = "HoneyChain#2026";

function AuthPage() {
  const navigate = useNavigate();
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [location, setLocation] = useState("");
  const [role, setRole] = useState("beekeeper");

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const signIn = async (mail: string, pass: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: mail, password: pass });
    if (error) throw new Error(error.message);
    toast.success("Welcome back to Honey Chain");
    await navigate({ to: "/dashboard" });
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("signin");
    try {
      await signIn(email.trim(), password);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setBusy(null);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("signup");
    try {
      const { error } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: fullName, role, location },
        },
      });
      if (error) throw new Error(error.message);
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        toast.success("Account created");
        await navigate({ to: "/dashboard" });
      } else {
        toast.success("Account created — check your inbox to confirm your email.");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not create the account");
    } finally {
      setBusy(null);
    }
  };

  const handleDemo = async () => {
    setBusy("demo");
    try {
      try {
        await signIn(DEMO_EMAIL, DEMO_PASSWORD);
        return;
      } catch {
        // demo account not created yet on this backend — create it once
      }
      const { error } = await supabase.auth.signUp({
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
        options: {
          emailRedirectTo: `${window.location.origin}/dashboard`,
          data: { full_name: "Rajesh Patil", role: "beekeeper", location: "Satara, Maharashtra" },
        },
      });
      if (error) throw new Error(error.message);
      await signIn(DEMO_EMAIL, DEMO_PASSWORD);
    } catch (err) {
      toast.error(
        err instanceof Error ? `Demo sign-in failed: ${err.message}` : "Demo sign-in failed",
      );
    } finally {
      setBusy(null);
    }
  };

  const handleGoogle = async () => {
    setBusy("google");
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        toast.error("Google sign-in failed");
        return;
      }
      if (result.redirected) return;
      await navigate({ to: "/dashboard" });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="gradient-field flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-5">
        <Logo />
        <Button asChild variant="ghost" size="sm">
          <Link to="/verify">
            <ScanLine className="size-4" /> Verify honey
          </Link>
        </Button>
      </header>

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-16">
        <Card className="shadow-lift">
          <CardHeader>
            <CardTitle className="font-display text-2xl">Welcome to Honey Chain</CardTitle>
            <CardDescription>Smart hive management and verified honey provenance.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleDemo} disabled={busy !== null} className="w-full" size="lg">
              {busy === "demo" ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              Enter Demo Mode as Rajesh Patil
            </Button>
            <p className="mt-2 text-center text-xs text-muted-foreground">
              Loads the seeded Maharashtra apiary with hives H-101 to H-104.
            </p>

            <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
              <span className="h-px flex-1 bg-border" /> or <span className="h-px flex-1 bg-border" />
            </div>

            <Tabs defaultValue="signin">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign in</TabsTrigger>
                <TabsTrigger value="signup">Register</TabsTrigger>
              </TabsList>

              <TabsContent value="signin" className="mt-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy !== null}>
                    {busy === "signin" ? <Loader2 className="size-4 animate-spin" /> : null} Sign in
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full name</Label>
                    <Input id="name" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Rajesh Patil" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger id="role">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beekeeper">Beekeeper</SelectItem>
                        <SelectItem value="processor">Processor / Distributor</SelectItem>
                        <SelectItem value="consumer">Consumer</SelectItem>
                        <SelectItem value="admin">Administrator</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="loc">Location</Label>
                    <Input id="loc" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Satara, Maharashtra" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email2">Email</Label>
                    <Input id="email2" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password2">Password</Label>
                    <Input id="password2" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
                  </div>
                  <Button type="submit" className="w-full" disabled={busy !== null}>
                    {busy === "signup" ? <Loader2 className="size-4 animate-spin" /> : null} Create account
                  </Button>
                </form>
              </TabsContent>
            </Tabs>

            <Button onClick={handleGoogle} variant="outline" className="mt-4 w-full" disabled={busy !== null}>
              {busy === "google" ? <Loader2 className="size-4 animate-spin" /> : null} Continue with Google
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
