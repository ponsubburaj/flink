import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { sendPushToUser } from "@/lib/push";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const { postId, flickId } = await req.json();
  const userId = (session.user as any).id;

  if (!postId && !flickId) {
    return NextResponse.json({ error: "Missing postId or flickId" }, { status: 400 });
  }

  const existing = await db.like.findFirst({
    where: { userId, postId: postId || null, flickId: flickId || null },
  });

  if (existing) {
    await db.like.delete({ where: { id: existing.id } });
    return NextResponse.json({ liked: false });
  }

  await db.like.create({
    data: { userId, postId: postId || undefined, flickId: flickId || undefined },
  });

  let authorId: string | null = null;
  if (postId) {
    const post = await db.post.findUnique({ where: { id: postId }, select: { authorId: true } });
    authorId = post?.authorId || null;
  } else if (flickId) {
    const flick = await db.flick.findUnique({ where: { id: flickId }, select: { authorId: true } });
    authorId = flick?.authorId || null;
  }

    if (authorId && authorId !== userId) {
    await db.notification.create({
      data: {
        recipientId: authorId,
        actorId: userId,
        type: "LIKE",
        postId: postId || undefined,
        flickId: flickId || undefined,
      },
    });

    const actor = await db.user.findUnique({ where: { id: userId }, select: { username: true } });
    sendPushToUser(authorId, "Flink", `${actor?.username} liked your post`, postId ? `/post/${postId}` : "/flicks").catch(() => {});
  }
  

  return NextResponse.json({ liked: true });
}