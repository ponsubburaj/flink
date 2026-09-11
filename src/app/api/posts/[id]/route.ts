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
  const userId = session?.user ? (session.user as any).id : null;

  const post = await db.post.findUnique({
    where: { id },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }

  let isLiked = false;
  if (userId) {
    const like = await db.like.findFirst({ where: { userId, postId: id } });
    isLiked = !!like;
  }

  return NextResponse.json({ post, isLiked });
}
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const post = await db.post.findUnique({ where: { id } });
  if (!post) {
    return NextResponse.json({ error: "Post not found" }, { status: 404 });
  }
  if (post.authorId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await db.post.delete({ where: { id } });
  return NextResponse.json({ success: true });
}