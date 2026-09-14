"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useTheme } from "@/components/ThemeProvider";
import Link from "next/link";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const { theme, setTheme } = useTheme();

  const [isPrivate, setIsPrivate] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState("");
  const [pwError, setPwError] = useState("");

  async function togglePrivate() {
    const next = !isPrivate;
    setIsPrivate(next);
    await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: (session?.user as any)?.name,
        username: (session?.user as any)?.username,
        isPrivate: next,
      }),
    });
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError("");
    setPwMessage("");
    setPwSaving(true);

    const res = await fetch("/api/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword }),
    });
    const data = await res.json();
    setPwSaving(false);

    if (!res.ok) {
      setPwError(data.error || "Something went wrong");
      return;
    }
    setPwMessage("Password updated.");
    setCurrentPassword("");
    setNewPassword("");
  }

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
      <div className="w-full max-w-md space-y-6">
        <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>

        {/* Account */}
        <section className="border border-mist rounded-xl p-4">
          <p className="text-ink font-medium text-sm mb-3">Account</p>
          <Link href="/profile/edit" className="flex items-center justify-between py-2.5 text-sm text-ink">
            Edit profile <span className="text-ash">→</span>
          </Link>
          <div className="h-px bg-mist my-1" />
          <div className="flex items-center justify-between py-2.5 text-sm text-ink">
            Private account
            <button
              onClick={togglePrivate}
              className={`w-11 h-6 rounded-full transition-colors relative ${isPrivate ? "bg-gradient-to-r from-flash to-signal" : "bg-mist"}`}
            >
              <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all ${isPrivate ? "left-5.5" : "left-0.5"}`} style={{ left: isPrivate ? "22px" : "2px" }} />
            </button>
          </div>
        </section>

        {/* Change password */}
        <section className="border border-mist rounded-xl p-4">
          <p className="text-ink font-medium text-sm mb-3">Change password</p>
          <form onSubmit={handleChangePassword} className="space-y-2.5">
            <input
              type="password"
              required
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              className="w-full border border-mist rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
            />
            <input
              type="password"
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="New password"
              className="w-full border border-mist rounded-lg px-3.5 py-2.5 text-sm text-ink focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
            />
            {pwError && <p className="text-signal text-sm">{pwError}</p>}
            {pwMessage && <p className="text-flash text-sm">{pwMessage}</p>}
            <button
              type="submit"
              disabled={pwSaving}
              className="w-full bg-ink text-paper rounded-lg py-2.5 text-sm font-medium disabled:opacity-60"
            >
              {pwSaving ? "Updating…" : "Update password"}
            </button>
          </form>
        </section>

        {/* Appearance */}
        <section className="border border-mist rounded-xl p-4">
          <p className="text-ink font-medium text-sm mb-3">Appearance</p>
          <div className="flex gap-2 bg-mist/40 rounded-lg p-1">
            <button
              onClick={() => setTheme("light")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${theme === "light" ? "bg-paper text-ink shadow-sm" : "text-ash"}`}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme("dark")}
              className={`flex-1 text-sm font-medium py-2 rounded-md transition-colors ${theme === "dark" ? "bg-paper text-ink shadow-sm" : "text-ash"}`}
            >
              🌙 Dark
            </button>
          </div>
        </section>

        {/* Support */}
        <section className="border border-mist rounded-xl p-4">
          <p className="text-ink font-medium text-sm mb-3">Support</p>
          <Link href="/forgot-password" className="flex items-center justify-between py-2.5 text-sm text-ink">
            Reset password via email <span className="text-ash">→</span>
          </Link>
        </section>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="w-full border border-mist rounded-xl py-3 text-sm font-medium text-signal"
        >
          Log out
        </button>
      </div>
    </div>
  );
}