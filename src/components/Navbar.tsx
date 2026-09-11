"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const username = (session?.user as any)?.username;
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (status !== "authenticated") return;

    function checkUnread() {
      fetch("/api/notifications")
        .then((res) => res.json())
        .then((data) => setUnreadCount(data.unreadCount || 0));
    }

    checkUnread();
    const interval = setInterval(checkUnread, 15000);
    return () => clearInterval(interval);
  }, [status]);

  return (
    <nav className="border-b border-mist bg-paper sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <img src="/logo.png" alt="Flink" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-lg font-semibold text-ink">Flink</span>
        </Link>

        {status === "authenticated" ? (
          <div className="flex items-center gap-5 text-sm">
            <Link href="/search" className="text-ink hover:text-flash transition-colors">
              Search
            </Link>
            <Link href="/flicks" className="text-ink hover:text-flash transition-colors">
              Flicks
            </Link>
            <Link href="/messages" className="text-ink hover:text-flash transition-colors">
              Messages
            </Link>
            <Link href="/create" className="text-ink hover:text-flash transition-colors">
              New post
            </Link>
            <Link href="/flicks/create" className="text-ink hover:text-flash transition-colors">
              New Flick
            </Link>
            <Link
              href="/notifications"
              onClick={() => setUnreadCount(0)}
              className="relative text-ink hover:text-flash transition-colors"
            >
              Alerts
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-3 bg-gradient-to-r from-flash to-signal text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </Link>
            <Link href={`/${username}`} className="text-ink hover:text-flash transition-colors">
              Profile
            </Link>
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="text-ash hover:text-signal transition-colors"
            >
              Log out
            </button>
          </div>
        ) : status === "unauthenticated" ? (
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-ink hover:text-flash transition-colors">
              Log in
            </Link>
            <Link
              href="/signup"
              className="bg-gradient-to-r from-flash to-signal text-white rounded-lg px-4 py-1.5 font-medium hover:opacity-90 transition-opacity"
            >
              Sign up
            </Link>
          </div>
        ) : null}
      </div>
    </nav>
  );
}