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
      model: "llama-3.3-70b-versatile",
      messages: [
        {
          role: "system",
          content:
            "You are Alpha AI, a friendly and helpful assistant built into the Flink social app. Keep replies conversational, warm, and reasonably brief, like a real chat message rather than an essay.",
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