"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Btn, Card, Input } from "@/components/ui";

export default function LoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    setLoading(false);
    if (res.ok) {
      router.replace("/");
      router.refresh();
    } else {
      setError("Incorrect password");
    }
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <Card className="w-full max-w-sm p-6">
        <div className="mb-5 flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-md bg-accent text-white">
            T
          </span>
          <div>
            <div className="font-semibold">Growth OS</div>
            <div className="text-xs text-muted">TaskBuildAI</div>
          </div>
        </div>
        <form onSubmit={onSubmit} className="space-y-3">
          <Input
            type="password"
            autoFocus
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          {error && <div className="text-sm text-hot">{error}</div>}
          <Btn type="submit" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Btn>
        </form>
      </Card>
    </div>
  );
}
