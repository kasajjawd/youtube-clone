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

// Recursively find all video objects anywhere inside YouTube's ytInitialData JSON
function extractAllVideos(root: any, fallbackChannelTitle = "", fallbackChannelId = "") {
  const found: any[] = [];
  const seen = new Set<string>();
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;

    const v = node.videoRenderer || node.gridVideoRenderer;
    if (v && v.videoId && !seen.has(v.videoId)) {
      seen.add(v.videoId);
      const ownerRuns = v.ownerText?.runs?.[0] || v.shortBylineText?.runs?.[0];
      found.push({
        id: v.videoId,
        title:
          v.title?.runs?.map((r: any) => r.text).join("") ||
          v.title?.simpleText ||
          "YouTube Video",
        description:
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs
            ?.map((r: any) => r.text)
            .join("") || "",
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        channelTitle: ownerRuns?.text || fallbackChannelTitle || "YouTube Creator",
        channelId:
          ownerRuns?.navigationEndpoint?.browseEndpoint?.browseId ||
          fallbackChannelId ||
          "",
        viewCount:
          v.shortViewCountText?.simpleText ||
          v.viewCountText?.simpleText ||
          "YouTube Video",
      });
    }

    if (Array.isArray(node)) {
      for (let i = node.length - 1; i >= 0; i--) stack.push(node[i]);
    } else {
      for (const key of Object.keys(node)) {
        stack.push(node[key]);
      }
    }
  }
  return found;
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
        Cookie: "CONSENT=YES+cb",
      },
      cache: "no-store",
    }
  );
  const html = await res.text();
  const match = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
  if (!match) return { videos: [], channels: [] };

  const data = JSON.parse(match[1]);
  const videos = extractAllVideos(data);

  const channels: any[] = [];
  const contents =
    data?.contents?.twoColumnSearchResultsRenderer?.primaryContents
      ?.sectionListRenderer?.contents || [];

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
    }
  }

  return { videos: videos.slice(0, 24), channels: channels.slice(0, 3) };
}

// Backup: Fetch latest uploads from YouTube's official public RSS feed for a channel
async function fetchChannelRssVideos(channelId: string, channelTitle: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);
    return entries.map((entry) => {
      const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || "";
      const title =
        entry
          .match(/<title>(.*?)<\/title>/)?.[1]
          ?.replace(/&amp;/g, "&")
          ?.replace(/&quot;/g, '"')
          ?.replace(/&#39;/g, "'") || "YouTube Video";
      const views = entry.match(/views="(\d+)"/)?.[1];
      return {
        id,
        title,
        thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        channelTitle,
        channelId,
        viewCount: views ? formatViews(Number(views)) : "New Upload",
      };
    }).filter((v) => v.id);
  } catch {
    return [];
  }
}

// Fetch a real YouTube channel's profile + uploaded videos
async function fetchChannelData(channelId: string) {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: "CONSENT=YES+cb",
  };

  const res = await fetch(
    `https://www.youtube.com/channel/${encodeURIComponent(channelId)}/videos`,
    { headers, cache: "no-store" }
  );
  const html = await res.text();
  const match = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);

  let title = "YouTube Channel";
  let description = "";
  let avatar = "";
  let banner = "";
  let videos: any[] = [];

  if (match) {
    const data = JSON.parse(match[1]);
    const meta = data?.metadata?.channelMetadataRenderer || {};
    const header =
      data?.header?.pageHeaderRenderer?.content?.pageHeaderViewModel ||
      data?.header?.c4TabbedHeaderRenderer ||
      {};

    title = meta.title || title;
    description = meta.description || "";
    avatar =
      meta.avatar?.thumbnails?.slice(-1)[0]?.url ||
      header?.avatar?.thumbnails?.slice(-1)[0]?.url ||
      "";
    banner =
      header?.banner?.imageBannerViewModel?.image?.sources?.slice(-1)[0]?.url ||
      header?.banner?.thumbnails?.slice(-1)[0]?.url ||
      "";

    videos = extractAllVideos(data, title, channelId);
  }

  // If the /videos tab returned empty, pull from YouTube's official RSS feed for that channel
  if (videos.length === 0 && channelId.startsWith("UC")) {
    videos = await fetchChannelRssVideos(channelId, title);
  }

  return {
    channel: {
      id: channelId,
      title,
      description,
      avatar: avatar.startsWith("//") ? `https:${avatar}` : avatar,
      banner: banner.startsWith("//") ? `https:${banner}` : banner,
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

  // 1. Channel Page Request
  if (channelId || channelName) {
    let targetId = channelId || "";
    let fallbackInfo: any = null;

    if (!targetId && channelName) {
      const searchRes = await searchYouTubeDirect(channelName);
      fallbackInfo = searchRes.channels[0] || null;
      targetId =
        searchRes.channels[0]?.id ||
        searchRes.videos.find((v) => v.channelId)?.channelId ||
        "";
    }

    if (targetId) {
      const channelData = await fetchChannelData(targetId);
      if (channelData) {
        if (fallbackInfo) {
          channelData.channel.avatar = channelData.channel.avatar || fallbackInfo.avatar;
          channelData.channel.description =
            channelData.channel.description || fallbackInfo.description;
        }
        return NextResponse.json(channelData);
      }
    }

    const fallbackSearch = await searchYouTubeDirect(channelName || "youtube");
    return NextResponse.json({
      channel: {
        id: targetId || "channel",
        title: channelName || "YouTube Channel",
        description: fallbackInfo?.description || "Latest videos from this creator.",
        avatar: fallbackInfo?.avatar || "",
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
