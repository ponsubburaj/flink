import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createCommentSchema = z.object({
  text: z.string().min(1).max(500),
  postId: z.string().optional(),
  flickId: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createCommentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { text, postId, flickId } = parsed.data;
  if (!postId && !flickId) {
    return NextResponse.json({ error: "Missing postId or flickId" }, { status: 400 });
  }

  const userId = (session.user as any).id;

  const comment = await db.comment.create({
    data: { text, userId, postId, flickId },
    include: { user: { select: { username: true, avatarUrl: true } } },
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
      data: { recipientId: authorId, actorId: userId, type: "COMMENT", postId, flickId },
    });
  }

  return NextResponse.json({ comment }, { status: 201 });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const postId = searchParams.get("postId");
  const flickId = searchParams.get("flickId");

  if (!postId && !flickId) {
    return NextResponse.json({ error: "Missing postId or flickId" }, { status: 400 });
  }

  const comments = await db.comment.findMany({
    where: postId ? { postId } : { flickId },
    orderBy: { createdAt: "asc" },
    include: { user: { select: { username: true, avatarUrl: true } } },
  });

  return NextResponse.json({ comments });
}