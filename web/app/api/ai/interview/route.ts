import { NextResponse } from "next/server";

import { logEvent, runModel } from "@/lib/ai";
import { getCurrentUser } from "@/lib/server-auth";

export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json()) as { focus?: string };
  const focus = body.focus?.trim() || "incident communication";
  const prompt = `Generate a CSM interview pack focused on "${focus}".
Return:
- 5 interview questions
- what good answers include
- evaluation rubric with score bands`;

  const result = await runModel(
    "You are a principal CSM interviewer and trainer.",
    prompt,
  );
  await logEvent({
    userId: user._id,
    type: "interview",
    status: result.fallback ? "fallback" : "success",
    prompt,
    response: result.text,
    error: result.error,
  });

  return NextResponse.json({ ok: true, output: result.text, fallback: result.fallback, error: result.error });
}
