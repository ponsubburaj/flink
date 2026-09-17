"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import BlipViewer from "./BlipViewer";

type BlipItem = { id: string; mediaUrl: string; mediaType: string; createdAt: string; isViewed: boolean };
type BlipGroup = { author: { id: string; username: string; avatarUrl: string | null }; blips: BlipItem[] };

export default function BlipsRow() {
  const { data: session, status } = useSession();
  const myId = session?.user ? (session.user as any).id : null;
  const [groups, setGroups] = useState<BlipGroup[]>([]);
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);

  async function load() {
    const res = await fetch("/api/blips");
    if (res.ok) {
      const data = await res.json();
      setGroups(data.groups || []);
    }
  }

  useEffect(() => {
    if (status === "authenticated") load();
  }, [status]);

  if (status !== "authenticated") return null;

  const myGroup = groups.find((g) => g.author.id === myId);

  return (
    <>
      <div className="flex gap-4 px-4 py-3 overflow-x-auto border-b border-mist">
        <Link href="/blips/create" className="flex flex-col items-center gap-1 flex-shrink-0">
          <div className="w-16 h-16 rounded-full bg-mist flex items-center justify-center relative">
            {myGroup ? (
              <img src={myGroup.author.avatarUrl || ""} alt="" className="w-full h-full rounded-full object-cover" />
            ) : (
              <span className="text-ash text-2xl">+</span>
            )}
            <span className="absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full bg-gradient-to-r from-flash to-signal text-white text-xs flex items-center justify-center">+</span>
          </div>
          <span className="text-xs text-ash">Your Blip</span>
        </Link>

        {groups
          .filter((g) => g.author.id !== myId)
          .map((g, i) => {
            const allViewed = g.blips.every((b) => b.isViewed);
            return (
              <button
                key={g.author.id}
                onClick={() => setViewingIndex(i)}
                className="flex flex-col items-center gap-1 flex-shrink-0"
              >
                <div className={`w-16 h-16 rounded-full p-[2px] ${allViewed ? "bg-mist" : "bg-gradient-to-br from-flash to-signal"}`}>
                  <div className="w-full h-full rounded-full bg-paper p-[2px]">
                    <div className="w-full h-full rounded-full overflow-hidden bg-mist">
                      {g.author.avatarUrl ? (
                        <img src={g.author.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-ash text-lg">
                          {g.author.username.charAt(0).toUpperCase()}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <span className="text-xs text-ink max-w-[64px] truncate">{g.author.username}</span>
              </button>
            );
          })}
      </div>

      {viewingIndex !== null && (
        <BlipViewer
          groups={groups.filter((g) => g.author.id !== myId)}
          startIndex={viewingIndex}
          myId={myId}
          onClose={() => {
            setViewingIndex(null);
            load();
          }}
        />
      )}
    </>
  );
}