"use client";

import { useEffect, useState } from "react";
import { Search, ThumbsUp, Share2, Home, Flame, Music, Gamepad2, Code2, Play } from "lucide-react";

const CATEGORIES = ["All", "Music", "Gaming", "Programming", "4K HDR", "News", "Podcasts"];

export default function YouTubeApp() {
  const [videos, setVideos] = useState<any[]>([]);
  const [activeVideo, setActiveVideo] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  const fetchVideos = async (q = "") => {
    setLoading(true);
    setActiveVideo(null);
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setVideos(data.videos || []);
      setHasApiKey(data.hasApiKey);
    } catch {
      setVideos([]);
    }
    setLoading(false);
  };

  const openVideo = async (video: any) => {
    setActiveVideo(video);
    setLiked(false);
    setSubscribed(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
    try {
      const res = await fetch(`/api/youtube?videoId=${video.id}`);
      const data = await res.json();
      if (data.video) setActiveVideo({ ...video, ...data.video });
      setComments(data.comments || []);
    } catch {
      setComments([]);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchVideos(search);
  };

  const handleCategory = (cat: string) => {
    setCategory(cat);
    fetchVideos(cat === "All" ? "" : cat);
  };

  return (
    <div className="min-h-screen flex flex-col">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between bg-[#0f0f0f]/95 backdrop-blur px-4 h-14 border-b border-zinc-800">
        <button
          onClick={() => {
            setSearch("");
            setCategory("All");
            fetchVideos("");
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
            placeholder="Search real YouTube videos..."
            className="w-full bg-[#121212] border border-zinc-700 rounded-l-full px-4 py-1.5 text-sm focus:outline-none focus:border-blue-500"
          />
          <button
            type="submit"
            className="bg-zinc-800 border border-l-0 border-zinc-700 rounded-r-full px-5 hover:bg-zinc-700"
          >
            <Search className="w-4 h-4 text-zinc-300" />
          </button>
        </form>

        <div className="hidden sm:block text-xs text-zinc-400">
          {hasApiKey ? "Live API Connected" : "Demo Mode"}
        </div>
      </header>

      <div className="flex flex-1">
        {/* Left Sidebar */}
        <aside className="hidden md:flex flex-col w-52 p-3 gap-1 border-r border-zinc-800/70">
          {[
            { label: "Home", icon: Home, q: "" },
            { label: "Trending", icon: Flame, q: "trending" },
            { label: "Music", icon: Music, q: "music" },
            { label: "Gaming", icon: Gamepad2, q: "gaming" },
            { label: "Coding", icon: Code2, q: "programming" },
          ].map((item) => (
            <button
              key={item.label}
              onClick={() => fetchVideos(item.q)}
              className="flex items-center gap-4 px-3 py-2.5 rounded-xl text-sm hover:bg-zinc-800 transition text-left"
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          ))}
        </aside>

        {/* Main Content */}
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
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
                      {activeVideo.channelTitle?.[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{activeVideo.channelTitle}</p>
                      <p className="text-xs text-zinc-400">{activeVideo.viewCount}</p>
                    </div>
                    <button
                      onClick={() => setSubscribed(!subscribed)}
                      className={`ml-2 px-4 py-2 rounded-full text-sm font-semibold transition ${
                        subscribed
                          ? "bg-zinc-800 text-white"
                          : "bg-white text-black hover:bg-zinc-200"
                      }`}
                    >
                      {subscribed ? "Subscribed" : "Subscribe"}
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setLiked(!liked)}
                      className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                        liked ? "bg-blue-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"
                      }`}
                    >
                      <ThumbsUp className="w-4 h-4" />
                      <span>{liked ? "Liked" : activeVideo.likeCount || "Like"}</span>
                    </button>
                    <button
                      onClick={() => navigator.clipboard?.writeText(window.location.href)}
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

                {/* Comments */}
                <div className="mt-6">
                  <h3 className="font-bold mb-4">{comments.length} Comments</h3>
                  <div className="space-y-4">
                    {comments.map((c) => (
                      <div key={c.id} className="flex gap-3 text-sm">
                        <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-xs">
                          {c.author?.[1] || c.author?.[0] || "U"}
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
                    <div
                      key={v.id}
                      onClick={() => openVideo(v)}
                      className="flex gap-2.5 cursor-pointer group"
                    >
                      <img
                        src={v.thumbnail}
                        alt={v.title}
                        className="w-40 aspect-video object-cover rounded-lg bg-zinc-800 shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-sm font-medium line-clamp-2 group-hover:text-blue-400">
                          {v.title}
                        </p>
                        <p className="text-xs text-zinc-400 mt-1">{v.channelTitle}</p>
                        <p className="text-xs text-zinc-500">{v.viewCount}</p>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ) : (
            /* HOME FEED VIEW */
            <>
              {/* Category Pills */}
              <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => handleCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition ${
                      category === cat
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-zinc-200 hover:bg-zinc-700"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>

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
                      <div className="flex gap-3 mt-3">
                        <div className="w-9 h-9 rounded-full bg-zinc-800 flex items-center justify-center font-bold text-sm shrink-0">
                          {video.channelTitle?.[0]}
                        </div>
                        <div className="min-w-0">
                          <h2 className="font-semibold text-sm line-clamp-2 leading-snug">
                            {video.title}
                          </h2>
                          <p className="text-xs text-zinc-400 mt-1">{video.channelTitle}</p>
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
