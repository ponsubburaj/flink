"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type ConversationItem = {
  id: string;
  otherUser: { id: string; username: string; avatarUrl: string | null };
  lastMessage: { text: string | null; createdAt: string } | null;
};

type UserResult = { id: string; username: string; name: string; avatarUrl: string | null };

export default function InboxPage() {
  const { status } = useSession();
  const router = useRouter();
  const [conversations, setConversations] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setConversations(data.conversations || []);
        setLoading(false);
      });
  }, [status]);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setResults(data.users || []);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => search(query), 250);
    return () => clearTimeout(timeout);
  }, [query, search]);

  async function startConversation(targetUserId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId }),
    });
    const json = await res.json();
    if (res.ok) {
      router.push(`/messages/${json.conversationId}`);
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ash">
        <p>Log in to see your messages.</p>
        <Link href="/login" className="text-flash font-medium hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-10">
      <div className="w-full max-w-lg">
        <h1 className="font-display text-2xl font-semibold text-ink mb-4">Messages</h1>

        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search people to message…"
          className="w-full border border-mist rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash mb-4"
        />

        {query.trim() && (
          <div className="space-y-1 mb-6">
            {results.length === 0 ? (
              <p className="text-ash text-sm">No users found.</p>
            ) : (
              results.map((u) => (
                <button
                  key={u.id}
                  onClick={() => startConversation(u.id)}
                  className="w-full flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-mist/40 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-full bg-mist overflow-hidden flex items-center justify-center flex-shrink-0">
                    {u.avatarUrl ? (
                      <img src={u.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-ash text-sm">{u.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div>
                    <p className="text-ink font-medium text-sm">{u.username}</p>
                    <p className="text-ash text-xs">{u.name}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        )}

        {!query.trim() && (
          loading ? (
            <p className="text-ash text-sm">Loading…</p>
          ) : conversations.length === 0 ? (
            <p className="text-ash text-sm">No conversations yet. Search above to start one.</p>
          ) : (
            <div className="space-y-1">
              {conversations.map((c) => (
                <Link
                  key={c.id}
                  href={`/messages/${c.id}`}
                  className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-mist/40 transition-colors"
                >
                  <div className="w-11 h-11 rounded-full bg-mist overflow-hidden flex items-center justify-center flex-shrink-0">
                    {c.otherUser.avatarUrl ? (
                      <img src={c.otherUser.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-ash text-sm">{c.otherUser.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="text-ink font-medium text-sm">{c.otherUser.username}</p>
                    <p className="text-ash text-xs truncate">{c.lastMessage?.text || "Say hello"}</p>
                  </div>
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}