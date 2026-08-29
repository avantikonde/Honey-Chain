import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ScanLine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Logo } from "@/components/honey/brand";

export const Route = createFileRoute("/verify/")({
  head: () => ({
    meta: [
      { title: "Verify your honey — Honey Chain" },
      { name: "description", content: "Enter or scan a honey batch code to see its origin, harvest date, processing and proof validity." },
      { property: "og:title", content: "Verify your honey — Honey Chain" },
      { property: "og:description", content: "Check where your honey came from in one scan." },
    ],
  }),
  component: VerifyEntry,
});

function VerifyEntry() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");

  return (
    <div className="gradient-field flex min-h-screen flex-col">
      <header className="mx-auto flex w-full max-w-3xl items-center px-4 py-5">
        <Logo />
      </header>
      <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 pb-20">
        <Card className="shadow-lift">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 font-display text-2xl">
              <ScanLine className="size-6 text-primary" /> Verify your honey
            </CardTitle>
            <CardDescription>Scan the QR on the jar, or type the batch code printed on the label.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (code.trim()) void navigate({ to: "/verify/$batchId", params: { batchId: code.trim().toUpperCase() } });
              }}
              className="space-y-3"
            >
              <Input value={code} onChange={(e) => setCode(e.target.value)} placeholder="HC-2026-00124" className="text-center text-lg tracking-wider" />
              <Button type="submit" className="w-full" size="lg">
                Verify batch
              </Button>
            </form>
            <Button variant="outline" className="w-full" onClick={() => void navigate({ to: "/verify/$batchId", params: { batchId: "HC-2026-00124" } })}>
              Try the sample jar HC-2026-00124
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
