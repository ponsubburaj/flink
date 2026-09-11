"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";

type UserResult = { id: string; username: string; name: string; avatarUrl: string | null };
type PostResult = { id: string; mediaUrls: string[]; caption: string | null };
type FlickResult = { id: string; thumbnailUrl: string | null; videoUrl: string; caption: string | null };

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"users" | "posts" | "flicks">("users");
  const [users, setUsers] = useState<UserResult[]>([]);
  const [posts, setPosts] = useState<PostResult[]>([]);
  const [flicks, setFlicks] = useState<FlickResult[]>([]);
  const [loading, setLoading] = useState(false);

  const runSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setUsers([]);
      setPosts([]);
      setFlicks([]);
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
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

  const tabs = [
    { key: "users" as const, label: "Users", count: users.length },
    { key: "posts" as const, label: "Posts", count: posts.length },
    { key: "flicks" as const, label: "Flicks", count: flicks.length },
  ];

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search users, posts, Flicks…"
          className="w-full border border-mist rounded-lg px-4 py-2.5 text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash mb-5"
        />

        <div className="flex gap-6 border-b border-mist mb-5">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`pb-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === t.key ? "text-flash border-flash" : "text-ash border-transparent"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {loading && <p className="text-ash text-sm">Searching…</p>}

        {!loading && query.trim() && (
          <>
            {tab === "users" && (
              users.length === 0 ? (
                <p className="text-ash text-sm">No users found.</p>
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

            {tab === "posts" && (
              posts.length === 0 ? (
                <p className="text-ash text-sm">No posts found.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {posts.map((p) => (
                    <Link key={p.id} href={`/post/${p.id}`} className="aspect-square bg-mist overflow-hidden rounded-lg">
                      <img src={p.mediaUrls[0]} alt={p.caption || ""} className="w-full h-full object-cover" />
                    </Link>
                  ))}
                </div>
              )
            )}

            {tab === "flicks" && (
              flicks.length === 0 ? (
                <p className="text-ash text-sm">No Flicks found.</p>
              ) : (
                <div className="grid grid-cols-3 gap-1">
                  {flicks.map((f) => (
                    <Link key={f.id} href="/flicks" className="aspect-square bg-mist overflow-hidden rounded-lg relative">
                      {f.thumbnailUrl ? (
                        <img src={f.thumbnailUrl} alt={f.caption || ""} className="w-full h-full object-cover" />
                      ) : (
                        <video src={f.videoUrl} className="w-full h-full object-cover" />
                      )}
                    </Link>
                  ))}
                </div>
              )
            )}
          </>
        )}
      </div>
    </div>
  );
}