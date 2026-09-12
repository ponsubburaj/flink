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
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 10v10h14V10" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/flicks",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="16" rx="3" />
          <path d="M10 9l6 3-6 3z" fill={active ? "white" : "currentColor"} />
        </svg>
      ),
    },
    {
      href: "/messages",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill={active ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8">
          <path d="M22 2L11 13" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ),
    },
    {
      href: "/search",
      icon: (active: boolean) => (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={active ? 2.4 : 1.8}>
          <circle cx="11" cy="11" r="7" />
          <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      href: username ? `/${username}` : "/",
      isProfile: true,
    },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-paper border-t border-mist z-50 flex items-center justify-around h-16 pb-[env(safe-area-inset-bottom)]">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link key={item.href} href={item.href} className={active ? "text-ink" : "text-ash"}>
            {item.isProfile ? (
              <div className={`w-6 h-6 rounded-full overflow-hidden flex items-center justify-center ${active ? "ring-2 ring-flash" : "bg-mist"}`}>
                {avatarUrl ? (
                  <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-[10px] text-ash">{username?.charAt(0).toUpperCase()}</span>
                )}
              </div>
            ) : (
              item.icon!(active)
            )}
          </Link>
        );
      })}
    </nav>
  );
}