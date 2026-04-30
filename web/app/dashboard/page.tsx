"use client";

import { ComponentType, ReactNode, useEffect, useMemo, useState } from "react";
import { BarChart3, LogOut, MessageSquare, PanelLeft, ShieldCheck, Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";

type Tab = "stats" | "scenario" | "interview" | "conversation";
type EventItem = { _id?: string; type: string; status: string; createdAt: string };
type DashboardStats = {
  totalRuns: number;
  scenarioRuns: number;
  interviewRuns: number;
  conversationRuns: number;
  recentEvents: EventItem[];
};

export default function DashboardPage() {
  const [tab, setTab] = useState<Tab>("stats");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [statsError, setStatsError] = useState("");
  const [busy, setBusy] = useState(false);
  const [output, setOutput] = useState("");
  const [status, setStatus] = useState<{ kind: "idle" | "success" | "error"; msg: string }>({ kind: "idle", msg: "" });
  const [messages, setMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [input, setInput] = useState("");
  const router = useRouter();

  async function loadStats() {
    try {
      const res = await fetch("/api/dashboard/stats");
      const body = (await res.json()) as {
        ok?: boolean;
        error?: string;
        stats?: DashboardStats;
      };
      if (!res.ok || !body.ok || !body.stats) {
        throw new Error(body.error || "Failed to load stats.");
      }
      setStats(body.stats);
      setStatsError("");
    } catch (error) {
      setStatsError(error instanceof Error ? error.message : "Failed to load dashboard stats.");
    }
  }

  useEffect(() => {
    const tick = window.setTimeout(() => {
      void loadStats();
    }, 0);
    return () => window.clearTimeout(tick);
  }, []);

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  }

  async function runModule(path: string, payload: Record<string, unknown>) {
    setBusy(true);
    setStatus({ kind: "idle", msg: "Running..." });
    try {
      const res = await fetch(path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await res.json()) as { ok?: boolean; output?: string; error?: string; fallback?: boolean };
      if (!res.ok || !body.ok) {
        throw new Error(body.error || "Execution failed.");
      }
      setOutput(body.output || "");
      setStatus({
        kind: "success",
        msg: body.fallback
          ? "Completed with fallback response because model was unavailable."
          : "Completed successfully.",
      });
      await loadStats();
    } catch (error) {
      setStatus({ kind: "error", msg: error instanceof Error ? error.message : "Request failed." });
    } finally {
      setBusy(false);
    }
  }

  async function sendConversation() {
    if (!input.trim()) return;
    const nextMessages = [...messages, { role: "user" as const, content: input.trim() }];
    setMessages(nextMessages);
    setInput("");
    setBusy(true);
    try {
      const res = await fetch("/api/ai/conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const body = (await res.json()) as { ok?: boolean; output?: string; error?: string; fallback?: boolean };
      if (!res.ok || !body.ok || !body.output) {
        throw new Error(body.error || "Conversation failed.");
      }
      setMessages([...nextMessages, { role: "assistant", content: body.output }]);
      setStatus({
        kind: "success",
        msg: body.fallback ? "Reply generated using fallback mode." : "Reply generated successfully.",
      });
      await loadStats();
    } catch (error) {
      setStatus({ kind: "error", msg: error instanceof Error ? error.message : "Conversation request failed." });
    } finally {
      setBusy(false);
    }
  }

  const statusClass = useMemo(() => {
    if (status.kind === "error") return "text-red-500";
    if (status.kind === "success") return "text-green-500";
    return "text-muted-foreground";
  }, [status.kind]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex max-w-7xl gap-6 px-4 py-6 md:px-6">
        <aside className="w-72 shrink-0 rounded-2xl border border-border bg-muted p-4">
          <div className="mb-5 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.16em]">
            <PanelLeft className="h-4 w-4" />
            CSM Scenarios
          </div>
          <nav className="space-y-2">
            <SidebarButton active={tab === "stats"} onClick={() => setTab("stats")} icon={BarChart3} label="Dashboard Stats" />
            <SidebarButton active={tab === "scenario"} onClick={() => setTab("scenario")} icon={Sparkles} label="Scenarios" />
            <SidebarButton active={tab === "interview"} onClick={() => setTab("interview")} icon={ShieldCheck} label="Interviews" />
            <SidebarButton active={tab === "conversation"} onClick={() => setTab("conversation")} icon={MessageSquare} label="Conversation AI" />
          </nav>
          <button
            onClick={logout}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl border border-border px-3 py-2 text-sm hover:bg-background"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </aside>

        <section className="flex-1 rounded-2xl border border-border bg-background p-6">
          <p className={`mb-4 text-sm ${statusClass}`}>{status.msg}</p>

          {tab === "stats" && (
            <div>
              <h1 className="text-2xl font-semibold">Readiness Dashboard</h1>
              {statsError ? <p className="mt-4 text-red-500">{statsError}</p> : null}
              {stats ? (
                <>
                  <div className="mt-6 grid gap-3 md:grid-cols-4">
                    <StatCard label="Total Runs" value={stats.totalRuns} />
                    <StatCard label="Scenario Runs" value={stats.scenarioRuns} />
                    <StatCard label="Interview Runs" value={stats.interviewRuns} />
                    <StatCard label="Conversation Runs" value={stats.conversationRuns} />
                  </div>
                  <div className="mt-6 rounded-xl border border-border p-4">
                    <h2 className="font-medium">Recent Events</h2>
                    <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                      {stats.recentEvents.length === 0 ? (
                        <li>No events yet.</li>
                      ) : (
                        stats.recentEvents.map((evt, idx) => (
                          <li key={`${evt.createdAt}-${idx}`} className="flex justify-between border-b border-border pb-2">
                            <span>{evt.type}</span>
                            <span>{evt.status}</span>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>
                </>
              ) : (
                <p className="mt-4 text-muted-foreground">Loading stats...</p>
              )}
            </div>
          )}

          {tab === "scenario" && (
            <AIModule
              title="Scenario Generator"
              description="Generate production-grade CSM scenarios with timeline, constraints and success criteria."
              actionLabel={busy ? "Generating..." : "Generate Scenario"}
              disabled={busy}
              onRun={(form) =>
                runModule("/api/ai/scenario", {
                  topic: form.get("topic"),
                  level: form.get("level"),
                })
              }
              fields={
                <>
                  <input name="topic" required placeholder="Topic, e.g. Payments outage in APAC" className="rounded-xl border border-border px-4 py-3" />
                  <select name="level" className="rounded-xl border border-border px-4 py-3">
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </>
              }
              output={output}
            />
          )}

          {tab === "interview" && (
            <AIModule
              title="Interview Pack Builder"
              description="Generate interview questions, expected answers, and rubric for CSM assessments."
              actionLabel={busy ? "Generating..." : "Generate Interview Pack"}
              disabled={busy}
              onRun={(form) => runModule("/api/ai/interview", { focus: form.get("focus") })}
              fields={<input name="focus" required placeholder="Focus, e.g. Executive incident comms" className="rounded-xl border border-border px-4 py-3" />}
              output={output}
            />
          )}

          {tab === "conversation" && (
            <div>
              <h1 className="text-2xl font-semibold">Conversation AI</h1>
              <p className="mt-1 text-sm text-muted-foreground">Practice stakeholder communication in real time.</p>
              <div className="mt-5 h-80 overflow-auto rounded-xl border border-border bg-muted p-4">
                {messages.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Start a conversation by sending your first message.</p>
                ) : (
                  <div className="space-y-3">
                    {messages.map((m, idx) => (
                      <div key={idx} className={`rounded-lg p-3 text-sm ${m.role === "user" ? "bg-background" : "bg-foreground text-background"}`}>
                        <p className="mb-1 text-xs uppercase opacity-80">{m.role}</p>
                        <p>{m.content}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <div className="mt-4 flex gap-2">
                <input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  className="flex-1 rounded-xl border border-border px-4 py-3"
                  placeholder="Type your CSM response..."
                />
                <button
                  onClick={sendConversation}
                  disabled={busy}
                  className="rounded-xl bg-foreground px-4 py-3 text-sm font-medium text-background disabled:opacity-60"
                >
                  {busy ? "Sending..." : "Send"}
                </button>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function SidebarButton({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm ${
        active ? "bg-foreground text-background" : "hover:bg-background"
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
    </button>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <article className="rounded-xl border border-border bg-muted p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
    </article>
  );
}

function AIModule({
  title,
  description,
  fields,
  actionLabel,
  onRun,
  output,
  disabled,
}: {
  title: string;
  description: string;
  fields: ReactNode;
  actionLabel: string;
  onRun: (formData: FormData) => void;
  output: string;
  disabled: boolean;
}) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onRun(new FormData(e.currentTarget));
        }}
        className="mt-5 grid gap-3"
      >
        {fields}
        <button disabled={disabled} className="w-fit rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-60">
          {actionLabel}
        </button>
      </form>
      <div className="mt-5 rounded-xl border border-border bg-muted p-4">
        <h2 className="mb-2 font-medium">Output</h2>
        <pre className="whitespace-pre-wrap text-sm text-muted-foreground">{output || "Run the module to generate output."}</pre>
      </div>
    </div>
  );
}
