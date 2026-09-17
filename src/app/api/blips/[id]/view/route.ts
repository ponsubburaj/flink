import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const viewerId = (session.user as any).id;

  await db.blipView.upsert({
    where: { blipId_viewerId: { blipId: id, viewerId } },
    update: {},
    create: { blipId: id, viewerId },
  });

  return NextResponse.json({ success: true });
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  const blip = await db.blip.findUnique({ where: { id } });
  if (!blip || blip.authorId !== (session.user as any).id) {
    return NextResponse.json({ error: "Not authorized" }, { status: 403 });
  }

  const views = await db.blipView.findMany({
    where: { blipId: id },
    orderBy: { createdAt: "desc" },
    include: { viewer: { select: { username: true, avatarUrl: true } } },
  });

  return NextResponse.json({ views: views.map((v) => v.viewer) });
}