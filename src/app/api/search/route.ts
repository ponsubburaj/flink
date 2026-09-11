import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();

  if (!q || q.length < 1) {
    return NextResponse.json({ users: [], posts: [], flicks: [] });
  }

  const users = await db.user.findMany({
    where: {
      OR: [
        { username: { contains: q, mode: "insensitive" } },
        { name: { contains: q, mode: "insensitive" } },
      ],
    },
    take: 10,
    select: { id: true, username: true, name: true, avatarUrl: true },
  });

  const posts = await db.post.findMany({
    where: { caption: { contains: q, mode: "insensitive" } },
    take: 12,
    orderBy: { createdAt: "desc" },
    select: { id: true, mediaUrls: true, caption: true },
  });

  const flicks = await db.flick.findMany({
    where: { caption: { contains: q, mode: "insensitive" } },
    take: 12,
    orderBy: { createdAt: "desc" },
    select: { id: true, thumbnailUrl: true, videoUrl: true, caption: true },
  });

  return NextResponse.json({ users, posts, flicks });
}