"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ShareSheet from "@/components/ShareSheet";

type Flick = {
  id: string;
  videoUrl: string;
  thumbnailUrl: string | null;
  caption: string | null;
  author: { id: string; username: string; avatarUrl: string | null };
  _count: { likes: number; comments: number };
  isLiked: boolean;
};

function FlickCard({
  flick,
  isActive,
  onLike,
  onDelete,
  myId,
}: {
  flick: Flick;
  isActive: boolean;
  onLike: (id: string) => void;
  onDelete: (id: string) => void;
  myId: string | null;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showHeart, setShowHeart] = useState(false);
  const lastTap = useRef(0);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (isActive) {
      video.play().catch(() => {});
      setPlaying(true);
    } else {
      video.pause();
      video.currentTime = 0;
    }
  }, [isActive]);

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play();
      setPlaying(true);
    } else {
      video.pause();
      setPlaying(false);
    }
  }

  function triggerLikeAnimation() {
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
    if (!flick.isLiked) onLike(flick.id);
  }

    function handleTap() {
    const now = Date.now();
    const gap = now - lastTap.current;
    lastTap.current = now;

    if (gap > 0 && gap < 300) {
      triggerLikeAnimation();
    } else {
      togglePlay();
    }
  }

  return (
    <div
      className="h-full w-full snap-start relative flex items-center justify-center bg-black"
      style={{ scrollSnapStop: "always" }}
    >
            {flick.thumbnailUrl && (
        <img
          src={flick.thumbnailUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover blur-2xl scale-110 opacity-50"
        />
      )}
      <video
        ref={videoRef}
        src={flick.videoUrl}
        poster={flick.thumbnailUrl || undefined}
        className="relative h-full w-full object-contain"
        loop
        playsInline
        onClick={handleTap}
      />

      {!playing && (
        <div onClick={handleTap} className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-16 h-16 rounded-full bg-black/40 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      )}

      {showHeart && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-white text-8xl heart-pop">♥</span>
        </div>
      )}

        <div className="absolute bottom-4 left-0 right-16 p-4 text-white bg-gradient-to-t from-black/70 to-transparent pt-10">
        <Link href={`/${flick.author.username}`} className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-flash to-signal p-[2px] flex-shrink-0">
            <div className="w-full h-full rounded-full bg-ink overflow-hidden flex items-center justify-center">
              {flick.author.avatarUrl ? (
                <img src={flick.author.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs">{flick.author.username.charAt(0).toUpperCase()}</span>
              )}
            </div>
          </div>
          <span className="font-medium text-sm">{flick.author.username}</span>
        </Link>
        {flick.caption && <p className="text-sm opacity-90">{flick.caption}</p>}
      </div>

              <div className="absolute bottom-4 right-3 flex flex-col items-center gap-6 text-white">
                <button onClick={(e) => { e.stopPropagation(); triggerLikeAnimation(); }} className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <svg width="22" height="22" viewBox="0 0 24 24" fill={flick.isLiked ? "#E83D97" : "none"} stroke={flick.isLiked ? "#E83D97" : "white"} strokeWidth="2">
              <path d="M20.8 4.6a5.5 5.5 0 00-7.8 0L12 5.6l-1-1a5.5 5.5 0 00-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 000-7.8z" />
            </svg>
          </div>
          <span className="text-xs font-medium drop-shadow">{flick._count.likes}</span>
        </button>
          <button onClick={(e) => { e.stopPropagation(); setShowComments(true); }} className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 11.5a8.38 8.38 0 01-4.9 7.6 8.5 8.5 0 01-9.8-1.7L3 21l1.9-5.7a8.38 8.38 0 01-1.7-5.1 8.5 8.5 0 018-8.5h.5a8.48 8.48 0 018 8v.5z" />
            </svg>
          </div>
          <span className="text-xs font-medium drop-shadow">{flick._count.comments}</span>
        </button>
                <button onClick={(e) => { e.stopPropagation(); setShowShare(true); }} className="flex flex-col items-center gap-1.5">
          <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2L11 13" />
              <path d="M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </div>
        </button>
        {myId === flick.author.id && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(flick.id); }} className="flex flex-col items-center gap-1.5">
            <div className="w-11 h-11 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center">
              <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z" />
              </svg>
            </div>
          </button>
        )}
      </div>

            {showComments && <FlickComments flickId={flick.id} onClose={() => setShowComments(false)} />}
      {showShare && (
        <ShareSheet
          shareUrl={typeof window !== "undefined" ? `${window.location.origin}/flicks?id=${flick.id}` : ""}
          caption={flick.caption || undefined}
          onClose={() => setShowShare(false)}
        />
      )}

      <style jsx>{`
        .heart-pop {
          animation: heartPop 0.7s ease-out forwards;
        }
        @keyframes heartPop {
          0% { transform: scale(0.5); opacity: 0; }
          25% { transform: scale(1.2); opacity: 1; }
          50% { transform: scale(1); opacity: 1; }
          100% { transform: scale(1.1); opacity: 0; }
        }
      `}</style>
    </div>
  );
}

function FlickComments({ flickId, onClose }: { flickId: string; onClose: () => void }) {
  const [comments, setComments] = useState<{ id: string; text: string; user: { username: string } }[]>([]);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    fetch(`/api/comments?flickId=${flickId}`)
      .then((res) => res.json())
      .then((data) => setComments(data.comments || []));
  }, [flickId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    setPosting(true);
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, flickId }),
    });
    const json = await res.json();
    setPosting(false);
    if (res.ok) {
      setComments((prev) => [...prev, json.comment]);
      setText("");
    }
  }

  return (
    <div className="absolute inset-0 bg-black/60 flex items-end" onClick={onClose}>
      <div className="bg-paper w-full max-h-[60%] rounded-t-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-mist">
          <span className="font-medium text-ink text-sm">Comments</span>
          <button onClick={onClose} className="text-ash text-sm">Close</button>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {comments.length === 0 ? (
            <p className="text-ash text-sm">No comments yet.</p>
          ) : (
            comments.map((c) => (
              <p key={c.id} className="text-sm text-ink">
                <span className="font-medium">{c.user.username}</span> {c.text}
              </p>
            ))
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2 px-4 py-3 border-t border-mist">
          <input
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Add a comment…"
            className="flex-1 border border-mist rounded-full px-4 py-2 text-sm text-ink focus:outline-none focus:border-flash"
          />
          <button type="submit" disabled={posting || !text.trim()} className="text-flash font-medium text-sm disabled:opacity-50">
            Post
          </button>
        </form>
      </div>
    </div>
  );
}

export default function FlicksFeedPage() {
  return (
    <Suspense fallback={<div className="h-[100dvh] bg-black" />}>
      <FlicksFeedInner />
    </Suspense>
  );
}

function FlicksFeedInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const myId = session?.user ? (session.user as any).id : null;

  const [flicks, setFlicks] = useState<Flick[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
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
    const sharedId = searchParams.get("id");
    async function init() {
      if (sharedId) {
        const res = await fetch(`/api/flicks?id=${sharedId}`);
        const data = await res.json();
        if (data.flicks?.length) setFlicks(data.flicks);
      }
      loadMore();
    }
    init();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function handleScroll() {
    const el = containerRef.current;
    if (!el) return;
    const index = Math.round(el.scrollTop / el.clientHeight);
    setActiveIndex(index);
    const nearBottom = el.scrollTop + el.clientHeight > el.scrollHeight - el.clientHeight * 2;
    if (nearBottom) loadMore();
  }

  async function handleLike(flickId: string) {
    const res = await fetch("/api/likes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ flickId }),
    });
    const json = await res.json();
    if (res.ok) {
      setFlicks((prev) =>
        prev.map((f) =>
          f.id === flickId
            ? { ...f, isLiked: json.liked, _count: { ...f._count, likes: f._count.likes + (json.liked ? 1 : -1) } }
            : f
        )
      );
    }
  }

  async function handleDelete(flickId: string) {
    if (!confirm("Delete this Flick? This can't be undone.")) return;
    const res = await fetch(`/api/flicks?id=${flickId}`, { method: "DELETE" });
    if (res.ok) {
      setFlicks((prev) => prev.filter((f) => f.id !== flickId));
    }
  }

    if (flicks.length === 0 && !loading) {
    return (
      <div className="h-[100dvh] flex items-center justify-center text-ash gap-1 bg-paper">
        No Flicks yet.
        <button onClick={() => router.push("/flicks/create")} className="text-flash font-medium hover:underline ml-1">
          Be the first to post one
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] bg-black">
      <Link
        href="/"
        className="absolute top-4 left-4 z-50 w-9 h-9 rounded-full bg-black/40 flex items-center justify-center text-white"
      >
        ←
      </Link>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        className="h-full overflow-y-scroll snap-y snap-mandatory"
        style={{ scrollSnapType: "y mandatory" }}
      >
        {flicks.map((flick, i) => (
          <FlickCard
            key={flick.id}
            flick={flick}
            isActive={i === activeIndex}
            onLike={handleLike}
            onDelete={handleDelete}
            myId={myId}
          />
        ))}
      </div>
    </div>
  );
}