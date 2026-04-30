"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Layers3,
  Moon,
  ServerCog,
  Sun,
  Workflow,
} from "lucide-react";

type Theme = "light" | "dark";

const highlights = [
  {
    icon: Workflow,
    title: "Scenario Intelligence Engine",
    text: "10k+ high-signal incident simulations designed for real customer success escalation patterns.",
  },
  {
    icon: ServerCog,
    title: "Live LLM Evaluations",
    text: "OpenAI-powered dynamic role-play generation with enterprise-focused coaching and scoring.",
  },
  {
    icon: BarChart3,
    title: "Audit-Ready Session Logs",
    text: "Every run exports structured transcripts for QA, coaching and performance calibration.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Prepare",
    desc: "Define scenario themes and operational constraints for your CSM team.",
  },
  {
    step: "02",
    title: "Simulate",
    desc: "Run interview, incident, guideline, and live conversation workflows end-to-end.",
  },
  {
    step: "03",
    title: "Evaluate",
    desc: "Capture LLM-driven assessments with strengths, risks and next-action coaching.",
  },
  {
    step: "04",
    title: "Operationalize",
    desc: "Use exported data for enablement programs, certification, and weekly readiness reviews.",
  },
];

export default function Home() {
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
  const [statusMsg, setStatusMsg] = useState("");

  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined") {
      return "light";
    }
    return window.localStorage.getItem("theme") === "dark" ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    window.localStorage.setItem("theme", theme);
  }, [theme]);

  const themeLabel = useMemo(
    () => (theme === "light" ? "Switch to Dark" : "Switch to Light"),
    [theme],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formEl = event.currentTarget;
    const formData = new FormData(formEl);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      company: String(formData.get("company") || ""),
      message: String(formData.get("message") || ""),
    };

    setStatus("loading");
    setStatusMsg("Submitting...");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Submission failed.");
      }
      setStatus("success");
      setStatusMsg("Thanks. Our team will reach out shortly.");
      formEl.reset();
    } catch (error) {
      setStatus("error");
      setStatusMsg(
        error instanceof Error ? error.message : "Unexpected error.",
      );
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="fixed inset-0 -z-10 grid-bg" />
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <Layers3 className="h-6 w-6" />
            <span className="text-sm font-semibold tracking-[0.2em] uppercase">
              CSM Scenarios
            </span>
          </div>
          <button
            type="button"
            onClick={() => setTheme((t) => (t === "light" ? "dark" : "light"))}
            className="inline-flex items-center gap-2 rounded-full border border-border px-4 py-2 text-sm hover:bg-muted transition"
          >
            {theme === "light" ? (
              <Moon className="h-4 w-4" />
            ) : (
              <Sun className="h-4 w-4" />
            )}
            {themeLabel}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-6">
        <section className="fade-up grid gap-10 py-20 md:grid-cols-2 md:items-center">
          <div>
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs uppercase tracking-[0.2em]">
              Enterprise CSM Readiness Platform
            </p>
            <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
              Train customer success teams for high-stakes production moments.
            </h1>
            <p className="mt-6 max-w-xl text-muted-foreground">
              CSM Scenarios simulates incident pressure, tests communication
              quality, and delivers actionable evaluations across interview,
              simulation, and real-time support conversation workflows.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a
                href="#contact"
                className="inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-3 text-background transition hover:opacity-85"
              >
                Book A Demo <ArrowRight className="h-4 w-4" />
              </a>
              <a
                href="#capabilities"
                className="rounded-full border border-border px-5 py-3 hover:bg-muted transition"
              >
                Explore Capabilities
              </a>
            </div>
          </div>
          <div className="pulse-soft rounded-3xl border border-border bg-muted p-8">
            <div className="mb-6 flex items-center justify-between">
              <span className="text-sm uppercase tracking-[0.14em]">
                Live Ops Snapshot
              </span>
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div className="space-y-4">
              <MetricRow label="Scenario Bank" value="10,500+" />
              <MetricRow label="Simulation Modes" value="4" />
              <MetricRow label="Transcript Export" value="JSON + Markdown" />
              <MetricRow label="Evaluation Engine" value="OpenAI + Rubrics" />
            </div>
          </div>
        </section>

        <section id="capabilities" className="fade-up py-14">
          <div className="mb-8 flex items-center gap-3">
            <ServerCog className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">Core Capabilities</h2>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {highlights.map((item) => (
              <article
                key={item.title}
                className="rounded-2xl border border-border bg-background p-6 transition hover:-translate-y-1"
              >
                <item.icon className="mb-4 h-5 w-5" />
                <h3 className="mb-3 text-lg font-semibold">{item.title}</h3>
                <p className="text-sm text-muted-foreground">{item.text}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="fade-up py-14">
          <div className="mb-8 flex items-center gap-3">
            <AlertTriangle className="h-5 w-5" />
            <h2 className="text-2xl font-semibold">How It Works</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {processSteps.map((step) => (
              <article
                key={step.step}
                className="rounded-2xl border border-border bg-muted p-6"
              >
                <p className="font-mono text-sm">{step.step}</p>
                <h3 className="mt-2 text-xl font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  {step.desc}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="contact" className="fade-up py-16">
          <div className="rounded-3xl border border-border bg-background p-8 md:p-10">
            <h2 className="text-2xl font-semibold">
              Contact The CSM Scenarios Team
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Tell us your training goals and we will help design a deployment
              plan for your organization.
            </p>
            <form
              className="mt-8 grid gap-4 md:grid-cols-2"
              onSubmit={onSubmit}
            >
              <label className="flex flex-col gap-2 text-sm">
                Name
                <input
                  required
                  name="name"
                  className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-foreground/30"
                  placeholder="Jane Doe"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm">
                Work Email
                <input
                  required
                  type="email"
                  name="email"
                  className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-foreground/30"
                  placeholder="jane@company.com"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                Company
                <input
                  name="company"
                  className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-foreground/30"
                  placeholder="Acme Inc."
                />
              </label>
              <label className="flex flex-col gap-2 text-sm md:col-span-2">
                Message
                <textarea
                  required
                  name="message"
                  rows={5}
                  className="rounded-xl border border-border bg-background px-4 py-3 outline-none focus:ring-2 focus:ring-foreground/30"
                  placeholder="We need scenario-driven readiness training for our global support teams."
                />
              </label>
              <div className="md:col-span-2 flex items-center justify-between gap-4">
                <p
                  className={`text-sm ${
                    status === "success"
                      ? "text-green-600 dark:text-green-400"
                      : status === "error"
                        ? "text-red-600 dark:text-red-400"
                        : "text-muted-foreground"
                  }`}
                >
                  {statusMsg}
                </p>
                <button
                  type="submit"
                  disabled={status === "loading"}
                  className="rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition hover:opacity-85 disabled:opacity-50"
                >
                  {status === "loading" ? "Submitting..." : "Send Request"}
                </button>
              </div>
            </form>
          </div>
        </section>
      </main>
    </div>
  );
}

function MetricRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border pb-3 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}
