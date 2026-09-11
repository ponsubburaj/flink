import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const updateSchema = z.object({
  name: z.string().min(1).max(50),
  bio: z.string().max(150).optional(),
  username: z
    .string()
    .min(3)
    .max(20)
    .regex(/^[a-zA-Z0-9_.]+$/),
  avatarUrl: z.string().url().optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = updateSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const userId = (session.user as any).id;
  const { username } = parsed.data;

  const existing = await db.user.findFirst({
    where: { username, NOT: { id: userId } },
  });

  if (existing) {
    return NextResponse.json({ error: "Username already taken" }, { status: 409 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: parsed.data,
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
    },
  });

  return NextResponse.json({ user: updated });
}