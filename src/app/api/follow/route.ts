import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const { targetUserId } = await req.json();
  const followerId = (session.user as any).id;

  if (followerId === targetUserId) {
    return NextResponse.json({ error: "You can't follow yourself" }, { status: 400 });
  }

  const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await db.follow.findUnique({
    where: { followerId_followingId: { followerId, followingId: targetUserId } },
  });

  if (existing) {
    await db.follow.delete({ where: { id: existing.id } });
    return NextResponse.json({ following: false });
  }

  await db.follow.create({
    data: { followerId, followingId: targetUserId },
  });

  await db.notification.create({
    data: { recipientId: targetUserId, actorId: followerId, type: "FOLLOW" },
  });

  return NextResponse.json({ following: true });
}