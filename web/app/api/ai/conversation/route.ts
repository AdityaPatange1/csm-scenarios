import { NextResponse } from "next/server";

import { logEvent, runModel } from "@/lib/ai";
import { getCurrentUser } from "@/lib/server-auth";

type Message = { role: "user" | "assistant"; content: string };

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { messages?: Message[] };
  const messages = body.messages ?? [];
  if (messages.length === 0) {
    return NextResponse.json({ ok: false, error: "Conversation messages are required." }, { status: 400 });
  }

  const transcript = messages.map((m) => `${m.role}: ${m.content}`).join("\n");
  const prompt = `Continue this customer conversation as a realistic enterprise stakeholder during an incident.
Keep response concise, high pressure, and outcome-oriented.

Transcript:
${transcript}
`;

  const result = await runModel(
    "You are an enterprise customer stakeholder in an active production incident.",
    prompt,
  );
  await logEvent({
    userId: user._id,
    type: "conversation",
    status: result.fallback ? "fallback" : "success",
    prompt,
    response: result.text,
    error: result.error,
  });

  return NextResponse.json({ ok: true, output: result.text, fallback: result.fallback, error: result.error });
}
