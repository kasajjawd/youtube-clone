import { NextRequest, NextResponse } from "next/server";

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
    channelId: "UCSJ4gkVC6NrvII8umztf0Ow",
    viewCount: "48.5M views",
  },
  {
    id: "LXb3EKWsInQ",
    title: "COSTA RICA IN 4K 60fps HDR (ULTRA HD)",
    description: "Experience the wildlife and nature of Costa Rica in 4K Ultra HD.",
    thumbnail: "https://i.ytimg.com/vi/LXb3EKWsInQ/hqdefault.jpg",
    channelTitle: "Jacob + Katie Schwarz",
    channelId: "UCa1yUHQmV6Z0PpAUtfgNd9g",
    viewCount: "112M views",
  },
  {
    id: "aircAruvnKk",
    title: "But what is a neural network? | Deep learning chapter 1",
    description: "What are the neurons, why are there layers, and what is the math underlying it?",
    thumbnail: "https://i.ytimg.com/vi/aircAruvnKk/hqdefault.jpg",
    channelTitle: "3Blue1Brown",
    channelId: "UCYO_jab_esuFRV4b17AJtAw",
    viewCount: "18.4M views",
  },
];

function formatViews(views?: number) {
  if (!views || views < 0) return "YouTube Video";
  if (views >= 1_000_000) return `${(views / 1_000_000).toFixed(1)}M views`;
  if (views >= 1_000) return `${(views / 1_000).toFixed(1)}K views`;
  return `${views} views`;
}

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

// Fetch YouTube search results + matching channel card directly
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
  if (!match) return { videos: [], channels: [] };

  const data = JSON.parse(match[1]);
  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents || [];

  const videos: any[] = [];
  const channels: any[] = [];

  for (const section of contents) {
    const items = section?.itemSectionRenderer?.contents || [];
    for (const item of items) {
      const c = item?.channelRenderer;
      if (c && c.channelId) {
        const thumb = c.thumbnail?.thumbnails?.slice(-1)[0]?.url || "";
        channels.push({
          id: c.channelId,
          title: c.title?.simpleText || "Channel",
          handle: c.subscriberCountText?.simpleText || "",
          subscribers: c.videoCountText?.simpleText || "",
          description:
            c.descriptionSnippet?.runs?.map((r: any) => r.text).join("") || "",
          avatar: thumb.startsWith("//") ? `https:${thumb}` : thumb,
        });
      }

      const v = item?.videoRenderer;
      if (v && v.videoId) {
        const ownerRuns = v.ownerText?.runs?.[0];
        videos.push({
          id: v.videoId,
          title: v.title?.runs?.[0]?.text || "YouTube Video",
          description:
            v.detailedMetadataSnippets?.[0]?.snippetText?.runs
              ?.map((r: any) => r.text)
              .join("") || "",
          thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
          channelTitle: ownerRuns?.text || "YouTube Creator",
          channelId:
            ownerRuns?.navigationEndpoint?.browseEndpoint?.browseId || "",
          viewCount: v.shortViewCountText?.simpleText || "YouTube Video",
        });
      }
    }
  }
  return { videos: videos.slice(0, 24), channels: channels.slice(0, 3) };
}

// Fetch a real YouTube channel's profile + uploaded videos
async function fetchChannelData(channelId: string) {
  const res = await fetch(
    `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`,
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
  if (!match) return null;

  const data = JSON.parse(match[1]);
  const meta = data?.metadata?.channelMetadataRenderer || {};
  const header =
    data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel ||
    data?.header?.c4TabbedHeaderRenderer ||
    {};

  const avatar =
    meta.avatar?.thumbnails?.slice(-1)[0]?.url ||
    header?.avatar?.thumbnails?.slice(-1)[0]?.url ||
    "";
  const banner =
    header?.banner?.imageBannerViewModel?.image?.sources?.slice(-1)[0]?.url ||
    header?.banner?.thumbnails?.slice(-1)[0]?.url ||
    "";

  const tabs = data?.contents?.twoColumnBrowseResultsRenderer?.tabs || [];
  const videosTab = tabs.find((t: any) => t.tabRenderer?.selected) || tabs[1] || tabs[0];
  const gridItems =
    videosTab?.tabRenderer?.content?.richGridRenderer?.contents || [];

  const videos: any[] = [];
  for (const entry of gridItems) {
    const v = entry?.richItemRenderer?.content?.videoRenderer;
    if (v && v.videoId) {
      videos.push({
        id: v.videoId,
        title: v.title?.runs?.[0]?.text || "Video",
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        channelTitle: meta.title || "Channel",
        channelId,
        viewCount: v.shortViewCountText?.simpleText || "",
      });
    }
  }

  return {
    channel: {
      id: channelId,
      title: meta.title || "YouTube Channel",
      description: meta.description || "",
      avatar: avatar.startsWith("//") ? `https:${avatar}` : avatar,
      banner: banner.startsWith("//") ? `https:${banner}` : banner,
      vanityUrl: meta.vanityChannelUrl || "",
    },
    videos: videos.slice(0, 30),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const videoId = searchParams.get("videoId");
  const channelId = searchParams.get("channelId");
  const channelName = searchParams.get("channelName");

  // 1. Channel Page Request (by ID or by Name)
  if (channelId || channelName) {
    let targetId = channelId || "";
    if (!targetId && channelName) {
      const searchRes = await searchYouTubeDirect(channelName);
      targetId =
        searchRes.channels[0]?.id ||
        searchRes.videos.find((v) => v.channelId)?.channelId ||
        "";
    }

    if (targetId) {
      const channelData = await fetchChannelData(targetId);
      if (channelData) {
        return NextResponse.json(channelData);
      }
    }

    // Fallback if channel ID couldn't be resolved
    const fallbackSearch = await searchYouTubeDirect(channelName || "youtube");
    return NextResponse.json({
      channel: {
        id: targetId || "channel",
        title: channelName || "YouTube Channel",
        description: "Latest videos from this creator.",
        avatar: "",
        banner: "",
      },
      videos: fallbackSearch.videos,
    });
  }

  // 2. Single Video Details & Comments
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
            channelId: videoData.authorId || "",
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
    });
  }

  // 3. Search or Home Feed
  const searchTerm = query.trim() || "popular music gaming tech 2026";
  try {
    const directResults = await searchYouTubeDirect(searchTerm);
    if (directResults.videos.length > 0 || directResults.channels.length > 0) {
      return NextResponse.json({
        videos: directResults.videos,
        channels: query.trim() ? directResults.channels : [],
      });
    }
  } catch {
    // Fall through
  }

  return NextResponse.json({ videos: BACKUP_VIDEOS, channels: [] });
}
