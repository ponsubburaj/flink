"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";

type BlipItem = { id: string; mediaUrl: string; mediaType: string; createdAt: string; isViewed: boolean };
type BlipGroup = { author: { id: string; username: string; avatarUrl: string | null }; blips: BlipItem[] };

const DURATION_MS = 5000;

export default function BlipViewer({
  groups,
  startIndex,
  myId,
  onClose,
}: {
  groups: BlipGroup[];
  startIndex: number;
  myId: string | null;
  onClose: () => void;
}) {
  const [groupIndex, setGroupIndex] = useState(startIndex);
  const [blipIndex, setBlipIndex] = useState(0);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [viewers, setViewers] = useState<{ username: string; avatarUrl: string | null }[]>([]);
  const rafRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const pausedAtRef = useRef<number>(0);

  const group = groups[groupIndex];
  const blip = group?.blips[blipIndex];
  const isOwnBlip = blip && myId === group.author.id;

  const goNext = useCallback(() => {
    if (!group) return;
    if (blipIndex < group.blips.length - 1) {
      setBlipIndex((i) => i + 1);
    } else if (groupIndex < groups.length - 1) {
      setGroupIndex((i) => i + 1);
      setBlipIndex(0);
    } else {
      onClose();
    }
  }, [group, blipIndex, groupIndex, groups.length, onClose]);

  const goPrev = useCallback(() => {
    if (blipIndex > 0) {
      setBlipIndex((i) => i - 1);
    } else if (groupIndex > 0) {
      const prevGroup = groups[groupIndex - 1];
      setGroupIndex((i) => i - 1);
      setBlipIndex(prevGroup.blips.length - 1);
    }
  }, [blipIndex, groupIndex, groups]);

  useEffect(() => {
    if (!blip) return;
    setProgress(0);
    setLiked(false);
    startTimeRef.current = Date.now();

    fetch(`/api/blips/${blip.id}/view`, { method: "POST" }).catch(() => {});

    function tick() {
      if (paused) {
        rafRef.current = requestAnimationFrame(tick);
        return;
      }
      const elapsed = Date.now() - startTimeRef.current;
      const pct = Math.min(elapsed / DURATION_MS, 1);
      setProgress(pct);
      if (pct >= 1) {
        goNext();
        return;
      }
      rafRef.current = requestAnimationFrame(tick);
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [blip?.id, groupIndex, blipIndex]);

  useEffect(() => {
    if (paused) {
      pausedAtRef.current = Date.now();
    } else if (pausedAtRef.current) {
      const pausedDuration = Date.now() - pausedAtRef.current;
      startTimeRef.current += pausedDuration;
      pausedAtRef.current = 0;
    }
  }, [paused]);

  async function handleLike() {
    if (!blip) return;
    setLiked((prev) => !prev);
    await fetch(`/api/blips/${blip.id}/like`, { method: "POST" });
  }

  async function openViewers() {
    if (!blip) return;
    setPaused(true);
    setShowViewers(true);
    const res = await fetch(`/api/blips/${blip.id}/view`);
    if (res.ok) {
      const data = await res.json();
      setViewers(data.views || []);
    }
  }

  if (!group || !blip) return null;

  return (
    <div className="fixed inset-0 bg-black z-[150] flex items-center justify-center">
      <div className="relative w-full h-full max-w-md mx-auto">
        <div className="absolute top-3 left-3 right-3 z-20 flex gap-1.5">
          {group.blips.map((_, i) => (
            <div key={i} className="flex-1 h-0.5 bg-white/30 rounded-full overflow-hidden">
              <div
                className="h-full bg-white"
                style={{
                  width: i < blipIndex ? "100%" : i === blipIndex ? `${progress * 100}%` : "0%",
                }}
              />
            </div>
          ))}
        </div>

        <div className="absolute top-7 left-3 right-3 z-20 flex items-center justify-between">
          <Link href={`/${group.author.username}`} className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full overflow-hidden bg-mist flex-shrink-0">
              {group.author.avatarUrl ? (
                <img src={group.author.avatarUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-ash text-xs">
                  {group.author.username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <span className="text-white text-sm font-medium">{group.author.username}</span>
          </Link>
          <button onClick={onClose} className="text-white text-xl px-2">✕</button>
        </div>

        <div
          className="w-full h-full flex items-center justify-center"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {blip.mediaType === "video" ? (
            <video src={blip.mediaUrl} autoPlay muted playsInline className="max-h-full max-w-full" />
          ) : (
            <img src={blip.mediaUrl} alt="" className="max-h-full max-w-full object-contain" />
          )}
        </div>

        <div className="absolute inset-y-0 left-0 w-1/3" onClick={goPrev} />
        <div className="absolute inset-y-0 right-0 w-1/3" onClick={goNext} />

        {isOwnBlip ? (
          <button
            onClick={openViewers}
            className="absolute bottom-6 left-3 right-3 z-20 text-white text-sm flex items-center gap-2 bg-black/30 rounded-full px-4 py-2 w-fit"
          >
            👁 {blip ? "Seen by" : ""}
          </button>
        ) : (
          <div className="absolute bottom-6 left-3 right-3 z-20 flex items-center gap-3">
            <button
              onClick={handleLike}
              className={`w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center ${liked ? "text-signal" : "text-white"}`}
            >
              {liked ? "♥" : "♡"}
            </button>
          </div>
        )}

        {showViewers && (
          <div className="absolute inset-0 bg-black/70 flex items-end z-30" onClick={() => { setShowViewers(false); setPaused(false); }}>
            <div className="bg-paper w-full max-h-[60%] rounded-t-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between px-4 py-3 border-b border-mist">
                <span className="font-medium text-ink text-sm">Viewed by {viewers.length}</span>
                <button onClick={() => { setShowViewers(false); setPaused(false); }} className="text-ash text-sm">Close</button>
              </div>
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
                {viewers.length === 0 ? (
                  <p className="text-ash text-sm">No views yet.</p>
                ) : (
                  viewers.map((v, i) => (
                    <div key={i} className="flex items-center gap-3 py-1">
                      <div className="w-8 h-8 rounded-full bg-mist overflow-hidden flex items-center justify-center flex-shrink-0">
                        {v.avatarUrl ? (
                          <img src={v.avatarUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-ash text-xs">{v.username.charAt(0).toUpperCase()}</span>
                        )}
                      </div>
                      <span className="text-sm text-ink">{v.username}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}