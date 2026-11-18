"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Globe, RefreshCw, Search, UserPlus } from "lucide-react";
import { PlatformAccount } from "@/components/NavbarAndSidebar";

export default function UsersDirectoryPage() {
  const [users, setUsers] = useState<PlatformAccount[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.users)) setUsers(data.users);
    } catch {}
    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filtered = users.filter((u) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q)
    );
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Globe className="w-6 h-6 text-emerald-400" />
            YewTube Users
          </h1>
          <p className="text-sm text-zinc-400 mt-1">
            Search and discover registered accounts on YewTube.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadUsers}
            className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
          <Link
            href="/login"
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Join YewTube
          </Link>
        </div>
      </div>

      <div className="relative">
        <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YewTube users by name, @handle, or bio..."
          className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((u) => (
          <div
            key={u.id}
            className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-5 flex flex-col justify-between gap-4"
          >
            <div className="flex items-center gap-3.5">
              <div
                className={`w-12 h-12 rounded-full ${u.color} flex items-center justify-center text-lg font-bold shrink-0`}
              >
                {u.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0">
                <h3 className="font-bold text-base truncate">{u.name}</h3>
                <p className="text-xs text-zinc-400 truncate">{u.handle}</p>
              </div>
            </div>
            <p className="text-xs text-zinc-300 line-clamp-2">{u.bio}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
