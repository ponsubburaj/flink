"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const { data: session, status } = useSession();
  const username = (session?.user as any)?.username;
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

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

  const links = [
    { href: "/search", label: "Search" },
    { href: "/flicks", label: "Flicks" },
    { href: "/messages", label: "Messages" },
    { href: "/create", label: "New post" },
    { href: "/flicks/create", label: "New Flick" },
    { href: "/notifications", label: "Alerts", badge: unreadCount },
    { href: username ? `/${username}` : "/", label: "Profile" },
  ];

  return (
    <nav className="border-b border-mist bg-paper sticky top-0 z-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <img src="/logo.png" alt="Flink" className="w-8 h-8 rounded-lg" />
          <span className="font-display text-lg font-semibold text-ink">Flink</span>
        </Link>

        {status === "authenticated" ? (
          <>
            <div className="hidden md:flex items-center gap-5 text-sm">
              {links.map((l) => (
                <Link key={l.href} href={l.href} className="relative text-ink hover:text-flash transition-colors">
                  {l.label}
                  {!!l.badge && (
                    <span className="absolute -top-2 -right-3 bg-gradient-to-r from-flash to-signal text-white text-[10px] font-medium rounded-full w-4 h-4 flex items-center justify-center">
                      {l.badge > 9 ? "9+" : l.badge}
                    </span>
                  )}
                </Link>
              ))}
              <button onClick={() => signOut({ callbackUrl: "/login" })} className="text-ash hover:text-signal transition-colors">
                Log out
              </button>
            </div>

            <button
              onClick={() => setMenuOpen((v) => !v)}
              className="md:hidden text-ink p-2 -mr-2"
              aria-label="Menu"
            >
              {menuOpen ? (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12" /></svg>
              ) : (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18M3 12h18M3 18h18" /></svg>
              )}
            </button>
          </>
        ) : status === "unauthenticated" ? (
          <div className="flex items-center gap-3 sm:gap-4 text-sm">
            <Link href="/login" className="text-ink hover:text-flash transition-colors">Log in</Link>
            <Link href="/signup" className="bg-gradient-to-r from-flash to-signal text-white rounded-lg px-4 py-1.5 font-medium hover:opacity-90 transition-opacity">
              Sign up
            </Link>
          </div>
        ) : null}
      </div>

      {menuOpen && status === "authenticated" && (
        <div className="md:hidden border-t border-mist px-4 py-3 flex flex-col gap-1">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMenuOpen(false)}
              className="flex items-center justify-between text-ink py-2.5 text-sm hover:text-flash transition-colors"
            >
              {l.label}
              {!!l.badge && (
                <span className="bg-gradient-to-r from-flash to-signal text-white text-[10px] font-medium rounded-full w-5 h-5 flex items-center justify-center">
                  {l.badge > 9 ? "9+" : l.badge}
                </span>
              )}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="text-left text-ash hover:text-signal transition-colors py-2.5 text-sm"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}