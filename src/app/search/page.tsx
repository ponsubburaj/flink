"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";

type UserResult = { id: string; username: string; name: string; avatarUrl: string | null };
type PostResult = { id: string; mediaUrls: string[]; caption: string | null; createdAt: string };
type FlickResult = { id: string; thumbnailUrl: string | null; videoUrl: string; caption: string | null; createdAt: string };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "users">("all");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [flicks, setFlicks] = useState<FlickResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q.trim())}`);
    const data = await res.json();
    setUsers(data.users || []);
    setPosts(data.posts || []);
    setFlicks(data.flicks || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => runSearch(query), 300);
    return () => clearTimeout(timeout);
  }, [query, runSearch]);

  const combined = useMemo(() => {
    const items = [
      ...posts.map((p) => ({ type: "post" as const, id: p.id, thumb: p.mediaUrls[0], caption: p.caption, createdAt: p.createdAt })),
      ...flicks.map((f) => ({ type: "flick" as const, id: f.id, thumb: f.thumbnailUrl || f.videoUrl, caption: f.caption, createdAt: f.createdAt })),
    ];
    return items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [posts, flicks]);

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-10 pb-24 md:pb-10">
      <div className="w-full max-w-md">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, posts, Flicks…"
          className="w-full border border-mist rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash mb-5"
        />

        <div className="flex gap-6 border-b border-mist mb-5">
          {[
            { key: "all" as const, label: "All" },
            { key: "users" as const, label: "Users" },
          ].map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${tab === t.key ? "text-flash border-flash" : "text-ash border-transparent"}`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-ash text-sm">Searching…</p>}

        {!loading && tab === "all" && (
          combined.length === 0 ? (
            <p className="text-ash text-sm">No results found.</p>
          ) : (
            <div className="grid grid-cols-3 gap-1">
              {combined.map((item) => (
                <Link
                  key={`${item.type}-${item.id}`}
                  href={item.type === "post" ? `/post/${item.id}` : `/flicks?id=${item.id}`}
                  className="aspect-square bg-mist overflow-hidden rounded-lg relative"
                >
                <img src={item.thumb} alt={item.caption || ""} className="w-full h-full object-cover" />
                </Link>
              ))}
            </div>
          )
        )}

        {!loading && tab === "users" && (
          users.length === 0 ? (
            <p className="text-ash text-sm">{query.trim() ? "No users found." : "Search for people by name or username."}</p>
          ) : (
            <div className="space-y-1">
              {users.map((u) => (
                <Link key={u.id} href={`/${u.username}`} className="flex items-center gap-3 px-2 py-2.5 rounded-lg hover:bg-mist/40 transition-colors">
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
                </Link>
              ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}