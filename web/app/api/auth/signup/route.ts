import { NextResponse } from "next/server";

import { createSessionToken, hashPassword, sessionExpiryDate } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
    };

    const name = body.name?.trim();
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!name || !email || password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Provide name, valid email, and password (min 8 chars)." },
        { status: 400 },
      );
    }

    const db = await getMongoDb();
    const existing = await db.collection("users").findOne({ email });
    if (existing) {
      return NextResponse.json({ ok: false, error: "An account with this email already exists." }, { status: 409 });
    }

    const passwordHash = hashPassword(password);
    const userInsert = await db.collection("users").insertOne({
      name,
      email,
      passwordHash,
      createdAt: new Date(),
    });

    const token = createSessionToken();
    const expiresAt = sessionExpiryDate();
    await db.collection("sessions").insertOne({
      userId: userInsert.insertedId,
      token,
      createdAt: new Date(),
      expiresAt,
    });

    const response = NextResponse.json({
      ok: true,
      user: { name, email },
    });
    response.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      expires: expiresAt,
    });
    return response;
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : "Signup failed." },
      { status: 500 },
    );
  }
}
