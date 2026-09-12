"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({ name: "", username: "", email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function update(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error || "Something went wrong.");
      setLoading(false);
      return;
    }

    const signInRes = await signIn("credentials", { email: form.email, password: form.password, redirect: false });
    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
  }

  return (
    <div className="relative min-h-screen bg-[#150A26] overflow-hidden flex items-center justify-center px-6 py-12">
      <div
        className="absolute w-72 h-72 rounded-full bg-[#E83D97] blur-[70px] opacity-50 -top-16 -right-16"
        style={{ animation: "drift2 12s ease-in-out infinite alternate" }}
      />
      <div
        className="absolute w-64 h-64 rounded-full bg-[#6C4CF0] blur-[70px] opacity-45 -bottom-10 -left-10"
        style={{ animation: "drift1 10s ease-in-out infinite alternate" }}
      />
      <div
        className="absolute w-56 h-56 rounded-full bg-[#4C9CF0] blur-[65px] opacity-30 top-1/4 left-1/4"
        style={{ animation: "drift3 13s ease-in-out infinite alternate" }}
      />

      <div className="relative z-10 w-full max-w-sm flex flex-col items-center">
        <img src="/logo.png" alt="Flink" className="w-14 h-14 rounded-2xl mb-3" />
        <span className="font-display text-2xl font-semibold text-white mb-7">Flink</span>

        <div className="w-full bg-white/[0.07] backdrop-blur-xl border border-white/[0.12] rounded-2xl p-6">
          <h1 className="font-display text-lg font-semibold text-white mb-1">Create your account</h1>
          <p className="text-white/50 text-sm mb-6">Takes less than a minute.</p>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <input
              required
              value={form.name}
              onChange={(e) => update("name", e.target.value)}
              placeholder="Full name"
              className="w-full bg-white/[0.07] border border-white/[0.15] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-flash"
            />
            <input
              required
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
              placeholder="Username"
              className="w-full bg-white/[0.07] border border-white/[0.15] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-flash"
            />
            <input
              type="email"
              required
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="Email"
              className="w-full bg-white/[0.07] border border-white/[0.15] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-flash"
            />
            <input
              type="password"
              required
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Password (8+ characters)"
              className="w-full bg-white/[0.07] border border-white/[0.15] rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-flash"
            />

            {error && <p className="text-signal text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-flash to-signal text-white rounded-lg py-3 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>
        </div>

        <p className="text-white/50 text-sm mt-6">
          Already have an account?{" "}
          <Link href="/login" className="text-[#E8B8F0] font-medium hover:underline">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}