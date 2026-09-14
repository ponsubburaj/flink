"use client";

import { useEffect, useState, useCallback } from "react";

type Person = { id: string; username: string; avatarUrl: string | null };

export default function ShareSheet({
  shareUrl,
  caption,
  onClose,
}: {
  shareUrl: string;
  caption?: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const [recent, setRecent] = useState<{ conversationId: string; user: Person }[]>([]);
  const [searchResults, setSearchResults] = useState<Person[]>([]);
  const [loading, setLoading] = useState(true);
  const [sentTo, setSentTo] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetch("/api/conversations")
      .then((res) => res.json())
      .then((data) => {
        setRecent((data.conversations || []).map((c: any) => ({ conversationId: c.id, user: c.otherUser })));
        setLoading(false);
      });
  }, []);

  const search = useCallback(async (q: string) => {
    if (!q.trim()) return setSearchResults([]);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
    const data = await res.json();
    setSearchResults(data.users || []);
  }, []);

  useEffect(() => {
    const t = setTimeout(() => search(query), 250);
    return () => clearTimeout(t);
  }, [query, search]);

  async function sendToConversation(conversationId: string, key: string) {
    await fetch(`/api/conversations/${conversationId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: `Check this out: ${shareUrl}` }),
    });
    setSentTo((prev) => new Set(prev).add(key));
  }

  async function sendToUser(userId: string) {
    const res = await fetch("/api/conversations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ targetUserId: userId }),
    });
    const json = await res.json();
    if (res.ok) await sendToConversation(json.conversationId, userId);
  }

  async function handleNativeShare() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Flink", text: caption || "Check this out", url: shareUrl });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareUrl);
      alert("Link copied to clipboard");
    }
  }

  const list = query.trim()
    ? searchResults.map((u) => ({ key: u.id, user: u, action: () => sendToUser(u.id) }))
    : recent.map((r) => ({ key: r.conversationId, user: r.user, action: () => sendToConversation(r.conversationId, r.conversationId) }));

  return (
        <div className="fixed inset-0 bg-black/60 flex items-end z-[200]" onClick={onClose}>
      <div className="bg-paper w-full max-h-[75%] rounded-t-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-mist">
          <span className="font-medium text-ink text-sm">Share</span>
          <button onClick={onClose} className="text-ash text-sm">Close</button>
        </div>
        <div className="px-4 pt-3">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search friends…"
            className="w-full border border-mist rounded-full px-4 py-2 text-sm text-ink focus:outline-none focus:border-flash"
          />
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3">
          {loading && !query.trim() ? (
            <p className="text-ash text-sm">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-ash text-sm">{query.trim() ? "No users found." : "No recent chats. Search above."}</p>
          ) : (
            <div className="space-y-1">
              {list.map((item) => (
                <div key={item.key} className="flex items-center gap-3 py-2">
                  <div className="w-10 h-10 rounded-full bg-mist overflow-hidden flex items-center justify-center flex-shrink-0">
                    {item.user.avatarUrl ? (
                      <img src={item.user.avatarUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-ash text-sm">{item.user.username.charAt(0).toUpperCase()}</span>
                    )}
                  </div>
                  <span className="flex-1 text-ink text-sm font-medium">{item.user.username}</span>
                  <button
                    onClick={item.action}
                    disabled={sentTo.has(item.key)}
                    className={`text-sm font-medium rounded-full px-4 py-1.5 ${sentTo.has(item.key) ? "bg-mist text-ash" : "bg-gradient-to-r from-flash to-signal text-white"}`}
                  >
                    {sentTo.has(item.key) ? "Sent" : "Send"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="border-t border-mist px-4 py-3">
          <button onClick={handleNativeShare} className="w-full text-center text-flash font-medium text-sm py-2">
            More options
          </button>
        </div>
      </div>
    </div>
  );
}