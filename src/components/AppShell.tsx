"use client";

import { useSession } from "next-auth/react";
import Navbar from "./Navbar";
import BottomNav from "./BottomNav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  return (
    <>
      <Navbar />
      {children}
      {status === "authenticated" && <BottomNav />}
    </>
  );
}