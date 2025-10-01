"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export default function LoginPage() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("demodemo");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (res.ok) {
      const redirect = search.get("redirect") || "/dashboard";
      router.push(redirect);
      router.refresh();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(data?.error || "Giriş başarısız");
    }
  }

  return (
    <div className="max-w-md mx-auto">
      <h1 className="text-xl font-semibold mb-6">Giriş yap</h1>
      <form className="space-y-4" onSubmit={onSubmit}>
        <div className="space-y-1">
          <label className="text-sm font-medium">E-posta</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded border bg-transparent px-3 py-2"
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium">Şifre</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded border bg-transparent px-3 py-2"
          />
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <button type="submit" className="w-full rounded bg-black text-white py-2 hover:opacity-90">
          Giriş yap
        </button>
        <p className="text-xs text-neutral-500">Demo: admin@example.com / demodemo</p>
      </form>
    </div>
  );
}


