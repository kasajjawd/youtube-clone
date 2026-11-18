"use client";

import { useParams, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import VideoCard, { VideoItem } from "@/components/VideoCard";

const CHANNEL_TABS = [
  { id: "videos", label: "Videos" },
  { id: "popular", label: "Popular" },
  { id: "shorts", label: "Shorts" },
  { id: "live", label: "Live" },
];

function ChannelContent() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();

  const rawId = decodeURIComponent((params.id as string) || "");
  const nameParam = searchParams.get("name") || "";
  const activeTab = searchParams.get("tab") || "videos";

  const [channel, setChannel] = useState<any>({
    id: rawId,
    title: nameParam || rawId,
    description: "",
  });
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    setLoading(true);
    const isUcId = rawId.startsWith("UC");
    const queryStr = isUcId
      ? `channelId=${encodeURIComponent(rawId)}&channelName=${encodeURIComponent(nameParam)}`
      : `channelName=${encodeURIComponent(nameParam || rawId)}`;

    fetch(`/api/youtube?${queryStr}&tab=${encodeURIComponent(activeTab)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.channel) {
          setChannel(data.channel);
          const subs: string[] = JSON.parse(localStorage.getItem("yewtube_subs") || "[]");
          setIsSubscribed(subs.includes(data.channel.title));
        }
        setVideos(data.videos || []);
      })
      .finally(() => setLoading(false));
  }, [rawId, nameParam, activeTab]);

  const toggleSubscribe = () => {
    const subs: string[] = JSON.parse(localStorage.getItem("yewtube_subs") || "[]");
    const updated = isSubscribed
      ? subs.filter((c) => c !== channel.title)
      : [channel.title, ...subs];
    localStorage.setItem("yewtube_subs", JSON.stringify(updated));
    setIsSubscribed(!isSubscribed);
    window.dispatchEvent(new Event("yewtube-storage-update"));
  };

  const switchTab = (tabId: string) => {
    const url = `/channel/${encodeURIComponent(rawId)}?name=${encodeURIComponent(
      channel.title
    )}&tab=${tabId}`;
    router.push(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      {channel.banner && (
        <div className="w-full h-36 sm:h-48 rounded-2xl overflow-hidden bg-zinc-800 mb-5">
          <img src={channel.banner} alt={channel.title} className="w-full h-full object-cover" />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5">
        <div className="flex items-center gap-4">
          {channel.avatar ? (
            <img
              src={channel.avatar}
              alt={channel.title}
              className="w-20 h-20 rounded-full object-cover bg-zinc-800 shrink-0"
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-zinc-800 flex items-center justify-center text-3xl font-bold shrink-0">
              {channel.title?.[0]}
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold">{channel.title}</h1>
            {channel.description && (
              <p className="text-sm text-zinc-300 mt-1 line-clamp-2 max-w-2xl">
                {channel.description}
              </p>
            )}
          </div>
        </div>

        <button
          onClick={toggleSubscribe}
          className={`px-5 py-2.5 rounded-full text-sm font-semibold transition shrink-0 ${
            isSubscribed
              ? "bg-zinc-800 text-white hover:bg-zinc-700"
              : "bg-white text-black hover:bg-zinc-200"
          }`}
        >
          {isSubscribed ? "Subscribed" : "Subscribe"}
        </button>
      </div>

      <div className="flex items-center gap-6 border-b border-zinc-800 mb-6">
        {CHANNEL_TABS.map((ct) => (
          <button
            key={ct.id}
            onClick={() => switchTab(ct.id)}
            className={`pb-3 text-sm font-semibold border-b-2 transition ${
              activeTab === ct.id
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

export default function ChannelPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-400">Loading channel...</div>}>
      <ChannelContent />
    </Suspense>
  );
}
