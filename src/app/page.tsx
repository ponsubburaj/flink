"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BlipsRow from "@/components/BlipsRow";

type FeedPost = {
  id: string;
  mediaUrls: string[];
  caption: string | null;
  author: { username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
  isLiked: boolean;
};

export default function HomePage() {
  const { status } = useSession();
  const [posts, setPosts] = useState<FeedPost[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const url = cursor ? `/api/feed?cursor=${cursor}` : "/api/feed";
    const res = await fetch(url);
    if (res.ok) {
      const data = await res.json();
      setPosts((prev) => {
        const existingIds = new Set(prev.map((p) => p.id));
        const newOnes = data.posts.filter((p: FeedPost) => !existingIds.has(p.id));
        return [...prev, ...newOnes];
      });
      setCursor(data.nextCursor);
      setHasMore(!!data.nextCursor);
    }
    setLoading(false);
    setInitialLoad(false);
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    if (status === "authenticated") loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  async function handleLike(post: FeedPost) {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId: post.id }),
    });
    const json = await res.json();
    if (res.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id
            ? { ...p, isLiked: json.liked, _count: { ...p._count, likes: p._count.likes + (json.liked ? 1 : -1) } }
            : p
        )
      );
    }
  }

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ash px-6 text-center">
        <p>Welcome to Flink. Log in to see your feed.</p>
        <div className="flex gap-4">
          <Link href="/login" className="text-flash font-medium hover:underline">Log in</Link>
          <Link href="/signup" className="text-flash font-medium hover:underline">Sign up</Link>
        </div>
      </div>
    );
  }

  if (status === "loading" || (initialLoad && loading)) {
    return <div className="min-h-screen flex items-center justify-center text-ash">Loading…</div>;
  }

    return (
    <div className="min-h-screen bg-paper">
      <div className="max-w-md mx-auto">
        <BlipsRow />
      </div>
      <div className="flex justify-center px-6 py-10">
      <div className="w-full max-w-md">
        {posts.length === 0 ? (
          <div className="text-center text-ash text-sm mt-20">
            <p className="mb-2">Your feed is empty.</p>
            <p>
              Follow people to see their posts here, or{" "}
              <Link href="/create" className="text-flash font-medium hover:underline">
                share your first post
              </Link>
              .
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {posts.map((post) => (
              <div key={post.id} className="border border-mist rounded-xl overflow-hidden">
                <Link href={`/${post.author.username}`} className="flex items-center gap-2.5 px-4 py-3">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-flash to-signal p-[2px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-paper overflow-hidden flex items-center justify-center">
                      {post.author.avatarUrl ? (
                        <img src={post.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-flash text-xs">{post.author.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-ink font-medium text-sm">{post.author.username}</span>
                </Link>

                <Link href={`/post/${post.id}`}>
                  <img src={post.mediaUrls[0]} alt={post.caption || "Post"} className="w-full object-cover" />
                </Link>

                <div className="px-4 py-3">
                  <button
                    onClick={() => handleLike(post)}
                    className={`text-sm font-medium mr-4 transition-colors ${post.isLiked ? "text-signal" : "text-ink hover:text-signal"}`}
                  >
                    {post.isLiked ? "♥" : "♡"} {post._count.likes}
                  </button>
                  <Link href={`/post/${post.id}`} className="text-sm text-ash hover:text-ink">
                    {post._count.comments} comments
                  </Link>
                  {post.caption && (
                    <p className="text-ink text-sm mt-2">
                      <span className="font-medium">{post.author.username}</span> {post.caption}
                    </p>
                  )}
                </div>
              </div>
            ))}

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="w-full text-flash text-sm font-medium py-3 disabled:opacity-50"
              >
                {loading ? "Loading…" : "Load more"}
              </button>
            )}
          </div>
              )}
      </div>
      </div>
    </div>
  );
}