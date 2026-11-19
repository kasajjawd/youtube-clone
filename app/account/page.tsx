"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LogOut } from "lucide-react";
import { PlatformAccount } from "@/components/NavbarAndSidebar";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<PlatformAccount | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem("yewtube_session_user");
    setUser(saved ? JSON.parse(saved) : null);
  }, []);

  if (!user) {
    return (
      <div className="max-w-md mx-auto mt-10 text-center space-y-4">
        <h1 className="text-xl font-bold">Not signed in</h1>
        <Link
          href="/login"
          className="inline-block bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 rounded-full text-sm font-semibold"
        >
          Create Account or Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div
            className={`w-20 h-20 rounded-full ${user.color} flex items-center justify-center text-3xl font-bold shrink-0`}
          >
            {user.name[0]?.toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-bold">{user.name}</h1>
            <p className="text-xs text-zinc-400">
              {user.handle} • {user.email}
            </p>
            <p className="text-sm text-zinc-300 mt-1.5">{user.bio}</p>
          </div>
        </div>

        <button
          onClick={() => {
            localStorage.removeItem("yewtube_session_user");
            window.dispatchEvent(new Event("yewtube-storage-update"));
            router.push("/login");
          }}
          className="flex items-center gap-2 bg-zinc-800 hover:bg-red-950 hover:text-red-300 px-4 py-2 rounded-full text-xs font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );
}
