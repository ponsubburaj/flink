import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { postRateLimit } from "@/lib/ratelimit";

const createPostSchema = z.object({
  caption: z.string().max(2200).optional(),
  mediaUrls: z.array(z.string().url()).min(1).max(10),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const { success } = await postRateLimit.limit((session.user as any).id);
  if (!success) {
    return NextResponse.json(
      { error: "You're posting too quickly. Please slow down." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const parsed = createPostSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const post = await db.post.create({
    data: {
      authorId: (session.user as any).id,
      caption: parsed.data.caption,
      mediaUrls: parsed.data.mediaUrls,
    },
  });

  return NextResponse.json({ post }, { status: 201 });
}