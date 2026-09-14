"use client";

import { useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import Pusher from "pusher-js";

type Message = {
  id: string;
  text: string | null;
  createdAt: string;
  sender: { id: string; username: string; avatarUrl: string | null };
};

type OtherUser = { username: string; avatarUrl: string | null };

export default function ChatThreadPage() {
  const { id } = useParams();
  const { data: session, status } = useSession();
  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(null);
  const [text, setText] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const myId = (session?.user as any)?.id;

    async function loadMessages() {
    const res = await fetch(`/api/conversations/${id}/messages`);
    if (!res.ok) return;
    const data = await res.json();
    setMessages(data.messages || []);
  }

  async function loadConversationInfo() {
    const res = await fetch(`/api/conversations/${id}`);
    if (!res.ok) return;
    const data = await res.json();
    if (data.otherUser) setOtherUser(data.otherUser);
  }

    useEffect(() => {
    if (status !== "authenticated") return;
    loadMessages();
    loadConversationInfo();

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });
    const channel = pusher.subscribe(`conversation-${id}`);
    channel.bind("new-message", (newMessage: Message) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMessage.id)) return prev;
        return [...prev, newMessage];
      });
      if (newMessage.sender.id !== myId) setOtherUser(newMessage.sender);
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
    const trimmed = text.trim();
    if (!trimmed || !myId) return;

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: Message = {
      id: tempId,
      text: trimmed,
      createdAt: new Date().toISOString(),
      sender: {
        id: myId,
        username: (session?.user as any)?.username || "",
        avatarUrl: (session?.user as any)?.image || null,
      },
    };

    setMessages((prev) => [...prev, optimisticMessage]);
    setText("");

    const res = await fetch(`/api/conversations/${id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: trimmed }),
    });

    if (res.ok) {
      const data = await res.json();
      setMessages((prev) => {
        const alreadyDelivered = prev.some((m) => m.id === data.message.id);
        if (alreadyDelivered) {
          return prev.filter((m) => m.id !== tempId);
        }
        return prev.map((m) => (m.id === tempId ? data.message : m));
      });
    } else {
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
      setText(trimmed);
    }
  }

  if (status !== "authenticated") {
    return <div className="min-h-screen flex items-center justify-center text-ash">Loading…</div>;
  }

  return (
    <div className="h-[calc(100dvh-4rem)] bg-paper flex flex-col max-w-lg mx-auto">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-mist">
        <Link href="/messages" className="text-ink text-lg">←</Link>
        {otherUser && (
          <Link href={`/${otherUser.username}`} className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-flash to-signal p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-paper overflow-hidden flex items-center justify-center">
                {otherUser.avatarUrl ? (
                  <img src={otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-flash text-xs">{otherUser.username.charAt(0).toUpperCase()}</span>
                )}
              </div>
            </div>
            <span className="font-medium text-ink text-sm">{otherUser.username}</span>
          </Link>
        )}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-2.5">
        {messages.map((m, i) => {
          const isMine = m.sender.id === myId;
          const isPending = m.id.startsWith("temp-");
          const prevSameSender = i > 0 && messages[i - 1].sender.id === m.sender.id;
          return (
            <div
              key={m.id}
              className={`flex ${isMine ? "justify-end" : "justify-start"} ${prevSameSender ? "mt-0.5" : "mt-2"}`}
            >
              <div
                      className={`max-w-[72%] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                  isMine
                    ? "bg-gradient-to-r from-flash to-signal text-white rounded-2xl rounded-br-md"
                    : "bg-mist text-ink rounded-2xl rounded-bl-md"
                } ${isPending ? "opacity-60" : ""}`}
              >
                {m.text}
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="border-t border-mist px-4 py-3 flex gap-2 items-center">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Message…"
          maxLength={2000}
          className="flex-1 border border-mist rounded-full px-4 py-2.5 text-sm text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          className="bg-gradient-to-r from-flash to-signal text-white rounded-full w-9 h-9 flex items-center justify-center disabled:opacity-40 flex-shrink-0"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M2 21l21-9L2 3v7l15 2-15 2z" /></svg>
        </button>
      </form>
    </div>
  );
}