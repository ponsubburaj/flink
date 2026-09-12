"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Pusher from "pusher-js";

type Message = {
  id: string;
  text: string | null;
  createdAt: string;
  sender: { id: string; username: string; avatarUrl: string | null };
};

export default function ChatThreadPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = (session?.user as any)?.id;

  async function loadMessages() {
    const res = await fetch(`/api/conversations/${id}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
  }

    useEffect(() => {
    if (status !== "authenticated") return;
    loadMessages();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`conversation-${id}`);
    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(`conversation-${id}`);
      pusher.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
      setSending(false);
    if (res.ok) {
      setText("");
    }
  }

  if (status !== "authenticated") {
    return <div className="min-h-screen flex items-center justify-center text-ash">Loading…</div>;
  }

  return (
      <div className="h-[calc(100dvh-4rem)] bg-paper flex flex-col max-w-lg mx-auto">
      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-3">
        {messages.map((m) => {
          const isMine = m.sender.id === myId;
          return (
            <div key={m.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
              <div
                  className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
                  isMine ? "bg-gradient-to-r from-flash to-signal text-white" : "bg-mist text-ink"
                }`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-mist px-6 py-4 flex gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          maxLength={2000}
          className="flex-1 border border-mist rounded-full px-4 py-2 text-sm text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="text-flash font-medium text-sm disabled:opacity-50 px-2"
        >
          Send
        </button>
      </form>
    </div>
  );
}