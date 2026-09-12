"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const immersive = pathname === "/flicks";
  const isChatThread = pathname.startsWith("/messages/") && pathname !== "/messages";

  return (
    <>
      {!immersive && <Navbar />}
      {children}
      {status === "authenticated" && !immersive && !isChatThread && <BottomNav />}
    </>
  );
}