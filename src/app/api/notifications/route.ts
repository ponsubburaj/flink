import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const notifications = await db.notification.findMany({
    where: { recipientId: userId },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      actor: { select: { username: true, avatarUrl: true } },
    },
  });

  const unreadCount = await db.notification.count({
    where: { recipientId: userId, read: false },
  });

  return NextResponse.json({ notifications, unreadCount });
}

export async function PATCH() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  await db.notification.updateMany({
    where: { recipientId: userId, read: false },
    data: { read: true },
  });

  return NextResponse.json({ success: true });
}