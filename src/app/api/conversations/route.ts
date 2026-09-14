import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const { targetUserId } = await req.json();
  const userId = (session.user as any).id;

  if (targetUserId === userId) {
    return NextResponse.json({ error: "Can't message yourself" }, { status: 400 });
  }

  const targetUser = await db.user.findUnique({ where: { id: targetUserId } });
  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const existing = await db.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: targetUserId } } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const conversation = await db.conversation.create({
    data: {
      participants: {
        create: [{ userId }, { userId: targetUserId }],
      },
    },
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const userId = (session.user as any).id;

  const conversations = await db.conversation.findMany({
    where: { participants: { some: { userId } } },
    include: {
      participants: {
        where: { userId: { not: userId } },
        include: { user: { select: { id: true, username: true, avatarUrl: true } } },
      },
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
    orderBy: { messages: { _count: "desc" } },
  });

    const formatted = conversations
    .map((c) => ({
      id: c.id,
      otherUser: c.participants[0]?.user || null,
      lastMessage: c.messages[0] || null,
    }))
    .filter((c) => c.otherUser)
    .sort((a, b) => {
      const aTime = a.lastMessage?.createdAt ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const bTime = b.lastMessage?.createdAt ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return bTime - aTime;
    });

  // Some earlier test conversations may have created duplicate threads with the
  // same person before we added proper existence-checks — collapse to one per person,
  // keeping whichever thread was most recently active.
  const seen = new Set<string>();
  const deduped = formatted.filter((c) => {
    if (!c.otherUser || seen.has(c.otherUser.id)) return false;
    seen.add(c.otherUser.id);
    return true;
  });

  return NextResponse.json({ conversations: deduped });
}