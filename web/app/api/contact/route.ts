import { NextResponse } from "next/server";

import { getMongoDb } from "@/lib/mongodb";

type ContactPayload = {
  name?: string;
  email?: string;
  company?: string;
  message?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ContactPayload;
    const name = body.name?.trim();
    const email = body.email?.trim();
    const company = body.company?.trim() ?? "";
    const message = body.message?.trim();

    if (!name || !email || !message) {
      return NextResponse.json(
        { ok: false, error: "Name, email and message are required." },
        { status: 400 },
      );
    }

    const db = await getMongoDb();
    await db.collection("contact_submissions").insertOne({
      name,
      email,
      company,
      message,
      createdAt: new Date(),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: "Unable to submit contact request.",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
