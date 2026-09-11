import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

const createFlickSchema = z.object({
  caption: z.string().max(2200).optional(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().max(180).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = createFlickSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const flick = await db.flick.create({
    data: {
      authorId: (session.user as any).id,
      caption: parsed.data.caption,
      videoUrl: parsed.data.videoUrl,
      thumbnailUrl: parsed.data.thumbnailUrl,
      duration: parsed.data.duration,
    },
  });

  return NextResponse.json({ flick }, { status: 201 });
}

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  const userId = session?.user ? (session.user as any).id : null;

  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const flicks = await db.flick.findMany({
    take: 5,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { id: true, username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  let likedIds = new Set<string>();
  if (userId) {
    const flickIds = flicks.map((f) => f.id);
    const liked = await db.like.findMany({
      where: { userId, flickId: { in: flickIds } },
      select: { flickId: true },
    });
    likedIds = new Set(liked.map((l) => l.flickId!));
  }

  const flicksWithLikeStatus = flicks.map((f) => ({
    ...f,
    isLiked: likedIds.has(f.id),
  }));

  return NextResponse.json({
    flicks: flicksWithLikeStatus,
    nextCursor: flicks.length === 5 ? flicks[flicks.length - 1].id : null,
  });
}

export async function DELETE(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const flick = await db.flick.findUnique({ where: { id } });
  if (!flick) {
    return NextResponse.json({ error: "Flick not found" }, { status: 404 });
  }
  if (flick.authorId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  await db.flick.delete({ where: { id } });
  return NextResponse.json({ success: true });
}