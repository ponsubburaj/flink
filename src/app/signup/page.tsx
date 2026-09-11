"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SignupPage() {
  const router = useRouter();
  const [form, setForm] = useState({
    name: "",
    username: "",
    email: "",
    password: "",
  });
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

    const signInRes = await signIn("credentials", {
      email: form.email,
      password: form.password,
      redirect: false,
    });

    setLoading(false);

    if (signInRes?.error) {
      router.push("/login");
      return;
    }
    router.push("/");
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <div className="relative md:w-[44%] bg-ink text-paper flex flex-col justify-between px-8 py-10 md:px-14 md:py-16 overflow-hidden">
        <div
          className="absolute -left-20 top-10 w-64 h-64 bg-flash"
          style={{ clipPath: "polygon(20% 0, 100% 10%, 80% 100%, 0 90%)" }}
        />
        <div
          className="absolute -left-10 bottom-1/4 w-48 h-48 bg-signal opacity-90"
          style={{ clipPath: "polygon(30% 0, 100% 20%, 70% 100%, 0 80%)" }}
        />
        <div className="flex items-center gap-2.5 relative z-10">
  <img src="/logo.png" alt="Flink" className="w-9 h-9 rounded-xl" />
  <span className="font-display text-2xl font-semibold tracking-tight">
    Flink
  </span>
</div>
        <div className="relative z-10 max-w-xs">
          <p className="font-display text-2xl leading-snug">
            Your feed, your circle, no noise.
          </p>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-6 py-12 bg-paper">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink mb-1">
            Create your account
          </h1>
          <p className="text-ash mb-8">Takes less than a minute.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm text-ink mb-1.5">
                Full name
              </label>
              <input
                id="name"
                required
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="w-full border border-mist rounded px-3.5 py-2.5 text-ink placeholder:text-ash/60 focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
                placeholder="Jane Doe"
              />
            </div>
            <div>
              <label htmlFor="username" className="block text-sm text-ink mb-1.5">
                Username
              </label>
              <input
                id="username"
                required
                value={form.username}
                onChange={(e) => update("username", e.target.value)}
                className="w-full border border-mist rounded px-3.5 py-2.5 text-ink placeholder:text-ash/60 focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
                placeholder="janedoe"
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm text-ink mb-1.5">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => update("email", e.target.value)}
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
                value={form.password}
                onChange={(e) => update("password", e.target.value)}
                className="w-full border border-mist rounded px-3.5 py-2.5 text-ink placeholder:text-ash/60 focus:outline-none focus:border-flash focus:ring-1 focus:ring-flash"
                placeholder="At least 8 characters"
              />
            </div>

            {error && <p className="text-signal text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
               className="w-full bg-gradient-to-r from-flash to-signal text-white rounded-lg px-4 py-2.5 font-medium hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? "Creating account…" : "Create account"}
            </button>
          </form>

          <p className="text-ash text-sm mt-8">
            Already have an account?{" "}
            <Link href="/login" className="text-flash font-medium hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}