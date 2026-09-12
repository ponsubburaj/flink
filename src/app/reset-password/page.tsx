"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";

function ResetPasswordInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Something went wrong");
      return;
    }

    setSuccess(true);
    setTimeout(() => router.push("/login"), 1500);
  }

  if (!token) {
    return (
      <div className="relative min-h-screen bg-[#150A26] flex items-center justify-center px-6">
        <p className="text-white/70 text-sm">This reset link is invalid.</p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-[#150A26] overflow-hidden flex items-center justify-center px-6 py-12">
      <div
        className="absolute w-72 h-72 rounded-full bg-[#6C4CF0] blur-[70px] opacity-50 -top-16 -left-16"
        style={{ animation: "drift1 12s ease-in-out infinite alternate" }}
      />
      <div
        className="absolute w-64 h-64 rounded-full bg-[#E83D97] blur-[70px] opacity-45 -bottom-10 -right-10"
        style={{ animation: "drift2 10s ease-in-out infinite alternate" }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <img src="/logo.png" alt="Flink" className="w-14 h-14 rounded-2xl mb-3" />
        <span className="font-display text-2xl font-semibold text-white mb-7">Flink</span>

        <div className="w-full bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-6">
          {success ? (
            <p className="text-white text-sm">Password updated! Redirecting to login…</p>
          ) : (
            <>
              <h1 className="font-display text-lg font-semibold text-white mb-1">Set a new password</h1>
              <p className="text-white/50 text-sm mb-6">Choose something you haven't used before.</p>

              <form onSubmit={handleSubmit} className="space-y-3.5">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New password (8+ characters)"
                  className="w-full bg-white/[0.07] border border-white/[0.15] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-flash"
                />

                {error && <p className="text-signal text-sm">{error}</p>}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-flash to-signal text-white rounded-lg py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loading ? "Updating…" : "Update password"}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-white/50 text-sm mt-6">
          <Link href="/login" className="text-[#E8B8F0] font-medium hover:underline">
            Back to login
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#150A26]" />}>
      <ResetPasswordInner />
    </Suspense>
  );
}