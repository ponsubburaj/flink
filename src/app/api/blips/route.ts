import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createSchema = z.object({
  mediaUrl: z.string().url(),
  mediaType: z.enum(["image", "video"]),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const blip = await db.blip.create({
    data: {
      authorId: (session.user as any).id,
      mediaUrl: parsed.data.mediaUrl,
      mediaType: parsed.data.mediaType,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    },
  });

  return NextResponse.json({ blip }, { status: 201 });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : null;
  if (!userId) {
    return NextResponse.json({ groups: [] });
  }

  const following = await db.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  });
  const relevantIds = [...following.map((f) => f.followingId), userId];

  const blips = await db.blip.findMany({
    where: {
      authorId: { in: relevantIds },
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "asc" },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      views: { where: { viewerId: userId }, select: { id: true } },
    },
  });

  const groupsMap = new Map<string, any>();
  for (const blip of blips) {
    const key = blip.author.id;
    if (!groupsMap.has(key)) {
      groupsMap.set(key, { author: blip.author, blips: [] });
    }
    groupsMap.get(key).blips.push({
      id: blip.id,
      mediaUrl: blip.mediaUrl,
      mediaType: blip.mediaType,
      createdAt: blip.createdAt,
      isViewed: blip.views.length > 0,
    });
  }

  const groups = Array.from(groupsMap.values()).sort((a, b) => {
    if (a.author.id === userId) return -1;
    if (b.author.id === userId) return 1;
    const aAllViewed = a.blips.every((s: any) => s.isViewed);
    const bAllViewed = b.blips.every((s: any) => s.isViewed);
    return Number(aAllViewed) - Number(bAllViewed);
  });

  return NextResponse.json({ groups });
}