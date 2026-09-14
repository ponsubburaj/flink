import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { sendPushToUser } from "@/lib/push";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "You must be logged in" }, { status: 401 });
  }

  await sendPushToUser((session.user as any).id, "Flink", "This is a test notification 🎉", "/settings");
  return NextResponse.json({ success: true });
}