import { db } from "@/lib/db";

export const ALPHA_AI_USERNAME = "alphaai";

export async function getOrCreateAlphaAI() {
  return db.user.upsert({
    where: { username: ALPHA_AI_USERNAME },
    update: {},
    create: {
      username: ALPHA_AI_USERNAME,
      email: "alphaai@flink.internal",
      name: "Alpha AI",
      bio: "Ask me anything ✨",
      avatarUrl: "/alpha-ai-avatar.png",
    },
  });
}