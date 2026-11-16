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
} from "lucide-react";

const CATEGORIES = ["For You", "Trending", "Music", "Gaming", "Programming", "4K HDR", "News"];
const AVATAR_COLORS = [
  "bg-red-600",
  "bg-blue-600",
  "bg-emerald-600",
  "bg-purple-600",
  "bg-amber-600",
  "bg-pink-600",
];

interface UserProfile {
  name: string;
  handle: string;
  color: string;
  bio: string;
}

interface VideoItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  channelTitle: string;
  channelId?: string;
  viewCount?: string;
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

type TabView = "home" | "subscriptions" | "history" | "liked" | "account" | "channel";

export default function YouTubeApp() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [matchedChannels, setMatchedChannels] = useState<ChannelInfo[]>([]);
  const [activeChannel, setActiveChannel] = useState<ChannelInfo | null>(null);
  const [activeVideo, setActiveVideo] = useState<VideoItem | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("For You");
  const [tab, setTab] = useState<TabView>("home");
  const [loading, setLoading] = useState(true);

  // Account & Personalization State
  const [profile, setProfile] = useState<UserProfile>({
    name: "Guest Creator",
    handle: "@guestcreator",
    color: "bg-red-600",
    bio: "Exploring videos and building playlists.",
  });
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editName, setEditName] = useState("");
  const [editHandle, setEditHandle] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editColor, setEditColor] = useState("bg-red-600");

  const [history, setHistory] = useState<VideoItem[]>([]);
  const [likedVideos, setLikedVideos] = useState<VideoItem[]>([]);
  const [subscriptions, setSubscriptions] = useState<string[]>([]);
  const [interestScores, setInterestScores] = useState<Record<string, number>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const savedProfile = localStorage.getItem("yt_profile");
      const savedHistory = localStorage.getItem("yt_history");
      const savedLiked = localStorage.getItem("yt_liked");
      const savedSubs = localStorage.getItem("yt_subs");
      const savedInterests = localStorage.getItem("yt_interests");

      if (savedProfile) setProfile(JSON.parse(savedProfile));
      if (savedHistory) setHistory(JSON.parse(savedHistory));
      if (savedLiked) setLikedVideos(JSON.parse(savedLiked));
      if (savedSubs) setSubscriptions(JSON.parse(savedSubs));
      if (savedInterests) setInterestScores(JSON.parse(savedInterests));
    } catch {
      // Ignore storage errors
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("yt_profile", JSON.stringify(profile));
    localStorage.setItem("yt_history", JSON.stringify(history));
    localStorage.setItem("yt_liked", JSON.stringify(likedVideos));
    localStorage.setItem("yt_subs", JSON.stringify(subscriptions));
    localStorage.setItem("yt_interests", JSON.stringify(interestScores));
  }, [profile, history, likedVideos, subscriptions, interestScores, hydrated]);

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

  // Open a creator's YouTube Channel Page
  const openChannel = async (channelName: string, channelId?: string) => {
    setActiveVideo(null);
    setTab("channel");
    setLoading(true);
    setActiveChannel({
      id: channelId || "",
      title: channelName,
      description: "Loading channel videos...",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });

    try {
      const param = channelId
        ? `channelId=${encodeURIComponent(channelId)}`
        : `channelName=${encodeURIComponent(channelName)}`;
      const res = await fetch(`/api/youtube?${param}`);
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
    setComments((prev) => [
      {
        id: `local-${Date.now()}`,
        author: profile.handle,
        text: newComment.trim(),
        likes: 1,
        isOwn: true,
      },
      ...prev,
    ]);
    setNewComment("");
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
    setEditName(profile.name);
    setEditHandle(profile.handle);
    setEditBio(profile.bio);
    setEditColor(profile.color);
    setIsEditingProfile(true);
  };

  const saveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    const formattedHandle = editHandle.startsWith("@")
      ? editHandle.trim()
      : `@${editHandle.trim().replace(/\s+/g, "")}`;
    setProfile({
      name: editName.trim() || "Creator",
      handle: formattedHandle || "@creator",
      bio: editBio.trim(),
      color: editColor,
    });
    setIsEditingProfile(false);
  };

  const topInterests = Object.entries(interestScores)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);

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
          <span className="bg-red-600 p-1.5 rounded-lg flex items-center justify-center">
            <Play className="w-4 h-4 fill-white text-white" />
          </span>
          <span>YouTube</span>
        </button>

        <form onSubmit={handleSearch} className="flex flex-1 max-w-xl mx-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search videos or channels (e.g. Joe Bart)..."
            className="w-full bg-[#121212] border border-zinc-700 rounded-l-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-zinc-800 border border-l-0 border-zinc-700 rounded-r-full px-5 hover:bg-zinc-700"
          >
            <Search className="w-4 h-4 text-zinc-300" />
          </button>
        </form>

        <button
          onClick={() => {
            setActiveVideo(null);
            setTab("account");
          }}
          className="flex items-center gap-2 hover:bg-zinc-800 py-1 px-2.5 rounded-full transition"
        >
          <span className="hidden sm:inline text-xs font-medium text-zinc-300">
            {profile.name}
          </span>
          <div
            className={`w-8 h-8 rounded-full ${profile.color} flex items-center justify-center font-bold text-sm`}
          >
            {profile.name[0]?.toUpperCase()}
          </div>
        </button>
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

          <div className="my-2 border-t border-zinc-800" />
          <p className="px-3 py-1 text-xs font-semibold text-zinc-400 uppercase tracking-wider">
            You
          </p>

          <button
            onClick={() => {
              setActiveVideo(null);
              setTab("account");
            }}
            className={`flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm transition text-left ${
              tab === "account" ? "bg-zinc-800 font-semibold" : "hover:bg-zinc-800/60"
            }`}
          >
            <User className="w-5 h-5" />
            <span>Your Channel</span>
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
                        openChannel(activeVideo.channelTitle, activeVideo.channelId)
                      }
                      className="flex items-center gap-3 text-left group"
                    >
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold group-hover:bg-zinc-600 transition">
                        {activeVideo.channelTitle?.[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-sm group-hover:text-blue-400 transition">
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
                        isLiked ? "bg-blue-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"
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

                {/* Description */}
                <div className="bg-zinc-900 rounded-xl p-3 mt-3 text-sm text-zinc-300 whitespace-pre-line">
                  {activeVideo.description || "No description available."}
                </div>

                {/* Comments Section */}
                <div className="mt-6">
                  <h3 className="font-bold mb-4">{comments.length} Comments</h3>
                  <form onSubmit={handleAddComment} className="flex gap-3 mb-6">
                    <div
                      className={`w-9 h-9 rounded-full ${profile.color} flex items-center justify-center font-bold text-sm shrink-0`}
                    >
                      {profile.name[0]?.toUpperCase()}
                    </div>
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={`Commenting as ${profile.handle}...`}
                        className="flex-1 bg-transparent border-b border-zinc-700 focus:border-white pb-1 text-sm focus:outline-none"
                      />
                      <button
                        type="submit"
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold"
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
                            c.isOwn ? profile.color : "bg-zinc-800"
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
                          className="text-sm font-medium line-clamp-2 group-hover:text-blue-400 cursor-pointer"
                        >
                          {v.title}
                        </p>
                        <button
                          onClick={() => openChannel(v.channelTitle, v.channelId)}
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
            /* REAL YOUTUBE CREATOR CHANNEL PAGE */
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

              {/* Channel Banner */}
              {activeChannel.banner && (
                <div className="w-full h-36 sm:h-48 rounded-2xl overflow-hidden bg-zinc-800 mb-5">
                  <img
                    src={activeChannel.banner}
                    alt={activeChannel.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Channel Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800 mb-6">
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

              <h2 className="font-bold text-lg mb-4">Videos</h2>

              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="animate-pulse">
                      <div className="aspect-video bg-zinc-800 rounded-xl" />
                      <div className="h-4 bg-zinc-800 rounded mt-3 w-3/4" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-7">
                  {videos.map((video) => (
                    <div
                      key={video.id}
                      onClick={() => openVideo(video)}
                      className="cursor-pointer group"
                    >
                      <div className="aspect-video rounded-xl overflow-hidden bg-zinc-800">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        />
                      </div>
                      <h3 className="font-semibold text-sm line-clamp-2 mt-2.5 leading-snug">
                        {video.title}
                      </h3>
                      <p className="text-xs text-zinc-400 mt-1">{video.viewCount}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : tab === "account" ? (
            /* YOUR ACCOUNT / CHANNEL PAGE */
            <div className="max-w-5xl mx-auto space-y-8">
              <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                  <div
                    className={`w-20 h-20 rounded-full ${profile.color} flex items-center justify-center text-3xl font-bold shrink-0`}
                  >
                    {profile.name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold">{profile.name}</h1>
                    <p className="text-sm text-zinc-400">
                      {profile.handle} • {subscriptions.length} subscriptions • {history.length} watched
                    </p>
                    <p className="text-sm text-zinc-300 mt-1.5">{profile.bio}</p>
                  </div>
                </div>

                <button
                  onClick={startEditingProfile}
                  className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 px-4 py-2 rounded-full text-sm font-medium"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Customize Profile</span>
                </button>
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
                    <label className="text-xs text-zinc-400 block mb-1">Channel Bio</label>
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
                      className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold"
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
                    Watch or like a few videos and your Home feed will automatically adapt to your taste!
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

              <div>
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-bold text-lg">Recent Watch History</h2>
                  {history.length > 0 && (
                    <button
                      onClick={() => setTab("history")}
                      className="text-xs text-blue-400 hover:underline"
                    >
                      View all
                    </button>
                  )}
                </div>
                {history.length === 0 ? (
                  <p className="text-sm text-zinc-500">No videos watched yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {history.slice(0, 4).map((video) => (
                      <div
                        key={video.id}
                        onClick={() => openVideo(video)}
                        className="cursor-pointer group"
                      >
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="aspect-video w-full object-cover rounded-xl bg-zinc-800"
                        />
                        <p className="font-semibold text-sm line-clamp-2 mt-2">{video.title}</p>
                        <p className="text-xs text-zinc-400">{video.channelTitle}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
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

              {/* Matching Creator Channel Cards in Search Results */}
              {matchedChannels.length > 0 && (
                <div className="mb-6 space-y-3">
                  {matchedChannels.map((ch) => (
                    <div
                      key={ch.id}
                      className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4"
                    >
                      <div
                        onClick={() => openChannel(ch.title, ch.id)}
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
                          <h2 className="font-bold text-base group-hover:text-blue-400 transition">
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
                          onClick={() => openChannel(ch.title, ch.id)}
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
                          onClick={() => openChannel(video.channelTitle, video.channelId)}
                          className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center font-bold text-sm shrink-0"
                        >
                          {video.channelTitle?.[0]}
                        </button>
                        <div className="min-w-0">
                          <h2
                            onClick={() => openVideo(video)}
                            className="font-semibold text-sm line-clamp-2 leading-snug cursor-pointer hover:text-blue-400"
                          >
                            {video.title}
                          </h2>
                          <button
                            onClick={() => openChannel(video.channelTitle, video.channelId)}
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
