import { NextRequest, NextResponse } from "next/server";

// Force Vercel never to cache empty responses
export const dynamic = "force-dynamic";

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
];

const BACKUP_VIDEOS = [
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio 📚 beats to relax/study to",
    description: "Thank you for listening, I hope you will have a good time here!",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    channelTitle: "Lofi Girl",
    viewCount: "48.5M views",
  },
  {
    id: "LXb3EKWsInQ",
    title: "COSTA RICA IN 4K 60fps HDR (ULTRA HD)",
    description: "Experience the wildlife and nature of Costa Rica in 4K Ultra HD.",
    thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    channelTitle: "Jacob + Katie Schwarz",
    viewCount: "112M views",
  },
  {
    id: "aircAruvnKk",
    title: "But what is a neural network? | Deep learning chapter 1",
    description: "What are the neurons, why are there layers, and what is the math underlying it?",
    thumbnail: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
    channelTitle: "3Blue1Brown",
    viewCount: "18.4M views",
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film",
    description: "Big Buck Bunny is a short computer-animated comedy film by the Blender Institute.",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    channelTitle: "Blender",
    viewCount: "21.5M views",
  },
];

function formatViews(views?: number) {
  if (!views || views < 0) return "YouTube Video";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

// Method 1: Fetch directly from YouTube's public search page JSON (no API key needed)
async function searchYouTubeDirect(query: string) {
  const res = await fetch(
    `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`,
    {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9",
      },
      cache: "no-store",
    }
  );
  const html = await res.text();
  const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
  if (!match) return [];

  const data = JSON.parse(match[1]);
  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents || [];

  const videos: any[] = [];
  for (const section of contents) {
    const items = section?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      const v = item?.videoRenderer;
      if (v && v.videoId) {
        videos.push({
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || "YouTube Video",
          description:
            v.detailedMetadataSnippets?.[0]?.snippetText?.runs
              ?.map((r: any) => r.text)
              .join("") || "",
          thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          channelTitle: v.ownerText?.runs?.[0]?.text || "YouTube Creator",
          viewCount: v.shortViewCountText?.simpleText || "YouTube Video",
        });
      }
    }
  }
  return videos.slice(0, 24);
}

// Method 2: Fetch from Invidious public API instances
async function fetchFromInvidious(path: string) {
  for (const base of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${base}${path}`, { cache: "no-store" });
      if (res.ok) return await res.json();
    } catch {
      // Try next instance
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const videoId = searchParams.get("videoId");

  // 1. Video Watch Details & Comments
  if (videoId) {
    const [videoData, commentsData] = await Promise.all([
      fetchFromInvidious(`/api/v1/videos/${videoId}`),
      fetchFromInvidious(`/api/v1/comments/${videoId}`),
    ]);

    return NextResponse.json({
      video: videoData
        ? {
            id: videoId,
            title: videoData.title,
            description: videoData.description || "No description available.",
            channelTitle: videoData.author,
            viewCount: formatViews(videoData.viewCount),
            likeCount: videoData.likeCount
              ? videoData.likeCount.toLocaleString()
              : "Like",
          }
        : null,
      comments: (commentsData?.comments || []).slice(0, 15).map((c: any, i: number) => ({
        id: c.commentId || String(i),
        author: c.author || "@viewer",
        text: c.content || "",
        likes: c.likeCount || 0,
      })),
      hasApiKey: true,
    });
  }

  // 2. Search or Home Feed
  const searchTerm = query.trim() || "popular music gaming tech 2026";

  // Try direct YouTube search first
  try {
    const directResults = await searchYouTubeDirect(searchTerm);
    if (directResults.length > 0) {
      return NextResponse.json({ videos: directResults, hasApiKey: true });
    }
  } catch {
    // Fall through to Invidious
  }

  // Try Invidious API second
  const invResults = await fetchFromInvidious(
    `/api/v1/search?q=${encodeURIComponent(searchTerm)}&type=video`
  );
  if (Array.isArray(invResults) && invResults.length > 0) {
    const videos = invResults.slice(0, 24).map((v: any) => ({
      id: v.videoId,
      title: v.title,
      description: v.description || "",
      thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      channelTitle: v.author || "YouTube Creator",
      viewCount: formatViews(v.viewCount),
    }));
    return NextResponse.json({ videos, hasApiKey: true });
  }

  // Final backup so the page is never blank
  return NextResponse.json({ videos: BACKUP_VIDEOS, hasApiKey: false });
}
