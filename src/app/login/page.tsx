"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (res?.error) {
      setError("That email or password doesn't match our records.");
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="relative md:w-[44%] bg-ink text-paper flex flex-col justify-between px-8 py-10 md:px-14 md:py-16 overflow-hidden">
        <div
          className="absolute -right-24 top-1/3 w-72 h-72 bg-signal"
          style={{ clipPath: "polygon(30% 0, 100% 20%, 70% 100%, 0 80%)" }}
        />
        <div
          className="absolute -right-10 bottom-10 w-40 h-40 bg-flash opacity-90"
          style={{ clipPath: "polygon(20% 0, 100% 10%, 80% 100%, 0 90%)" }}
        />
        <div className="flex items-center gap-2.5 relative z-10">
  <img src="/logo.png" alt="Flink" className="w-9 h-9 rounded-xl" />
  <span className="font-display text-2xl font-semibold tracking-tight">
    Flink
  </span>
</div>
        <div className="relative z-10 max-w-xs">
          <p className="font-display text-2xl leading-snug">
            Catch the moment before it moves on.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">
            Welcome back
          </h1>
          <p className="text-ash mb-8">Log in to keep up with your people.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm text-ink mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-mist rounded px-3.5 py-2.5 text-ink placeholder:text-ash/60 focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm text-ink mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-mist rounded px-3.5 py-2.5 text-ink placeholder:text-ash/60 focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
                placeholder="Your password"
              />
            </div>

            {error && <p className="text-signal text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
                className="w-full bg-gradient-to-r from-flash to-signal text-white rounded-lg px-4 py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Logging in…" : "Log in"}
            </button>
          </form>

          <p className="text-ash text-sm mt-8">
            New to Flink?{" "}
            <Link href="/signup" className="text-flash font-medium hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}