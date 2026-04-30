import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";
import { getCurrentUser } from "@/lib/server-auth";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const db = await getMongoDb();
  const userId = user._id;
  const events = db.collection("events");

  const [totalRuns, scenarioRuns, interviewRuns, conversationRuns, recentEvents] = await Promise.all([
    events.countDocuments({ userId, type: { $in: ["scenario", "interview", "conversation"] } }),
    events.countDocuments({ userId, type: "scenario" }),
    events.countDocuments({ userId, type: "interview" }),
    events.countDocuments({ userId, type: "conversation" }),
    events
      .find({ userId, type: { $in: ["scenario", "interview", "conversation"] } })
      .sort({ createdAt: -1 })
      .limit(8)
      .project({ type: 1, status: 1, createdAt: 1 })
      .toArray(),
  ]);

  return NextResponse.json({
    ok: true,
    stats: {
      totalRuns,
      scenarioRuns,
      interviewRuns,
      conversationRuns,
      recentEvents,
    },
  });
}
