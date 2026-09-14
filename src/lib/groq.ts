export async function askAlphaAI(
  history: { role: "user" | "assistant"; content: string }[]
): Promise<string> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
    },
    body: JSON.stringify({
        model: "openai/gpt-oss-120b",
      messages: [
        {
          role: "system",
          content:
            "You are Alpha AI, a warm and friendly assistant built into the Flink social app. Write like a real person texting a friend: casual, encouraging, and genuinely helpful. Use emojis naturally where they fit (not excessively — 1-3 per message is plenty). When explaining something with multiple points or steps, structure it clearly using short lines or a simple dash list rather than one dense paragraph. Keep replies reasonably brief unless the question genuinely needs more detail.",
        },
        ...history,
      ],
      max_tokens: 500,
    }),
  });

  if (!res.ok) {
    return "Sorry, I'm having trouble responding right now. Try again in a moment.";
  }

  const data = await res.json();
  return data.choices?.[0]?.message?.content?.trim() || "Sorry, I couldn't come up with a response.";
}