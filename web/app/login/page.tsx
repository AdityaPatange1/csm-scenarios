"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "loading" | "error">("idle");
  const [message, setMessage] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    setStatus("loading");
    setMessage("Signing in...");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: String(formData.get("email") || ""),
          password: String(formData.get("password") || ""),
        }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Login failed.");
      }
      router.push("/dashboard");
      router.refresh();
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Unexpected login error.");
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-md items-center px-6">
      <div className="w-full rounded-2xl border border-border bg-background p-8">
        <h1 className="text-2xl font-semibold">Sign in</h1>
        <p className="mt-2 text-sm text-muted-foreground">Access your CSM Scenarios workspace.</p>
        <form onSubmit={onSubmit} className="mt-6 space-y-4">
          <input
            required
            name="email"
            type="email"
            placeholder="Work email"
            className="w-full rounded-xl border border-border px-4 py-3"
          />
          <input
            required
            name="password"
            type="password"
            placeholder="Password"
            className="w-full rounded-xl border border-border px-4 py-3"
          />
          <p className={status === "error" ? "text-sm text-red-500" : "text-sm text-muted-foreground"}>{message}</p>
          <button
            disabled={status === "loading"}
            className="w-full rounded-xl bg-foreground px-4 py-3 font-medium text-background disabled:opacity-60"
          >
            {status === "loading" ? "Signing in..." : "Sign in"}
          </button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/signup" className="underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}
