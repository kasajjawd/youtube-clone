"use client";

import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";
import VideoCard, { VideoItem } from "@/components/VideoCard";

const CATEGORIES = ["For You", "Trending", "Music", "Gaming", "Programming", "4K HDR", "News"];

const INSTANT_FEED: VideoItem[] = [
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio 📚 beats to relax/study to",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    channelTitle: "Lofi Girl",
    channelId: "UCSJ4gkVC6NrvII8umztf0Ow",
    viewCount: "48.5M views",
  },
  {
    id: "LXb3EKWsInQ",
    title: "COSTA RICA IN 4K 60fps HDR (ULTRA HD)",
    thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    channelTitle: "Jacob + Katie Schwarz",
    channelId: "UCa1yUHQmV6Z0PpAUtfgNd9g",
    viewCount: "112M views",
  },
  {
    id: "aircAruvnKk",
    title: "But what is a neural network? | Deep learning chapter 1",
    thumbnail: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
    channelTitle: "3Blue1Brown",
    channelId: "UCYO_jab_esuFRV4b17AJtAw",
    viewCount: "18.4M views",
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    channelTitle: "Blender",
    channelId: "UCSMOQeBJ2RAnuFungnQOxLg",
    viewCount: "19.2M views",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Video)",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    channelTitle: "Rick Astley",
    channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
    viewCount: "1.6B views",
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE(강남스타일) M/V",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    channelTitle: "officialpsy",
    channelId: "UCrDkAvwZum-UTjHmzDI2iIw",
    viewCount: "5.4B views",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    channelTitle: "Luis Fonsi",
    channelId: "UCLp8RBhQHu9wSsq62j_Md6A",
    viewCount: "8.6B views",
  },
  {
    id: "M7lc1UVf-VE",
    title: "YouTube Developers Live: Embedded Web Player Customization",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    channelTitle: "Google for Developers",
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    viewCount: "2.1M views",
  },
];

export default function HomePage() {
  const [videos, setVideos] = useState<VideoItem[]>(INSTANT_FEED);
  const [category, setCategory] = useState("For You");
  const [loading, setLoading] = useState(false);

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
      const res = await fetch(`/api/youtube?q=${encodeURIComponent(q)}`, {
        cache: "no-store",
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.videos) && data.videos.length > 0) {
          setVideos(data.videos);
        }
      }
    } catch {
      // Keep existing videos on network failure
    }
    setLoading(false);
  };

  useEffect(() => {
    loadFeed("For You");
  }, []);

  return (
    <div className="w-full">
      <div className="flex gap-2 overflow-x-auto pb-4 mb-4">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => loadFeed(cat)}
            className={`px-3.5 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition flex items-center gap-1.5 ${
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

      {loading && videos.length === 0 ? (
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
    </div>
  );
}
