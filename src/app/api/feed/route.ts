import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const following = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const followingIds = following.map((f) => f.followingId);
  followingIds.push(userId);

  const posts = await db.post.findMany({
    where: { authorId: { in: followingIds } },
    take: 10,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  const postIds = posts.map((p) => p.id);
  const likedPostIds = new Set(
    (
      await db.like.findMany({
        where: { userId, postId: { in: postIds } },
        select: { postId: true },
      })
    ).map((l) => l.postId)
  );

  const postsWithLikeStatus = posts.map((p) => ({
    ...p,
    isLiked: likedPostIds.has(p.id),
  }));

  return NextResponse.json({
    posts: postsWithLikeStatus,
    nextCursor: posts.length === 10 ? posts[posts.length - 1].id : null,
  });
}