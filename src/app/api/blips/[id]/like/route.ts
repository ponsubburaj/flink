import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

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

  const existing = await db.blipLike.findUnique({
    where: { blipId_userId: { blipId: id, userId } },
  });

  if (existing) {
    await db.blipLike.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await db.blipLike.create({ data: { blipId: id, userId } });

  const blip = await db.blip.findUnique({ where: { id } });
  if (blip && blip.authorId !== userId) {
    const actor = await db.user.findUnique({ where: { id: userId }, select: { username: true } });
    sendPushToUser(blip.authorId, "Flink", `${actor?.username} liked your Blip`, "/").catch(() => {});
  }

  return NextResponse.json({ liked: true });
}