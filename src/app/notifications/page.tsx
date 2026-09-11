"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";

type Notification = {
  id: string;
  type: "FOLLOW" | "LIKE" | "COMMENT" | "MESSAGE";
  read: boolean;
  createdAt: string;
  postId: string | null;
  flickId: string | null;
  actor: { username: string; avatarUrl: string | null };
};

function notificationText(type: Notification["type"]) {
  switch (type) {
    case "FOLLOW":
      return "started following you";
    case "LIKE":
      return "liked your post";
    case "COMMENT":
      return "commented on your post";
    case "MESSAGE":
      return "sent you a message";
  }
}

export default function NotificationsPage() {
  const { status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status !== "authenticated") return;
    fetch("/api/notifications")
      .then((res) => res.json())
      .then((data) => {
        setNotifications(data.notifications || []);
        setLoading(false);
      });
    fetch("/api/notifications", { method: "PATCH" });
  }, [status]);

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ash">
        <p>Log in to see your notifications.</p>
        <Link href="/login" className="text-flash font-medium hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold text-ink mb-6">Notifications</h1>

        {loading ? (
          <p className="text-ash text-sm">Loading…</p>
        ) : notifications.length === 0 ? (
          <p className="text-ash text-sm">No notifications yet.</p>
        ) : (
          <div className="space-y-1">
            {notifications.map((n) => {
              const target = n.postId ? `/post/${n.postId}` : `/${n.actor.username}`;
              return (
                <Link
                  key={n.id}
                  href={target}
                  className={`flex items-center gap-3 px-3 py-3 rounded-lg transition-colors hover:bg-mist/40 ${
                    !n.read ? "bg-flash/5" : ""
                  }`}
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-flash to-signal p-[2px] flex-shrink-0">
                    <div className="w-full h-full rounded-full bg-paper overflow-hidden flex items-center justify-center">
                      {n.actor.avatarUrl ? (
                        <img src={n.actor.avatarUrl} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-flash text-sm">{n.actor.username.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-ink">
                    <span className="font-medium">{n.actor.username}</span>{" "}
                    {notificationText(n.type)}
                  </p>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}