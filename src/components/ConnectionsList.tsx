"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";

type UserItem = { id: string; username: string; name: string; avatarUrl: string | null };

export default function ConnectionsList({ type }: { type: "followers" | "following" }) {
  const { username } = useParams();
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/users/${username}/connections?type=${type}`)
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      });
  }, [username, type]);

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-xl font-semibold text-ink mb-6 capitalize">{type}</h1>
        {loading ? (
          <p className="text-ash text-sm">Loading…</p>
        ) : users.length === 0 ? (
          <p className="text-ash text-sm">No {type} yet.</p>
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
        )}
      </div>
    </div>
  );
}