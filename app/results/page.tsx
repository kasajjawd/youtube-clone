"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import VideoCard, { VideoItem } from "@/components/VideoCard";

function ResultsContent() {
  const searchParams = useSearchParams();
  const query = searchParams.get("search_query") || "";
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [channels, setChannels] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!query.trim()) return;
    setLoading(true);
    fetch(`/api/youtube?q=${encodeURIComponent(query)}`)
      .then((r) => r.json())
      .then((data) => {
        setVideos(data.videos || []);
        setChannels(data.channels || []);
      })
      .finally(() => setLoading(false));
  }, [query]);

  return (
    <div className="max-w-6xl mx-auto">
      <p className="text-xs text-zinc-400 mb-4">
        Search results for <span className="text-white font-semibold">&ldquo;{query}&rdquo;</span>
      </p>

      {channels.length > 0 && (
        <div className="mb-6 space-y-3">
          {channels.map((ch) => (
            <Link
              key={ch.id}
              href={`/channel/${encodeURIComponent(ch.id)}?name=${encodeURIComponent(ch.title)}`}
              className="bg-zinc-900/90 hover:bg-zinc-800/90 border border-zinc-800 rounded-2xl p-4 flex items-center justify-between gap-4 transition"
            >
              <div className="flex items-center gap-4 min-w-0">
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
                  <h2 className="font-bold text-base text-emerald-400">{ch.title}</h2>
                  <p className="text-xs text-zinc-400">
                    {ch.handle} {ch.subscribers && `• ${ch.subscribers}`}
                  </p>
                  <p className="text-xs text-zinc-400 line-clamp-1 mt-1">{ch.description}</p>
                </div>
              </div>
              <span className="bg-zinc-800 px-4 py-2 rounded-full text-xs font-semibold shrink-0">
                View Channel
              </span>
            </Link>
          ))}
        </div>
      )}

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
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-400">Searching...</div>}>
      <ResultsContent />
    </Suspense>
  );
}
