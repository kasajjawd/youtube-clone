import { NextRequest, NextResponse } from "next/server";

// Public Piped API instances (no API key or Google account needed)
const PIPED_INSTANCES = [
  "https://pipedapi.kavin.rocks",
  "https://pipedapi.adminforge.de",
  "https://api.piped.yt",
];

async function fetchFromPiped(path: string) {
  for (const instance of PIPED_INSTANCES) {
    try {
      const res = await fetch(`${instance}${path}`, {
        headers: { Accept: "application/json" },
        next: { revalidate: 300 },
      });
      if (res.ok) return await res.json();
    } catch {
      // Try next instance if one is busy
    }
  }
  throw new Error("All instances busy");
}

function formatViews(views?: number) {
  if (!views || views < 0) return "YouTube Video";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const videoId = searchParams.get("videoId");

  try {
    // 1. Fetch single video details + real comments
    if (videoId) {
      const [streamData, commentsData] = await Promise.all([
        fetchFromPiped(`/streams/${videoId}`),
        fetchFromPiped(`/comments/${videoId}`).catch(() => ({ comments: [] })),
      ]);

      return NextResponse.json({
        video: {
          id: videoId,
          title: streamData.title,
          description: streamData.description || "No description available.",
          channelTitle: streamData.uploader,
          viewCount: formatViews(streamData.views),
          likeCount: streamData.likes ? streamData.likes.toLocaleString() : "Like",
        },
        comments: (commentsData.comments || []).slice(0, 15).map((c: any, idx: number) => ({
          id: c.commentId || String(idx),
          author: c.author || "@viewer",
          text: c.commentText || "",
          likes: c.likeCount || 0,
        })),
        hasApiKey: true,
      });
    }

    // 2. Fetch live search results or trending videos
    const data = query
      ? await fetchFromPiped(`/search?q=${encodeURIComponent(query)}&filter=videos`)
      : await fetchFromPiped(`/trending?region=US`);

    const rawItems = Array.isArray(data) ? data : data.items || [];

    const videos = rawItems
      .filter((item: any) => item.url && item.url.includes("v="))
      .map((item: any) => {
        const id = item.url.split("v=")[1]?.split("&")[0];
        return {
          id,
          title: item.title,
          description: item.shortDescription || "",
          thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          channelTitle: item.uploaderName || "YouTube Creator",
          publishedAt: item.uploadedDate || "",
          viewCount: formatViews(item.views),
        };
      });

    return NextResponse.json({ videos, hasApiKey: true });
  } catch {
    return NextResponse.json({
      videos: [],
      hasApiKey: false,
      error: "Could not reach video feed right now. Try refreshing.",
    });
  }
}
