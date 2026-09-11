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
  const { searchParams } = new URL(req.url);
  const cursor = searchParams.get("cursor");

  const flicks = await db.flick.findMany({
    take: 5,
    ...(cursor ? { skip: 1, cursor: { id: cursor } } : {}),
    orderBy: { createdAt: "desc" },
    include: {
      author: { select: { username: true, avatarUrl: true } },
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({
    flicks,
    nextCursor: flicks.length === 5 ? flicks[flicks.length - 1].id : null,
  });
}