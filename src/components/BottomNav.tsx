"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export default function BottomNav() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const username = (session?.user as any)?.username;
  const avatarUrl = (session?.user as any)?.image;

  const items = [
    {
      href: "/",
      icon: (active: boolean) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10.5L12 3l9 7.5" />
          <path d="M5 9.5V20a1 1 0 001 1h4v-6h4v6h4a1 1 0 001-1V9.5" />
        </svg>
      ),
    },
    {
      href: "/flicks",
      icon: (active: boolean) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="18" height="18" rx="5" />
          <path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor" stroke="none" />
        </svg>
      ),
    },
    {
      href: "/messages",
      icon: (active: boolean) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
        </svg>
      ),
    },
    {
      href: "/search",
      icon: (active: boolean) => (
        <svg width="23" height="23" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.3 : 1.8} strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" />
        </svg>
      ),
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper/90 backdrop-blur-lg border-t border-mist z-50 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className="flex items-center justify-center w-12 h-10 rounded-full relative">
            {active && <span className="absolute inset-0 bg-mist/60 rounded-full" />}
            <span className={`relative ${active ? "text-flash" : "text-ash"}`}>{item.icon(active)}</span>
          </Link>
        );
      })}
      <Link
        href={username ? `/${username}` : "/"}
        className="flex items-center justify-center w-12 h-10 rounded-full relative"
      >
        {pathname === `/${username}` && <span className="absolute inset-0 bg-mist/60 rounded-full" />}
        <div
          className={`relative w-6 h-6 rounded-full overflow-hidden flex items-center justify-center ${
            pathname === `/${username}` ? "ring-2 ring-flash" : "bg-mist"
          }`}
        >
          {avatarUrl ? (
            <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <span className="text-[10px] text-ash">{username?.charAt(0).toUpperCase()}</span>
          )}
        </div>
      </Link>
    </nav>
  );
}