import { NextResponse } from "next/server";

import { logEvent, runModel } from "@/lib/ai";
import { getCurrentUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { topic?: string; level?: string };
  const topic = body.topic?.trim() || "Service outage incident";
  const level = body.level?.trim() || "medium";

  const prompt = `Create a realistic CSM incident scenario for topic "${topic}" at "${level}" difficulty.
Return markdown with sections:
1) Customer Context
2) Incident Timeline
3) Required Actions
4) Success Criteria
5) First Response Draft`;

  const result = await runModel(
    "You are a senior customer success simulation designer.",
    prompt,
  );
  await logEvent({
    userId: user._id,
    type: "scenario",
    status: result.fallback ? "fallback" : "success",
    prompt,
    response: result.text,
    error: result.error,
  });

  return NextResponse.json({ ok: true, output: result.text, fallback: result.fallback, error: result.error });
}
