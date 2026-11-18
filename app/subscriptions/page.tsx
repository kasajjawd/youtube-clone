"use client";

import { useEffect, useState } from "react";
import VideoCard, { VideoItem } from "@/components/VideoCard";

export default function SubscriptionsPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const subs: string[] = JSON.parse(localStorage.getItem("yewtube_subs") || "[]");
    if (subs.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(
      subs.slice(0, 4).map((ch) =>
        fetch(`/api/youtube?q=${encodeURIComponent(ch)}`).then((r) => r.json())
      )
    )
      .then((res) => setVideos(res.flatMap((d) => (d.videos || []).slice(0, 5))))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Subscriptions</h1>
      {loading ? (
        <p className="text-sm text-zinc-400">Loading subscriptions...</p>
      ) : videos.length === 0 ? (
        <p className="text-sm text-zinc-400">Subscribe to creators to see their uploads here.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}
