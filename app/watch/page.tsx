"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { ThumbsUp, Share2 } from "lucide-react";
import { VideoItem } from "@/components/VideoCard";

function WatchContent() {
  const searchParams = useSearchParams();
  const videoId = searchParams.get("v") || "";
  const initialTitle = searchParams.get("title") || "YouTube Video";
  const initialChannel = searchParams.get("channel") || "Creator";
  const initialChannelId = searchParams.get("channelId") || "";

  const [video, setVideo] = useState<VideoItem>({
    id: videoId,
    title: initialTitle,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    channelTitle: initialChannel,
    channelId: initialChannelId,
  });
  const [related, setRelated] = useState<VideoItem[]>([]);
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLiked, setIsLiked] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);

  useEffect(() => {
    if (!videoId) return;

    const currentItem: VideoItem = {
      id: videoId,
      title: initialTitle,
      thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
      channelTitle: initialChannel,
      channelId: initialChannelId,
    };
    setVideo(currentItem);

    // Save to history
    try {
      const hist: VideoItem[] = JSON.parse(localStorage.getItem("yewtube_history") || "[]");
      const updated = [currentItem, ...hist.filter((v) => v.id !== videoId)].slice(0, 50);
      localStorage.setItem("yewtube_history", JSON.stringify(updated));

      const liked: VideoItem[] = JSON.parse(localStorage.getItem("yewtube_liked") || "[]");
      setIsLiked(liked.some((v) => v.id === videoId));

      const subs: string[] = JSON.parse(localStorage.getItem("yewtube_subs") || "[]");
      setIsSubscribed(subs.includes(initialChannel));

      window.dispatchEvent(new Event("yewtube-storage-update"));
    } catch {}

    fetch(`/api/youtube?videoId=${encodeURIComponent(videoId)}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.video) {
          setVideo((prev) => ({ ...prev, ...data.video }));
        }
        setComments(data.comments || []);
      });

    fetch(`/api/youtube?q=${encodeURIComponent(initialChannel || initialTitle)}`)
      .then((r) => r.json())
      .then((data) => setRelated((data.videos || []).filter((v: VideoItem) => v.id !== videoId)));
  }, [videoId, initialTitle, initialChannel, initialChannelId]);

  const toggleLike = () => {
    const liked: VideoItem[] = JSON.parse(localStorage.getItem("yewtube_liked") || "[]");
    const updated = isLiked
      ? liked.filter((v) => v.id !== video.id)
      : [video, ...liked];
    localStorage.setItem("yewtube_liked", JSON.stringify(updated));
    setIsLiked(!isLiked);
    window.dispatchEvent(new Event("yewtube-storage-update"));
  };

  const toggleSubscribe = () => {
    const subs: string[] = JSON.parse(localStorage.getItem("yewtube_subs") || "[]");
    const updated = isSubscribed
      ? subs.filter((c) => c !== video.channelTitle)
      : [video.channelTitle, ...subs];
    localStorage.setItem("yewtube_subs", JSON.stringify(updated));
    setIsSubscribed(!isSubscribed);
    window.dispatchEvent(new Event("yewtube-storage-update"));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    const session = localStorage.getItem("yewtube_session_user");
    const user = session ? JSON.parse(session) : null;
    setComments((prev) => [
      {
        id: `local-${Date.now()}`,
        author: user?.handle || "@viewer",
        text: newComment.trim(),
      },
      ...prev,
    ]);
    setNewComment("");
  };

  const channelHref = `/channel/${encodeURIComponent(
    video.channelId || video.channelTitle
  )}?name=${encodeURIComponent(video.channelTitle)}`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
      <div className="lg:col-span-2">
        <div className="aspect-video w-full rounded-xl overflow-hidden bg-black">
          <iframe
            className="w-full h-full"
            src={`https://www.youtube.com/embed/${video.id}?autoplay=1`}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <h1 className="text-lg md:text-xl font-bold mt-3">{video.title}</h1>

        <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pb-3 border-b border-zinc-800">
          <div className="flex items-center gap-3">
            <Link href={channelHref} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold group-hover:bg-zinc-600">
                {video.channelTitle?.[0]}
              </div>
              <div>
                <p className="font-semibold text-sm group-hover:text-emerald-400">
                  {video.channelTitle}
                </p>
                <p className="text-xs text-zinc-400">{video.viewCount}</p>
              </div>
            </Link>

            <button
              onClick={toggleSubscribe}
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
              onClick={toggleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition ${
                isLiked ? "bg-emerald-600 text-white" : "bg-zinc-800 hover:bg-zinc-700"
              }`}
            >
              <ThumbsUp className="w-4 h-4" />
              <span>{isLiked ? "Liked" : "Like"}</span>
            </button>
            <button
              onClick={() => navigator.clipboard?.writeText(window.location.href)}
              className="flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 hover:bg-zinc-700"
            >
              <Share2 className="w-4 h-4" />
              <span>Copy Link</span>
            </button>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl p-3 mt-3 text-sm text-zinc-300 whitespace-pre-line">
          {video.description || "No description available."}
        </div>

        <div className="mt-6">
          <h3 className="font-bold mb-4">{comments.length} Comments</h3>
          <form onSubmit={handleAddComment} className="flex gap-2 mb-6">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent border-b border-zinc-700 focus:border-white pb-1 text-sm focus:outline-none"
            />
            <button
              type="submit"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-1.5 rounded-full text-xs font-semibold"
            >
              Comment
            </button>
          </form>

          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3 text-sm">
                <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center shrink-0 font-bold text-xs">
                  {c.author?.[1]?.toUpperCase() || "U"}
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

      {/* Up Next */}
      <div className="space-y-3">
        <h3 className="font-semibold text-sm text-zinc-400">Up Next</h3>
        {related.map((v) => (
          <Link
            key={v.id}
            href={`/watch?v=${encodeURIComponent(v.id)}&title=${encodeURIComponent(
              v.title
            )}&channel=${encodeURIComponent(v.channelTitle)}&channelId=${encodeURIComponent(
              v.channelId || ""
            )}`}
            className="flex gap-2.5 group"
          >
            <img
              src={v.thumbnail}
              alt={v.title}
              className="w-40 aspect-video object-cover rounded-lg bg-zinc-800 shrink-0"
            />
            <div className="min-w-0">
              <p className="text-sm font-medium line-clamp-2 group-hover:text-emerald-400">
                {v.title}
              </p>
              <p className="text-xs text-zinc-400 mt-1">{v.channelTitle}</p>
              <p className="text-xs text-zinc-500">{v.viewCount}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

export default function WatchPage() {
  return (
    <Suspense fallback={<div className="text-sm text-zinc-400">Loading player...</div>}>
      <WatchContent />
    </Suspense>
  );
}
