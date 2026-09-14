import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { getOrCreateAlphaAI } from "@/lib/alphaAi";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const alphaAI = await getOrCreateAlphaAI();

  const existing = await db.conversation.findFirst({
    where: {
      isGroup: false,
      AND: [
        { participants: { some: { userId } } },
        { participants: { some: { userId: alphaAI.id } } },
      ],
    },
  });

  if (existing) {
    return NextResponse.json({ conversationId: existing.id });
  }

  const conversation = await db.conversation.create({
    data: { participants: { create: [{ userId }, { userId: alphaAI.id }] } },
  });

  return NextResponse.json({ conversationId: conversation.id }, { status: 201 });
}