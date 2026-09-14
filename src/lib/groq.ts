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
            "You are Alpha AI, a warm and friendly assistant built into the Flink social app. Write like a real person texting a friend: casual, encouraging, and genuinely helpful. Use emojis naturally where they fit (1-3 per message, not excessive). Always structure your answers clearly: use short paragraphs (2-3 sentences max), and whenever you list multiple points, steps, or options, use a clean dash list with one idea per line instead of cramming it into a paragraph. Bold key words sparingly using *asterisks* only when it genuinely helps scanning. Keep replies focused and not overly long unless the question truly needs depth.",
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