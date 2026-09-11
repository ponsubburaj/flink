import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;

  const user = await db.user.findUnique({ where: { username } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const posts = await db.post.findMany({
    where: { authorId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      mediaUrls: true,
      caption: true,
      createdAt: true,
      _count: { select: { likes: true, comments: true } },
    },
  });

  return NextResponse.json({ posts });
}