"use client";

import { useEffect, useState } from "react";
import {
  Search,
  ThumbsUp,
  Share2,
  Home,
  Play,
  History,
  Users,
  User,
  Sparkles,
  Trash2,
  Check,
  Edit3,
  ArrowLeft,
  LogOut,
  LogIn,
  Mail,
  Lock,
  UserPlus,
  Globe,
  RefreshCw,
} from "lucide-react";

const CATEGORIES = ["For You", "Trending", "Music", "Gaming", "Programming", "4K HDR", "News"];
const CHANNEL_TABS = [
  { id: "videos", label: "Videos" },
  { id: "popular", label: "Popular" },
  { id: "shorts", label: "Shorts" },
  { id: "live", label: "Live" },
];
const AVATAR_COLORS = [
  "bg-emerald-600",
  "bg-red-600",
  "bg-blue-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-pink-600",
];

interface PlatformAccount {
  id: string;
  email: string;
  name: string;
  handle: string;
  color: string;
  bio: string;
  joinedAt: string;
  favoriteTopics: string[];
}

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  channelTitle: string;
  channelId?: string;
  viewCount?: string;
  isShort?: boolean;
}

interface ChannelInfo {
  id: string;
  title: string;
  description?: string;
  avatar?: string;
  banner?: string;
  handle?: string;
  subscribers?: string;
}

type TabView =
  | "home"
  | "subscriptions"
  | "history"
  | "liked"
  | "account"
  | "channel"
  | "users"
  | "auth";

export default function YewTubeApp() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [matchedChannels, setMatchedChannels] = useState<ChannelInfo[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChannelInfo | null>(null);
  const [channelCategoryTab, setChannelCategoryTab] = useState("videos");
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("For You");
  const [tab, setTab] = useState<TabView>("home");
  const [loading, setLoading] = useState(true);

  // Shared Cloud Platform Accounts State
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [currentUser, setCurrentUser] = useState<PlatformAccount | null>(null);
  const [userDirectorySearch, setUserDirectorySearch] = useState("");
  const [selectedDirectoryUser, setSelectedDirectoryUser] = useState<PlatformAccount | null>(
    null
  );
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Auth Form State
  const [authMode, setAuthMode] = useState<"signin" | "register">("register");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authName, setAuthName] = useState("");
  const [authHandle, setAuthHandle] = useState("");
  const [authBio, setAuthBio] = useState("");
  const [authColor, setAuthColor] = useState("bg-emerald-600");
  const [authError, setAuthError] = useState("");
  const [authSubmitting, setAuthSubmitting] = useState(false);

  // Edit Profile State
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editColor, setEditColor] = useState("bg-emerald-600");

  // User Activity State
  const [history, setHistory] = useState<VideoItem[]>([]);
  const [likedVideos, setLikedVideos] = useState<VideoItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [interestScores, setInterestScores] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  // Fetch all shared accounts from backend database
  const fetchPlatformUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch("/api/users", { cache: "no-store" });
      const data = await res.json();
      if (Array.isArray(data.users)) {
        setAccounts(data.users);
      }
    } catch {
      // Ignore network errors
    }
    setLoadingUsers(false);
  };

  // Load saved session & activity on startup
  useEffect(() => {
    try {
      const savedSession = localStorage.getItem("yewtube_session_user");
      const savedHistory = localStorage.getItem("yewtube_history");
      const savedLiked = localStorage.getItem("yewtube_liked");
      const savedSubs = localStorage.getItem("yewtube_subs");
      const savedInterests = localStorage.getItem("yewtube_interests");

      if (savedSession) setCurrentUser(JSON.parse(savedSession));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedLiked) setLikedVideos(JSON.parse(savedLiked));
      if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
      if (savedInterests) setInterestScores(JSON.parse(savedInterests));
    } catch {
      // Ignore storage errors
    }
    fetchPlatformUsers();
    setHydrated(true);
  }, []);

  // Persist local session & watch preferences
  useEffect(() => {
    if (!hydrated) return;
    if (currentUser) {
      localStorage.setItem("yewtube_session_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("yewtube_session_user");
    }
    localStorage.setItem("yewtube_history", JSON.stringify(history));
    localStorage.setItem("yewtube_liked", JSON.stringify(likedVideos));
    localStorage.setItem("yewtube_subs", JSON.stringify(subscriptions));
    localStorage.setItem("yewtube_interests", JSON.stringify(interestScores));
  }, [currentUser, history, likedVideos, subscriptions, interestScores, hydrated]);

  const buildPersonalizedQuery = () => {
    const topKeywords = Object.entries(interestScores)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([word]) => word);

    if (topKeywords.length > 0) return topKeywords.join(" ");
    if (subscriptions.length > 0) return subscriptions[0];
    return "trending tech music gaming 2026";
  };

  const recordInterest = (video: VideoItem, weight = 1) => {
    const stopWords = new Set([
      "the", "and", "for", "with", "that", "this", "from", "your", "have",
      "what", "when", "where", "how", "why", "official", "video", "youtube",
    ]);
    const words = `${video.title} ${video.channelTitle}`
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, "")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !stopWords.has(w));

    setInterestScores((prev) => {
      const updated = { ...prev };
      words.forEach((word) => {
        updated[word] = (updated[word] || 0) + weight;
      });

      if (currentUser) {
        const top3 = Object.entries(updated)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 3)
          .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
        fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "update",
            userId: currentUser.id,
            updates: { favoriteTopics: top3 },
          }),
        }).catch(() => {});
      }

      return updated;
    });
  };

  const fetchVideos = async (q = "") => {
    setLoading(true);
    setActiveVideo(null);
    setMatchedChannels([]);
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setMatchedChannels(data.channels || []);
    } catch {
      setVideos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (!hydrated) return;
    fetchVideos(buildPersonalizedQuery());
  }, [hydrated]);

  const openChannel = async (
    channelName: string,
    channelId?: string,
    selectedTab = "videos"
  ) => {
    setActiveVideo(null);
    setTab("channel");
    setChannelCategoryTab(selectedTab);
    setLoading(true);
    setActiveChannel((prev) =>
      prev && (prev.id === channelId || prev.title === channelName)
        ? prev
        : {
            id: channelId || "",
            title: channelName,
            description: "Loading channel videos...",
          }
    );
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const param = channelId
        ? `channelId=${encodeURIComponent(channelId)}`
        : `channelName=${encodeURIComponent(channelName)}`;
      const res = await fetch(
        `/api/youtube?${param}&tab=${encodeURIComponent(selectedTab)}`
      );
      const data = await res.json();
      if (data.channel) setActiveChannel(data.channel);
      setVideos(data.videos || []);
    } catch {
      setVideos([]);
    }
    setLoading(false);
  };

  const openVideo = async (video: VideoItem) => {
    setActiveVideo(video);
    window.scrollTo({ top: 0, behavior: "smooth" });

    setHistory((prev) => [video, ...prev.filter((v) => v.id !== video.id)].slice(0, 50));
    recordInterest(video, 2);

    try {
      const res = await fetch(`/api/youtube?videoId=${video.id}`);
      const data = await res.json();
      if (data.video) setActiveVideo({ ...video, ...data.video });
      setComments(data.comments || []);
    } catch {
      setComments([]);
    }
  };

  const toggleLike = (video: VideoItem) => {
    const exists = likedVideos.some((v) => v.id === video.id);
    if (exists) {
      setLikedVideos((prev) => prev.filter((v) => v.id !== video.id));
    } else {
      setLikedVideos((prev) => [video, ...prev]);
      recordInterest(video, 4);
    }
  };

  const toggleSubscribe = (channelTitle: string) => {
    setSubscriptions((prev) =>
      prev.includes(channelTitle)
        ? prev.filter((c) => c !== channelTitle)
        : [channelTitle, ...prev]
    );
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    if (!currentUser) {
      setTab("auth");
      setAuthMode("signin");
      setAuthError("Sign in with your email to post comments.");
      return;
    }
    setComments((prev) => [
      {
        id: `local-${Date.now()}`,
        author: currentUser.handle,
        text: newComment.trim(),
        likes: 1,
        isOwn: true,
      },
      ...prev,
    ]);
    setNewComment("");
  };

  // Cloud Registration & Sign-In Handler
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError("");
    setAuthSubmitting(true);

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: authMode,
          email: authEmail,
          password: authPassword,
          name: authName,
          handle: authHandle,
          bio: authBio,
          color: authColor,
        }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setAuthError(data.error || "Authentication failed.");
        setAuthSubmitting(false);
        return;
      }

      setCurrentUser(data.user);
      await fetchPlatformUsers();
      setTab("account");
      setAuthEmail("");
      setAuthPassword("");
      setAuthName("");
      setAuthHandle("");
      setAuthBio("");
    } catch {
      setAuthError("Network error. Please try again.");
    }
    setAuthSubmitting(false);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setTab("home");
    setCategory("");
    search
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 2)
      .forEach((word) => {
        setInterestScores((prev) => ({ ...prev, [word]: (prev[word] || 0) + 2 }));
      });
    fetchVideos(search);
  };

  const handleCategory = (cat: string) => {
    setTab("home");
    setCategory(cat);
    if (cat === "For You") {
      fetchVideos(buildPersonalizedQuery());
    } else {
      fetchVideos(cat);
    }
  };

  const loadSubscriptionsFeed = async () => {
    setTab("subscriptions");
    setActiveVideo(null);
    if (subscriptions.length === 0) {
      setVideos([]);
      return;
    }
    setLoading(true);
    try {
      const topChannels = subscriptions.slice(0, 3);
      const results = await Promise.all(
        topChannels.map((ch) =>
          fetch(`/api/youtube?q=${encodeURIComponent(ch)}`).then((r) => r.json())
        )
      );
      const merged = results.flatMap((r) => (r.videos || []).slice(0, 6));
      setVideos(merged);
    } catch {
      setVideos([]);
    }
    setLoading(false);
  };

  const startEditingProfile = () => {
    if (!currentUser) return;
    setEditName(currentUser.name);
    setEditHandle(currentUser.handle);
    setEditBio(currentUser.bio);
    setEditColor(currentUser.color);
    setIsEditingProfile(true);
  };

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const formattedHandle = editHandle.startsWith("@")
      ? editHandle.trim()
      : `@${editHandle.trim().replace(/\s+/g, "")}`;

    const updates = {
      name: editName.trim() || currentUser.name,
      handle: formattedHandle || currentUser.handle,
      bio: editBio.trim(),
      color: editColor,
    };

    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update",
          userId: currentUser.id,
          updates,
        }),
      });
      const data = await res.json();
      if (data.user) {
        setCurrentUser(data.user);
        await fetchPlatformUsers();
      }
    } catch {
      // Fallback local update
      setCurrentUser({ ...currentUser, ...updates });
    }
    setIsEditingProfile(false);
  };

  const topInterests = Object.entries(interestScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

  const filteredPlatformUsers = accounts.filter((u) => {
    const q = userDirectorySearch.trim().toLowerCase();
    if (!q) return true;
    return (
      u.name.toLowerCase().includes(q) ||
      u.handle.toLowerCase().includes(q) ||
      u.bio.toLowerCase().includes(q) ||
      (u.favoriteTopics || []).some((t) => t.toLowerCase().includes(q))
    );
  });

  const isLiked = activeVideo ? likedVideos.some((v) => v.id === activeVideo.id) : false;
  const isSubscribed = activeVideo
    ? subscriptions.includes(activeVideo.channelTitle)
    : false;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#0f0f0f]/95 backdrop-blur px-4 h-14 border-b border-zinc-800">
        <button
          onClick={() => {
            setTab("home");
            setCategory("For You");
            setSearch("");
            fetchVideos(buildPersonalizedQuery());
          }}
          className="flex items-center gap-1.5 font-bold text-xl tracking-tight"
        >
          <span className="bg-emerald-600 p-1.5 rounded-lg flex items-center justify-center">
            <Play className="w-4 h-4 fill-white text-white" />
          </span>
          <span>YewTube</span>
        </button>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-xl mx-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos or creators (e.g. Joe Bart)..."
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
          <button
            onClick={() => {
              setActiveVideo(null);
              setTab("account");
            }}
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
          </button>
        ) : (
          <button
            onClick={() => {
              setActiveVideo(null);
              setAuthMode("signin");
              setAuthError("");
              setTab("auth");
            }}
            className="flex items-center gap-2 border border-emerald-500/60 text-emerald-400 hover:bg-emerald-500/10 px-3.5 py-1.5 rounded-full text-xs font-semibold transition"
          >
            <LogIn className="w-4 h-4" />
            <span>Sign In</span>
          </button>
        )}
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col w-56 p-3 gap-1 border-r border-zinc-800/70 shrink-0">
          <button
            onClick={() => {
              setTab("home");
              setCategory("For You");
              fetchVideos(buildPersonalizedQuery());
            }}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              tab === "home" && !activeVideo ? "bg-zinc-800 font-semibold" : "hover:bg-zinc-800/60"
            }`}
          >
            <Home className="w-5 h-5" />
            <span>Home</span>
          </button>

          <button
            onClick={loadSubscriptionsFeed}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              tab === "subscriptions" ? "bg-zinc-800 font-semibold" : "hover:bg-zinc-800/60"
            }`}
          >
            <Users className="w-5 h-5" />
            <span>Subscriptions ({subscriptions.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveVideo(null);
              setSelectedDirectoryUser(null);
              setTab("users");
              fetchPlatformUsers();
            }}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              tab === "users" ? "bg-zinc-800 font-semibold text-emerald-400" : "hover:bg-zinc-800/60"
            }`}
          >
            <Globe className="w-5 h-5" />
            <span>YewTube Users ({accounts.length})</span>
          </button>

          <div className="my-2 border-t border-zinc-800" />
          <p className="px-3 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            You
          </p>

          <button
            onClick={() => {
              setActiveVideo(null);
              setTab(currentUser ? "account" : "auth");
            }}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              tab === "account" || tab === "auth"
                ? "bg-zinc-800 font-semibold"
                : "hover:bg-zinc-800/60"
            }`}
          >
            <User className="w-5 h-5" />
            <span>{currentUser ? "Your Account" : "Create Account"}</span>
          </button>

          <button
            onClick={() => {
              setActiveVideo(null);
              setTab("history");
            }}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              tab === "history" ? "bg-zinc-800 font-semibold" : "hover:bg-zinc-800/60"
            }`}
          >
            <History className="w-5 h-5" />
            <span>History ({history.length})</span>
          </button>

          <button
            onClick={() => {
              setActiveVideo(null);
              setTab("liked");
            }}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              tab === "liked" ? "bg-zinc-800 font-semibold" : "hover:bg-zinc-800/60"
            }`}
          >
            <ThumbsUp className="w-5 h-5" />
            <span>Liked Videos ({likedVideos.length})</span>
          </button>

          {subscriptions.length > 0 && (
            <>
              <div className="my-2 border-t border-zinc-800" />
              <p className="px-3 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                Subscribed Channels
              </p>
              {subscriptions.slice(0, 8).map((ch) => (
                <button
                  key={ch}
                  onClick={() => openChannel(ch)}
                  className="flex items-center gap-3 px-3 py-2 rounded-xl text-xs hover:bg-zinc-800/60 text-left truncate"
                >
                  <span className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center font-bold shrink-0">
                    {ch[0]}
                  </span>
                  <span className="truncate">{ch}</span>
                </button>
              ))}
            </>
          )}
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          {activeVideo ? (
            /* WATCH PAGE VIEW */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
              <div className="lg:col-span-2">
                <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
                  <iframe
                    className="w-full h-full"
                    src={`https://www.youtube.com/embed/${activeVideo.id}?autoplay=1`}
                    title={activeVideo.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>

                <h1 className="text-lg md:text-xl font-bold mt-3">{activeVideo.title}</h1>

                <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() =>
                        openChannel(activeVideo.channelTitle, activeVideo.channelId, "videos")
                      }
                      className="flex items-center gap-3 text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold group-hover:bg-zinc-600 transition">
                        {activeVideo.channelTitle?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-emerald-400 transition">
                          {activeVideo.channelTitle}
                        </p>
                        <p className="text-xs text-zinc-400">{activeVideo.viewCount}</p>
                      </div>
                    </button>

                    <button
                      onClick={() => toggleSubscribe(activeVideo.channelTitle)}
                      className={`ml-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        isSubscribed
                          ? "bg-zinc-800 text-white hover:bg-zinc-700"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {isSubscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleLike(activeVideo)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                        isLiked ? "bg-emerald-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{isLiked ? "Liked" : "Like"}</span>
                    </button>
                    <button
                      onClick={() =>
                        navigator.clipboard?.writeText(`https://youtu.be/${activeVideo.id}`)
                      }
                      className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 hover:bg-zinc-700"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share</span>
                    </button>
                  </div>
                </div>

                <div className="bg-zinc-900 rounded-xl p-3 mt-3 text-sm text-zinc-300 whitespace-pre-line">
                  {activeVideo.description || "No description available."}
                </div>

                {/* Comments Section */}
                <div className="mt-6">
                  <h3 className="font-bold mb-4">{comments.length} Comments</h3>
                  <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
                    <div
                      className={`w-9 h-9 rounded-full ${
                        currentUser?.color || "bg-zinc-700"
                      } flex items-center justify-center font-bold text-sm shrink-0`}
                    >
                      {currentUser ? currentUser.name[0]?.toUpperCase() : "?"}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={
                          currentUser
                            ? `Commenting as ${currentUser.handle}...`
                            : "Sign in to comment..."
                        }
                        className="flex-1 bg-transparent border-b border-zinc-700 focus:border-white pb-1 text-sm focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold"
                      >
                        Comment
                      </button>
                    </div>
                  </form>

                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3 text-sm">
                        <div
                          className={`w-8 h-8 rounded-full ${
                            c.isOwn ? currentUser?.color || "bg-emerald-600" : "bg-zinc-800"
                          } flex items-center justify-center shrink-0 font-bold text-xs`}
                        >
                          {c.author?.[1]?.toUpperCase() || c.author?.[0]?.toUpperCase() || "U"}
                        </div>
                        <div>
                          <p className="font-semibold text-xs text-zinc-300">{c.author}</p>
                          <p className="text-zinc-200 mt-0.5">{c.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Up Next Sidebar */}
              <div className="space-y-3">
                <h3 className="font-semibold text-sm text-zinc-400">Up Next</h3>
                {videos
                  .filter((v) => v.id !== activeVideo.id)
                  .map((v) => (
                    <div key={v.id} className="flex gap-2.5 group">
                      <img
                        onClick={() => openVideo(v)}
                        src={v.thumbnail}
                        alt={v.title}
                        className="w-40 aspect-video object-cover rounded-lg bg-zinc-800 shrink-0 cursor-pointer"
                      />
                      <div className="min-w-0">
                        <p
                          onClick={() => openVideo(v)}
                          className="text-sm font-medium line-clamp-2 group-hover:text-emerald-400 cursor-pointer"
                        >
                          {v.title}
                        </p>
                        <button
                          onClick={() => openChannel(v.channelTitle, v.channelId, "videos")}
                          className="text-xs text-zinc-400 hover:text-white mt-1 block text-left"
                        >
                          {v.channelTitle}
                        </button>
                        <p className="text-xs text-zinc-500">{v.viewCount}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : tab === "channel" && activeChannel ? (
            /* CREATOR CHANNEL PAGE WITH CATEGORY TABS */
            <div className="max-w-6xl mx-auto">
              <button
                onClick={() => {
                  setTab("home");
                  fetchVideos(buildPersonalizedQuery());
                }}
                className="flex items-center gap-2 text-xs text-zinc-400 hover:text-white mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Feed
              </button>

              {activeChannel.banner && (
                <div className="w-full h-36 sm:h-48 rounded-2xl overflow-hidden bg-zinc-800 mb-5">
                  <img
                    src={activeChannel.banner}
                    alt={activeChannel.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
                <div className="flex items-center gap-4">
                  {activeChannel.avatar ? (
                    <img
                      src={activeChannel.avatar}
                      alt={activeChannel.title}
                      className="w-20 h-20 rounded-full object-cover bg-zinc-800 shrink-0"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold shrink-0">
                      {activeChannel.title[0]}
                    </div>
                  )}
                  <div>
                    <h1 className="text-2xl font-bold">{activeChannel.title}</h1>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      {activeChannel.handle} {activeChannel.subscribers}
                    </p>
                    {activeChannel.description && (
                      <p className="text-sm text-zinc-300 mt-2 line-clamp-2 max-w-2xl">
                        {activeChannel.description}
                      </p>
                    )}
                  </div>
                </div>

                <button
                  onClick={() => toggleSubscribe(activeChannel.title)}
                  className={`px-5 py-2.5 rounded-full text-sm font-semibold transition shrink-0 ${
                    subscriptions.includes(activeChannel.title)
                      ? "bg-zinc-800 text-white hover:bg-zinc-700"
                      : "bg-white text-black hover:bg-zinc-200"
                  }`}
                >
                  {subscriptions.includes(activeChannel.title) ? "Subscribed" : "Subscribe"}
                </button>
              </div>

              <div className="flex items-center gap-6 border-b border-zinc-800 mb-6">
                {CHANNEL_TABS.map((ct) => (
                  <button
                    key={ct.id}
                    onClick={() =>
                      openChannel(activeChannel.title, activeChannel.id, ct.id)
                    }
                    className={`pb-3 text-sm font-semibold border-b-2 transition ${
                      channelCategoryTab === ct.id
                        ? "border-white text-white"
                        : "border-transparent text-zinc-400 hover:text-zinc-200"
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
                <span className="ml-auto text-xs text-zinc-500 pb-3">
                  {!loading && `${videos.length} videos`}
                </span>
              </div>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(12)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-zinc-800 rounded-xl" />
                      <div className="h-4 bg-zinc-800 rounded mt-3 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : videos.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  No videos found in this category for {activeChannel.title}.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-7">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => openVideo(video)}
                      className="cursor-pointer group"
                    >
                      <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800 relative">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                        {video.isShort && (
                          <span className="absolute bottom-2 right-2 bg-black/80 text-[10px] font-bold px-1.5 py-0.5 rounded">
                            SHORT
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mt-2.5 leading-snug group-hover:text-emerald-400">
                        {video.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">{video.viewCount}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "users" ? (
            /* SHARED YEWTUBE USERS DIRECTORY PAGE */
            <div className="max-w-5xl mx-auto space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl font-bold flex items-center gap-2">
                    <Globe className="w-6 h-6 text-emerald-400" />
                    YewTube Users
                  </h1>
                  <p className="text-sm text-zinc-400 mt-1">
                    Search and discover registered accounts across all devices.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={fetchPlatformUsers}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-200 px-3.5 py-2 rounded-full text-xs font-semibold flex items-center gap-1.5"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingUsers ? "animate-spin" : ""}`} />
                    Refresh
                  </button>

                  {!currentUser && (
                    <button
                      onClick={() => {
                        setAuthMode("register");
                        setTab("auth");
                      }}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2"
                    >
                      <UserPlus className="w-4 h-4" />
                      Join YewTube
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-3.5" />
                <input
                  type="text"
                  value={userDirectorySearch}
                  onChange={(e) => setUserDirectorySearch(e.target.value)}
                  placeholder="Search YewTube users by name, @handle, bio, or interests..."
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-11 pr-4 py-3 text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>

              {selectedDirectoryUser && (
                <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-6 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-16 h-16 rounded-full ${selectedDirectoryUser.color} flex items-center justify-center text-2xl font-bold shrink-0`}
                      >
                        {selectedDirectoryUser.name[0]?.toUpperCase()}
                      </div>
                      <div>
                        <h2 className="text-xl font-bold">{selectedDirectoryUser.name}</h2>
                        <p className="text-xs text-zinc-400">
                          {selectedDirectoryUser.handle} • Joined {selectedDirectoryUser.joinedAt}
                        </p>
                        <p className="text-sm text-zinc-200 mt-2">{selectedDirectoryUser.bio}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDirectoryUser(null)}
                      className="text-xs text-zinc-400 hover:text-white"
                    >
                      Close
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2 pt-2">
                    {(selectedDirectoryUser.favoriteTopics || []).map((topic) => (
                      <button
                        key={topic}
                        onClick={() => {
                          setTab("home");
                          setCategory("");
                          fetchVideos(topic);
                        }}
                        className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1 rounded-full text-xs text-emerald-400"
                      >
                        #{topic}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {filteredPlatformUsers.length === 0 ? (
                <p className="text-sm text-zinc-400">
                  No YewTube users matched &ldquo;{userDirectorySearch}&rdquo;.
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredPlatformUsers.map((u) => (
                    <div
                      key={u.id}
                      onClick={() => setSelectedDirectoryUser(u)}
                      className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 rounded-2xl p-5 cursor-pointer transition flex flex-col justify-between gap-4"
                    >
                      <div className="flex items-center gap-3.5">
                        <div
                          className={`w-12 h-12 rounded-full ${u.color} flex items-center justify-center text-lg font-bold shrink-0`}
                        >
                          {u.name[0]?.toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-base truncate flex items-center gap-2">
                            {u.name}
                            {currentUser?.id === u.id && (
                              <span className="text-[10px] bg-emerald-600/30 text-emerald-300 px-2 py-0.5 rounded-full">
                                You
                              </span>
                            )}
                          </h3>
                          <p className="text-xs text-zinc-400 truncate">{u.handle}</p>
                        </div>
                      </div>

                      <p className="text-xs text-zinc-300 line-clamp-2">{u.bio}</p>

                      <div className="flex flex-wrap gap-1.5">
                        {(u.favoriteTopics || []).slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="bg-zinc-800 text-zinc-300 px-2.5 py-0.5 rounded-full text-[11px]"
                          >
                            {t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "auth" ? (
            /* EMAIL ACCOUNT REGISTRATION & SIGN IN PAGE */
            <div className="max-w-md mx-auto mt-6 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 sm:p-8">
              <div className="flex items-center gap-2 mb-6">
                <span className="bg-emerald-600 p-2 rounded-xl">
                  <Play className="w-5 h-5 fill-white text-white" />
                </span>
                <div>
                  <h1 className="text-xl font-bold">
                    {authMode === "register" ? "Create YewTube Account" : "Sign In to YewTube"}
                  </h1>
                  <p className="text-xs text-zinc-400">
                    {authMode === "register"
                      ? "Your profile will appear publicly in YewTube Users"
                      : "Welcome back to YewTube"}
                  </p>
                </div>
              </div>

              {authError && (
                <div className="bg-red-950/70 border border-red-700 text-red-200 text-xs rounded-xl p-3 mb-4">
                  {authError}
                </div>
              )}

              <form onSubmit={handleAuthSubmit} className="space-y-4">
                {authMode === "register" && (
                  <>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Display Name</label>
                      <input
                        type="text"
                        required
                        value={authName}
                        onChange={(e) => setAuthName(e.target.value)}
                        placeholder="e.g. Jordan Taylor"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Handle</label>
                      <input
                        type="text"
                        value={authHandle}
                        onChange={(e) => setAuthHandle(e.target.value)}
                        placeholder="@jordantaylor"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Email Address</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="email"
                      required
                      value={authEmail}
                      onChange={(e) => setAuthEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs text-zinc-400 block mb-1">Password</label>
                  <div className="relative">
                    <Lock className="w-4 h-4 text-zinc-500 absolute left-3.5 top-3" />
                    <input
                      type="password"
                      required
                      value={authPassword}
                      onChange={(e) => setAuthPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                {authMode === "register" && (
                  <>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Channel Bio</label>
                      <input
                        type="text"
                        value={authBio}
                        onChange={(e) => setAuthBio(e.target.value)}
                        placeholder="What do you like watching?"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-2">Avatar Color</label>
                      <div className="flex gap-2">
                        {AVATAR_COLORS.map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setAuthColor(c)}
                            className={`w-8 h-8 rounded-full ${c} flex items-center justify-center`}
                          >
                            {authColor === c && <Check className="w-4 h-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <button
                  type="submit"
                  disabled={authSubmitting}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 rounded-xl text-sm transition"
                >
                  {authSubmitting
                    ? "Please wait..."
                    : authMode === "register"
                    ? "Create Account"
                    : "Sign In"}
                </button>
              </form>

              <div className="mt-5 pt-4 border-t border-zinc-800 text-center">
                <button
                  onClick={() => {
                    setAuthMode(authMode === "register" ? "signin" : "register");
                    setAuthError("");
                  }}
                  className="text-xs text-emerald-400 hover:underline"
                >
                  {authMode === "register"
                    ? "Already have an account? Sign in"
                    : "Need an account? Create one with email"}
                </button>
              </div>
            </div>
          ) : tab === "account" ? (
            /* YOUR ACCOUNT PAGE */
            !currentUser ? (
              <div className="max-w-md mx-auto mt-10 text-center space-y-4">
                <h1 className="text-xl font-bold">You are not signed in</h1>
                <p className="text-sm text-zinc-400">
                  Create a YewTube account with your email to comment, customize your profile, and appear in YewTube Users across all devices.
                </p>
                <button
                  onClick={() => {
                    setAuthMode("register");
                    setTab("auth");
                  }}
                  className="bg-emerald-600 hover:bg-emerald-500 px-6 py-2.5 rounded-full text-sm font-semibold"
                >
                  Create Account
                </button>
              </div>
            ) : (
              <div className="max-w-5xl mx-auto space-y-8">
                <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                  <div className="flex items-center gap-5">
                    <div
                      className={`w-20 h-20 rounded-full ${currentUser.color} flex items-center justify-center text-3xl font-bold shrink-0`}
                    >
                      {currentUser.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{currentUser.name}</h1>
                      <p className="text-xs text-zinc-400">
                        {currentUser.handle} • {currentUser.email}
                      </p>
                      <p className="text-sm text-zinc-300 mt-1.5">{currentUser.bio}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={startEditingProfile}
                      className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full text-xs font-medium"
                    >
                      <Edit3 className="w-4 h-4" />
                      <span>Edit Profile</span>
                    </button>
                    <button
                      onClick={() => {
                        setCurrentUser(null);
                        setTab("auth");
                        setAuthMode("signin");
                      }}
                      className="flex items-center gap-2 bg-zinc-800 hover:bg-red-950 hover:text-red-300 px-4 py-2 rounded-full text-xs font-medium transition"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>

                {isEditingProfile && (
                  <form
                    onSubmit={saveProfile}
                    className="bg-zinc-900 border border-zinc-700 rounded-2xl p-6 space-y-4"
                  >
                    <h2 className="font-bold text-lg">Customize Your Account</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Display Name</label>
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-zinc-400 block mb-1">Handle</label>
                        <input
                          type="text"
                          value={editHandle}
                          onChange={(e) => setEditHandle(e.target.value)}
                          className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-1">Bio</label>
                      <input
                        type="text"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value)}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-zinc-400 block mb-2">Avatar Color</label>
                      <div className="flex gap-2">
                        {AVATAR_COLORS.map((c) => (
                          <button
                            type="button"
                            key={c}
                            onClick={() => setEditColor(c)}
                            className={`w-8 h-8 rounded-full ${c} flex items-center justify-center`}
                          >
                            {editColor === c && <Check className="w-4 h-4 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2 pt-2">
                      <button
                        type="submit"
                        className="bg-emerald-600 text-white px-5 py-2 rounded-full text-sm font-semibold"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingProfile(false)}
                        className="bg-zinc-800 px-5 py-2 rounded-full text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                )}

                <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-amber-400" />
                      <h2 className="font-bold">Your Recommendation Algorithm</h2>
                    </div>
                    {topInterests.length > 0 && (
                      <button
                        onClick={() => setInterestScores({})}
                        className="text-xs text-zinc-400 hover:text-white flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Reset Algorithm
                      </button>
                    )}
                  </div>
                  {topInterests.length === 0 ? (
                    <p className="text-sm text-zinc-400">
                      Watch or like videos and your Home feed and YewTube Users profile tags will adapt automatically!
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {topInterests.map(([topic, score]) => (
                        <button
                          key={topic}
                          onClick={() => {
                            setTab("home");
                            setCategory("");
                            fetchVideos(topic);
                          }}
                          className="bg-zinc-800 hover:bg-zinc-700 px-3 py-1.5 rounded-full text-xs flex items-center gap-2"
                        >
                          <span className="capitalize font-medium">{topic}</span>
                          <span className="text-zinc-400">+{score}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )
          ) : tab === "history" || tab === "liked" ? (
            /* HISTORY OR LIKED VIDEOS PAGE */
            <div className="max-w-6xl mx-auto">
              <div className="flex items-center justify-between mb-6">
                <h1 className="text-xl font-bold">
                  {tab === "history" ? "Watch History" : "Liked Videos"}
                </h1>
                {tab === "history" && history.length > 0 && (
                  <button
                    onClick={() => setHistory([])}
                    className="flex items-center gap-2 text-xs bg-zinc-800 hover:bg-zinc-700 px-3 py-2 rounded-full"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear Watch History
                  </button>
                )}
              </div>

              {(tab === "history" ? history : likedVideos).length === 0 ? (
                <p className="text-zinc-400 text-sm">
                  {tab === "history"
                    ? "Videos you watch will appear here."
                    : "Videos you like will appear here."}
                </p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                  {(tab === "history" ? history : likedVideos).map((video) => (
                    <div
                      key={video.id}
                      onClick={() => openVideo(video)}
                      className="cursor-pointer group"
                    >
                      <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                      </div>
                      <h2 className="font-semibold text-sm line-clamp-2 mt-2">{video.title}</h2>
                      <p className="text-xs text-zinc-400 mt-1">{video.channelTitle}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            /* HOME & SUBSCRIPTIONS FEED VIEW */
            <>
              {tab === "subscriptions" ? (
                <div className="mb-5">
                  <h1 className="text-xl font-bold">Subscriptions Feed</h1>
                  {subscriptions.length === 0 && (
                    <p className="text-sm text-zinc-400 mt-2">
                      Subscribe to channels while watching videos to see their latest uploads here!
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
                        category === cat
                          ? "bg-white text-black"
                          : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                      }`}
                    >
                      {cat === "For You" && <Sparkles className="w-3.5 h-3.5" />}
                      {cat}
                    </button>
                  ))}
                </div>
              )}

              {matchedChannels.length > 0 && (
                <div className="mb-6 space-y-3">
                  {matchedChannels.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div
                        onClick={() => openChannel(ch.title, ch.id, "videos")}
                        className="flex items-center gap-4 cursor-pointer group min-w-0"
                      >
                        {ch.avatar ? (
                          <img
                            src={ch.avatar}
                            alt={ch.title}
                            className="w-16 h-16 rounded-full object-cover bg-zinc-800 shrink-0"
                          />
                        ) : (
                          <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center text-2xl font-bold shrink-0">
                            {ch.title[0]}
                          </div>
                        )}
                        <div className="min-w-0">
                          <h2 className="font-bold text-base group-hover:text-emerald-400 transition">
                            {ch.title}
                          </h2>
                          <p className="text-xs text-zinc-400">
                            {ch.handle} {ch.subscribers && `• ${ch.subscribers}`}
                          </p>
                          <p className="text-xs text-zinc-400 line-clamp-1 mt-1">
                            {ch.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => openChannel(ch.title, ch.id, "videos")}
                          className="bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full text-xs font-semibold"
                        >
                          View Channel
                        </button>
                        <button
                          onClick={() => toggleSubscribe(ch.title)}
                          className={`px-4 py-2 rounded-full text-xs font-semibold transition ${
                            subscriptions.includes(ch.title)
                              ? "bg-zinc-800 text-white"
                              : "bg-white text-black hover:bg-zinc-200"
                          }`}
                        >
                          {subscriptions.includes(ch.title) ? "Subscribed" : "Subscribe"}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-zinc-800 rounded-xl" />
                      <div className="h-4 bg-zinc-800 rounded mt-3 w-3/4" />
                      <div className="h-3 bg-zinc-800 rounded mt-2 w-1/2" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-4 gap-y-8">
                  {videos.map((video) => (
                    <div key={video.id} className="group">
                      <div
                        onClick={() => openVideo(video)}
                        className="aspect-video rounded-xl overflow-hidden bg-zinc-800 cursor-pointer"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                      <div className="flex gap-3 mt-3">
                        <button
                          onClick={() =>
                            openChannel(video.channelTitle, video.channelId, "videos")
                          }
                          className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center font-bold text-sm shrink-0"
                        >
                          {video.channelTitle?.[0]}
                        </button>
                        <div className="min-w-0">
                          <h2
                            onClick={() => openVideo(video)}
                            className="font-semibold text-sm line-clamp-2 leading-snug cursor-pointer hover:text-emerald-400"
                          >
                            {video.title}
                          </h2>
                          <button
                            onClick={() =>
                              openChannel(video.channelTitle, video.channelId, "videos")
                            }
                            className="text-xs text-zinc-400 hover:text-white mt-1 block text-left"
                          >
                            {video.channelTitle}
                          </button>
                          <p className="text-xs text-zinc-400">{video.viewCount}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
