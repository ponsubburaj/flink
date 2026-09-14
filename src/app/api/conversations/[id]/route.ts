import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

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

  const participant = await db.conversationParticipant.findUnique({
    where: { conversationId_userId: { conversationId: id, userId } },
  });
  if (!participant) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const other = await db.conversationParticipant.findFirst({
    where: { conversationId: id, userId: { not: userId } },
    include: { user: { select: { username: true, avatarUrl: true } } },
  });

  return NextResponse.json({ otherUser: other?.user || null });
}