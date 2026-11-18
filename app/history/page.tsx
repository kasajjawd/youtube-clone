"use client";

import { useEffect, useState } from "react";
import VideoCard, { VideoItem } from "@/components/VideoCard";

export default function HistoryPage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  useEffect(() => {
    setVideos(JSON.parse(localStorage.getItem("yewtube_history") || "[]"));
  }, []);

  return (
    <div className="max-w-6xl mx-auto">
      <h1 className="text-xl font-bold mb-6">Watch History</h1>
      {videos.length === 0 ? (
        <p className="text-sm text-zinc-400">No watch history yet.</p>
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
