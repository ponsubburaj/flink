import { NextResponse } from "next/server";
import { z } from "zod";
import argon2 from "argon2";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const schema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const user = await db.user.findUnique({ where: { id: (session.user as any).id } });
  if (!user?.passwordHash) {
    return NextResponse.json({ error: "Account not found" }, { status: 404 });
  }

  const isValid = await argon2.verify(user.passwordHash, parsed.data.currentPassword);
  if (!isValid) {
    return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
  }

  const newHash = await argon2.hash(parsed.data.newPassword);
  await db.user.update({ where: { id: user.id }, data: { passwordHash: newHash } });

  return NextResponse.json({ success: true });
}