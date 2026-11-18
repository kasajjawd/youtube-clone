"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Mail, Lock, Play, Check } from "lucide-react";

const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-red-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-amber-600",
];

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"register" | "signin">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [color, setColor] = useState("bg-emerald-600");
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    const emailClean = email.trim().toLowerCase();
    const cleanName = name.trim() || emailClean.split("@")[0];
    const rawHandle = handle.trim() || cleanName.toLowerCase().replace(/\s+/g, "");
    const formattedHandle = rawHandle.startsWith("@") ? rawHandle : `@${rawHandle}`;

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: mode,
          email: emailClean,
          password,
          name: cleanName,
          handle: formattedHandle,
          bio,
          color,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        setError(data.error || "Could not sign in.");
        return;
      }
      localStorage.setItem("yewtube_session_user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("yewtube-storage-update"));
      router.push("/account");
    } catch {
      setError("Network error while signing in.");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
      <div className="flex items-center gap-2 mb-6">
        <span className="bg-emerald-600 p-2 rounded-xl">
          <Play className="w-5 h-5 fill-white text-white" />
        </span>
        <h1 className="text-xl font-bold">
          {mode === "register" ? "Create YewTube Account" : "Sign In to YewTube"}
        </h1>
      </div>

      {error && (
        <div className="bg-red-950/70 border border-red-700 text-red-200 text-xs rounded-xl p-3 mb-4">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "register" && (
          <>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Display Name"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm"
            />
            <input
              type="text"
              value={handle}
              onChange={(e) => setHandle(e.target.value)}
              placeholder="@handle"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm"
            />
          </>
        )}

        <div className="relative">
          <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email Address"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
          />
        </div>

        <div className="relative">
          <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm"
          />
        </div>

        {mode === "register" && (
          <>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Channel Bio"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm"
            />
            <div className="flex gap-2">
              {AVATAR_COLORS.map((c) => (
                <button
                  type="button"
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full ${c} flex items-center justify-center`}
                >
                  {color === c && <Check className="w-4 h-4 text-white" />}
                </button>
              ))}
            </div>
          </>
        )}

        <button
          type="submit"
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold py-2.5 rounded-xl text-sm"
        >
          {mode === "register" ? "Create Account" : "Sign In"}
        </button>
      </form>

      <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
        <button
          onClick={() => setMode(mode === "register" ? "signin" : "register")}
          className="text-xs text-emerald-400 hover:underline"
        >
          {mode === "register"
            ? "Already have an account? Sign in"
            : "Need an account? Create one"}
        </button>
      </div>
    </div>
  );
}
