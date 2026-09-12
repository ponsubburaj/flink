import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");

  const user = await db.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (type === "following") {
    const following = await db.follow.findMany({
      where: { followerId: user.id },
      include: { following: { select: { id: true, username: true, name: true, avatarUrl: true } } },
    });
    return NextResponse.json({ users: following.map((f) => f.following) });
  }

  const followers = await db.follow.findMany({
    where: { followingId: user.id },
    include: { follower: { select: { id: true, username: true, name: true, avatarUrl: true } } },
  });
  return NextResponse.json({ users: followers.map((f) => f.follower) });
}