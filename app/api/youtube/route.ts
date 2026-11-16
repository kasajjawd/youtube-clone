import { NextRequest, NextResponse } from "next/server";

const API_KEY = process.env.YOUTUBE_API_KEY;
const BASE_URL = "https://www.googleapis.com/youtube/v3";

const FALLBACK_VIDEOS = [
  {
    id: "jfKfPfyJRdk",
    title: "lofi hip hop radio 📚 beats to relax/study to",
    description: "Thank you for listening, I hope you will have a good time here!",
    thumbnail: "https://i.ytimg.com/vi/jfKfPfyJRdk/hqdefault.jpg",
    channelTitle: "Lofi Girl",
    publishedAt: "2022-07-12",
    viewCount: "48.5M views",
  },
  {
    id: "LXb3EKWsInQ",
    title: "COSTA RICA IN 4K 60fps HDR (ULTRA HD)",
    description: "Experience the wildlife and nature of Costa Rica in 4K Ultra HD.",
    thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    channelTitle: "Jacob + Katie Schwarz",
    publishedAt: "2018-04-12",
    viewCount: "112M views",
  },
  {
    id: "aircAruvnKk",
    title: "But what is a neural network? | Deep learning chapter 1",
    description: "What are the neurons, why are there layers, and what is the math underlying it?",
    thumbnail: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
    channelTitle: "3Blue1Brown",
    publishedAt: "2017-10-05",
    viewCount: "18.4M views",
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film",
    description: "Big Buck Bunny is a short computer-animated comedy film by the Blender Institute.",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    channelTitle: "Blender",
    publishedAt: "2014-11-10",
    viewCount: "21.5M views",
  },
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Music Video)",
    description: "The official video for Never Gonna Give You Up by Rick Astley.",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    channelTitle: "Rick Astley",
    publishedAt: "2009-10-25",
    viewCount: "1.5B views",
  },
  {
    id: "M7lc1UVf-VE",
    title: "YouTube Developers Live: Embedded Web Player Customization",
    description: "Learn how to customize and control the YouTube embedded player.",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    channelTitle: "Google for Developers",
    publishedAt: "2013-04-23",
    viewCount: "3.4M views",
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const videoId = searchParams.get("videoId");

  if (!API_KEY) {
    if (videoId) {
      const video = FALLBACK_VIDEOS.find((v) => v.id === videoId) || FALLBACK_VIDEOS[0];
      return NextResponse.json({
        video,
        comments: [
          {
            id: "1",
            author: "@ChromebookBuilder",
            text: "Tip: Add your free YOUTUBE_API_KEY in Vercel Settings -> Environment Variables to unlock live YouTube search & real comments!",
            likes: 99,
          },
        ],
        hasApiKey: false,
      });
    }
    const filtered = query
      ? FALLBACK_VIDEOS.filter((v) =>
          v.title.toLowerCase().includes(query.toLowerCase())
        )
      : FALLBACK_VIDEOS;
    return NextResponse.json({
      videos: filtered.length ? filtered : FALLBACK_VIDEOS,
      hasApiKey: false,
    });
  }

  try {
    if (videoId) {
      const [vRes, cRes] = await Promise.all([
        fetch(`${BASE_URL}/videos?part=snippet,statistics&id=${videoId}&key=${API_KEY}`),
        fetch(`${BASE_URL}/commentThreads?part=snippet&videoId=${videoId}&maxResults=15&key=${API_KEY}`),
      ]);
      const vData = await vRes.json();
      const cData = await cRes.json();
      const item = vData.items?.[0];

      return NextResponse.json({
        video: {
          id: item.id,
          title: item.snippet.title,
          description: item.snippet.description,
          channelTitle: item.snippet.channelTitle,
          viewCount: `${Number(item.statistics?.viewCount || 0).toLocaleString()} views`,
          likeCount: Number(item.statistics?.likeCount || 0).toLocaleString(),
        },
        comments: (cData.items || []).map((c: any) => ({
          id: c.id,
          author: c.snippet.topLevelComment.snippet.authorDisplayName,
          text: c.snippet.topLevelComment.snippet.textOriginal,
          likes: c.snippet.topLevelComment.snippet.likeCount,
        })),
        hasApiKey: true,
      });
    }

    const url = query
      ? `${BASE_URL}/search?part=snippet&type=video&maxResults=24&q=${encodeURIComponent(query)}&key=${API_KEY}`
      : `${BASE_URL}/videos?part=snippet,statistics&chart=mostPopular&regionCode=US&maxResults=24&key=${API_KEY}`;

    const res = await fetch(url);
    const data = await res.json();

    const videos = (data.items || []).map((item: any) => ({
      id: typeof item.id === "string" ? item.id : item.id.videoId,
      title: item.snippet.title,
      description: item.snippet.description,
      thumbnail: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.medium?.url,
      channelTitle: item.snippet.channelTitle,
      publishedAt: new Date(item.snippet.publishedAt).toLocaleDateString(),
      viewCount: item.statistics?.viewCount
        ? `${Number(item.statistics.viewCount).toLocaleString()} views`
        : "YouTube Video",
    }));

    return NextResponse.json({ videos, hasApiKey: true });
  } catch {
    return NextResponse.json({ videos: FALLBACK_VIDEOS, hasApiKey: false });
  }
}
