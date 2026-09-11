import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const session = await getServerSession(authOptions);
  const viewerId = session?.user ? (session.user as any).id : null;

  const user = await db.user.findUnique({
    where: { username },
    select: {
      id: true,
      username: true,
      name: true,
      bio: true,
      avatarUrl: true,
      createdAt: true,
      _count: {
        select: { posts: true, flicks: true, followers: true, following: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  let isFollowing = false;
  if (viewerId && viewerId !== user.id) {
    const follow = await db.follow.findUnique({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: user.id },
      },
    });
    isFollowing = !!follow;
  }

  return NextResponse.json({
    user,
    isOwnProfile: viewerId === user.id,
    isFollowing,
  });
}