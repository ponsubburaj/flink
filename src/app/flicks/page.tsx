"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type Flick = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  author: { username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
};

export default function FlicksFeedPage() {
  const [flicks, setFlicks] = useState<Flick[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    const url = cursor ? `/api/flicks?cursor=${cursor}` : "/api/flicks";
    const res = await fetch(url);
    const data = await res.json();
    setFlicks((prev) => {
  const existingIds = new Set(prev.map((f) => f.id));
  const newOnes = data.flicks.filter((f: Flick) => !existingIds.has(f.id));
  return [...prev, ...newOnes];
});
    setCursor(data.nextCursor);
    setHasMore(!!data.nextCursor);
    setLoading(false);
  }, [cursor, hasMore, loading]);

  useEffect(() => {
    loadMore();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const nearBottom = el.scrollTop + el.clientHeight > el.scrollHeight - el.clientHeight;
    if (nearBottom) loadMore();
  }

  if (flicks.length === 0 && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center text-ash gap-1">
        No Flicks yet.
        <Link href="/flicks/create" className="text-flash font-medium hover:underline ml-1">
          Be the first to post one
        </Link>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="h-screen overflow-y-scroll snap-y snap-mandatory bg-ink"
    >
      {flicks.map((flick) => (
        <div key={flick.id} className="h-screen snap-start relative flex items-center justify-center">
          <video
            src={flick.videoUrl}
            poster={flick.thumbnailUrl || undefined}
            className="max-h-full max-w-full"
            controls
            loop
            playsInline
          />
          <div className="absolute bottom-8 left-4 right-4 text-paper">
            <Link href={`/${flick.author.username}`} className="font-medium hover:underline">
              @{flick.author.username}
            </Link>
            {flick.caption && <p className="text-sm mt-1 opacity-90">{flick.caption}</p>}
            <div className="flex gap-4 text-sm mt-2 opacity-80">
              <span>{flick._count.likes} likes</span>
              <span>{flick._count.comments} comments</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}