"use client";

import { useSession } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";

export default function SettingsPage() {
  const { status } = useSession();
  const { theme, setTheme } = useTheme();

  if (status === "unauthenticated") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 text-ash">
        <p>Log in to see settings.</p>
        <Link href="/login" className="text-flash font-medium hover:underline">Log in</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-paper flex justify-center px-6 py-10 pb-24 md:pb-10">
      <div className="w-full max-w-md">
        <h1 className="font-display text-2xl font-semibold text-ink mb-6">Settings</h1>

        <div className="border border-mist rounded-xl p-4">
          <p className="text-ink font-medium text-sm mb-3">Appearance</p>
          <div className="flex gap-2 bg-mist/40 rounded-lg p-1">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                theme === "light" ? "bg-paper text-ink shadow-sm" : "text-ash"
              }`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${
                theme === "dark" ? "bg-paper text-ink shadow-sm" : "text-ash"
              }`}
            >
              🌙 Dark
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}