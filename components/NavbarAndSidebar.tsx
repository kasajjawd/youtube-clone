"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import {
  Search,
  ThumbsUp,
  Home,
  Play,
  History,
  Users,
  User,
  LogIn,
  Globe,
} from "lucide-react";

export interface PlatformAccount {
  id: string;
  email: string;
  name: string;
  handle: string;
  color: string;
  bio: string;
  joinedAt: string;
  favoriteTopics: string[];
}

export default function NavbarAndSidebar({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search_query") || "");
  const [currentUser, setCurrentUser] = useState<PlatformAccount | null>(null);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [historyCount, setHistoryCount] = useState(0);
  const [likedCount, setLikedCount] = useState(0);
  const [usersCount, setUsersCount] = useState(0);

  const syncLocalState = () => {
    try {
      const savedSession = localStorage.getItem("yewtube_session_user");
      const savedSubs = localStorage.getItem("yewtube_subs");
      const savedHistory = localStorage.getItem("yewtube_history");
      const savedLiked = localStorage.getItem("yewtube_liked");

      setCurrentUser(savedSession ? JSON.parse(savedSession) : null);
      setSubscriptions(savedSubs ? JSON.parse(savedSubs) : []);
      setHistoryCount(savedHistory ? JSON.parse(savedHistory).length : 0);
      setLikedCount(savedLiked ? JSON.parse(savedLiked).length : 0);
    } catch {
      // Ignore storage errors
    }
  };

  useEffect(() => {
    setSearch(searchParams.get("search_query") || "");
  }, [searchParams]);

  useEffect(() => {
    syncLocalState();
    fetch("/api/users")
      .then((r) => r.json())
      .then((d) => {
        if (Array.isArray(d.users)) setUsersCount(d.users.length);
      })
      .catch(() => {});

    window.addEventListener("yewtube-storage-update", syncLocalState);
    return () => window.removeEventListener("yewtube-storage-update", syncLocalState);
  }, [pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    router.push(`/results?search_query=${encodeURIComponent(search.trim())}`);
  };

  const navItemClass = (href: string) =>
    `flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
      pathname === href ? "bg-zinc-800 font-semibold text-white" : "hover:bg-zinc-800/60 text-zinc-200"
    }`;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#0f0f0f]/95 backdrop-blur px-4 h-14 border-b border-zinc-800">
        <Link
          href="/"
          className="flex items-center gap-1.5 font-bold text-xl tracking-tight"
        >
          <span className="bg-emerald-600 p-1.5 rounded-lg flex items-center justify-center">
            <Play className="w-4 h-4 fill-white text-white" />
          </span>
          <span>YewTube</span>
        </Link>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-xl mx-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos or creators..."
            className="w-full bg-[#121212] border border-zinc-700 rounded-l-full px-4 py-1.5 text-sm focus:outline-none focus:border-emerald-500"
          />
          <button
            type="submit"
            className="bg-zinc-800 border border-l-0 border-zinc-700 rounded-r-full px-5 hover:bg-zinc-700"
          >
            <Search className="w-4 h-4 text-zinc-300" />
          </button>
        </form>

        {currentUser ? (
          <Link
            href="/account"
            className="flex items-center gap-2 hover:bg-zinc-800 py-1 px-2.5 rounded-full transition"
          >
            <span className="hidden sm:inline text-xs font-medium text-zinc-300">
              {currentUser.name}
            </span>
            <div
              className={`w-8 h-8 rounded-full ${currentUser.color} flex items-center justify-center font-bold text-sm`}
            >
              {currentUser.name[0]?.toUpperCase()}
            </div>
          </Link>
        ) : (
          <Link
            href="/login"
            className="flex items-center gap-2 border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10 px-3.5 py-1.5 rounded-full text-xs font-semibold transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col w-56 p-3 gap-1 border-r border-zinc-800/70 shrink-0">
          <Link href="/" className={navItemClass("/")}>
            <Home className="w-5 h-5" />
            <span>Home</span>
          </Link>

          <Link href="/subscriptions" className={navItemClass("/subscriptions")}>
            <Users className="w-5 h-5" />
            <span>Subscriptions ({subscriptions.length})</span>
          </Link>

          <Link href="/users" className={navItemClass("/users")}>
            <Globe className="w-5 h-5 text-emerald-400" />
            <span>YewTube Users {usersCount > 0 ? `(${usersCount})` : ""}</span>
          </Link>

          <div className="my-2 border-t border-zinc-800" />
          <p className="px-3 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            You
          </p>

          <Link
            href={currentUser ? "/account" : "/login"}
            className={navItemClass(currentUser ? "/account" : "/login")}
          >
            <User className="w-5 h-5" />
            <span>{currentUser ? "Your Account" : "Create Account"}</span>
          </Link>

          <Link href="/history" className={navItemClass("/history")}>
            <History className="w-5 h-5" />
            <span>History ({historyCount})</span>
          </Link>

          <Link href="/liked" className={navItemClass("/liked")}>
            <ThumbsUp className="w-5 h-5" />
            <span>Liked Videos ({likedCount})</span>
          </Link>

          {subscriptions.length > 0 && (
            <>
              <div className="my-2 border-t border-zinc-800" />
              <p className="px-3 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Subscribed Channels
              </p>
              {subscriptions.slice(0, 8).map((ch) => (
                <Link
                  key={ch}
                  href={`/channel/${encodeURIComponent(ch)}`}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-zinc-800/60 text-left truncate"
                >
                  <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center font-bold shrink-0">
                    {ch[0]}
                  </span>
                  <span className="truncate">{ch}</span>
                </Link>
              ))}
            </>
          )}
        </aside>

        {/* Main Page Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">{children}</main>
      </div>
    </div>
  );
}
