import { NextResponse } from "next/server";

import { createSessionToken, sessionExpiryDate, verifyPassword } from "@/lib/auth";
import { getMongoDb } from "@/lib/mongodb";
import { SESSION_COOKIE } from "@/lib/session";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
    };
    const email = body.email?.trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Email and password are required." }, { status: 400 });
    }

    const db = await getMongoDb();
    const user = await db.collection("users").findOne({ email });
    if (!user || !verifyPassword(password, String(user.passwordHash ?? ""))) {
      return NextResponse.json({ ok: false, error: "Invalid credentials." }, { status: 401 });
    }

    const token = createSessionToken();
    const expiresAt = sessionExpiryDate();
    await db.collection("sessions").insertOne({
      userId: user._id,
      token,
      createdAt: new Date(),
      expiresAt,
    });

    const response = NextResponse.json({
      ok: true,
      user: { name: String(user.name ?? ""), email: String(user.email ?? "") },
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
      { ok: false, error: error instanceof Error ? error.message : "Login failed." },
      { status: 500 },
    );
  }
}
