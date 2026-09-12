"use client";

import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const immersive = pathname === "/flicks";

  return (
    <>
      {!immersive && <Navbar />}
      {children}
      {status === "authenticated" && !immersive && <BottomNav />}
    </>
  );
}