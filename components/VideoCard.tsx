"use client";

import Link from "next/link";

export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  thumbnail: string;
  channelTitle: string;
  channelId?: string;
  viewCount?: string;
  isShort?: boolean;
}

export default function VideoCard({ video }: { video: VideoItem }) {
  const channelSlug = encodeURIComponent(video.channelId || video.channelTitle);
  const channelHref = `/channel/${channelSlug}?name=${encodeURIComponent(video.channelTitle)}`;
  const watchHref = `/watch?v=${encodeURIComponent(video.id)}&title=${encodeURIComponent(
    video.title
  )}&channel=${encodeURIComponent(video.channelTitle)}&channelId=${encodeURIComponent(
    video.channelId || ""
  )}`;

  return (
    <div className="group">
      <Link
        href={watchHref}
        className="block aspect-video rounded-xl overflow-hidden bg-zinc-800 relative"
      >
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
      </Link>

      <div className="flex gap-3 mt-3">
        <Link
          href={channelHref}
          className="w-9 h-9 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center font-bold text-sm shrink-0"
        >
          {video.channelTitle?.[0]}
        </Link>
        <div className="min-w-0">
          <Link
            href={watchHref}
            className="font-semibold text-sm line-clamp-2 leading-snug block hover:text-emerald-400"
          >
            {video.title}
          </Link>
          <Link
            href={channelHref}
            className="text-xs text-zinc-400 hover:text-white mt-1 block truncate"
          >
            {video.channelTitle}
          </Link>
          <p className="text-xs text-zinc-400">{video.viewCount}</p>
        </div>
      </div>
    </div>
  );
}
