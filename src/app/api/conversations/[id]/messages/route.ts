import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { pusherServer } from "@/lib/pusher";
import { sendPushToUser } from "@/lib/push";
import { askAlphaAI } from "@/lib/groq";
import { ALPHA_AI_USERNAME } from "@/lib/alphaAi";

async function verifyParticipant(conversationId: string, userId: string) {
  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId, userId } },
  });
  return !!participant;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const isParticipant = await verifyParticipant(id, userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
  });

  return NextResponse.json({ messages });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const isParticipant = await verifyParticipant(id, userId);
  if (!isParticipant) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const { text } = await req.json();
  if (!text || typeof text !== "string" || !text.trim()) {
    return NextResponse.json({ error: "Message can't be empty" }, { status: 400 });
  }
  if (text.length > 2000) {
    return NextResponse.json({ error: "Message too long" }, { status: 400 });
  }

  const message = await db.message.create({
    data: { conversationId: id, senderId: userId, text: text.trim() },
    include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
  });

  await pusherServer.trigger(`conversation-${id}`, "new-message", message);

  const otherParticipants = await db.conversationParticipant.findMany({
    where: { conversationId: id, userId: { not: userId } },
    include: { user: { select: { id: true, username: true } } },
  });

  const alphaParticipant = otherParticipants.find((p) => p.user.username === ALPHA_AI_USERNAME);
  const humanParticipants = otherParticipants.filter((p) => p.user.username !== ALPHA_AI_USERNAME);

  if (humanParticipants.length > 0) {
    await db.notification.createMany({
      data: humanParticipants.map((p) => ({
        recipientId: p.userId,
        actorId: userId,
        type: "MESSAGE" as const,
      })),
    });

    const sender = await db.user.findUnique({ where: { id: userId }, select: { username: true } });
    humanParticipants.forEach((p) => {
      sendPushToUser(p.userId, sender?.username || "New message", text.trim().slice(0, 80), `/messages/${id}`).catch(() => {});
    });
  }

  if (alphaParticipant) {
    const recentMessages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    const history = recentMessages
      .reverse()
      .map((m) => ({
        role: m.senderId === alphaParticipant.userId ? ("assistant" as const) : ("user" as const),
        content: m.text || "",
      }));

    const replyText = await askAlphaAI(history);

    const aiMessage = await db.message.create({
      data: { conversationId: id, senderId: alphaParticipant.userId, text: replyText },
      include: { sender: { select: { id: true, username: true, avatarUrl: true } } },
    });

    await pusherServer.trigger(`conversation-${id}`, "new-message", aiMessage);
  }

  return NextResponse.json({ message }, { status: 201 });
}