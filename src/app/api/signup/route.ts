import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { db } from "@/lib/db";
import { authRateLimit, getClientIp } from "@/lib/ratelimit";

const signupSchema = z.object({
  email: z.string().email(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_.]+$/, "Username can only contain letters, numbers, underscores, and dots"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(50),
});

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const { success } = await authRateLimit.limit(ip);
    if (!success) {
      return NextResponse.json(
        { error: "Too many attempts. Please try again in a minute." },
        { status: 429 }
      );
    }

    const body = await req.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0].message },
        { status: 400 }
      );
    }

    const { email, username, password, name } = parsed.data;
    const normalizedEmail = email.toLowerCase();

    const existingUser = await db.user.findFirst({
      where: {
        OR: [{ email: normalizedEmail }, { username }],
      },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email or username already in use" },
        { status: 409 }
      );
    }

    const passwordHash = await argon2.hash(password);

    const user = await db.user.create({
      data: {
        email: normalizedEmail,
        username,
        name,
        passwordHash,
      },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Signup error:", error);
    return NextResponse.json(
      { error: "Something went wrong. Please try again." },
      { status: 500 }
    );
  }
}