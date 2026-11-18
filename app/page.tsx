"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import VideoCard, { VideoItem } from "@/components/VideoCard";

const CATEGORIES = ["For You", "Trending", "Music", "Gaming", "Programming", "4K HDR", "News"];

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [category, setCategory] = useState("For You");
  const [loading, setLoading] = useState(true);

  const getPersonalizedQuery = () => {
    try {
      const scores: Record<string, number> = JSON.parse(
        localStorage.getItem("yewtube_interests") || "{}"
      );
      const top = Object.entries(scores)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([w]) => w);
      if (top.length > 0) return top.join(" ");
    } catch {}
    return "trending tech music gaming 2026";
  };

  const loadFeed = async (cat: string) => {
    setCategory(cat);
    setLoading(true);
    const q = cat === "For You" ? getPersonalizedQuery() : cat;
    try {
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      setVideos(data.videos || []);
    } catch {
      setVideos([]);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeed("For You");
  }, []);

  return (
    <>
      <div className="flex gap-2 overflow-x-auto pb-4 mb-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => loadFeed(cat)}
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
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </>
  );
}
