import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
  "https://invidious.privacyredirect.com",
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
  {
    id: "dQw4w9WgXcQ",
    title: "Rick Astley - Never Gonna Give You Up (Official Video)",
    description: "The official video for Never Gonna Give You Up by Rick Astley.",
    thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    channelTitle: "Rick Astley",
    channelId: "UCuAXFkgsw1L7xaCfnd5JJOw",
    viewCount: "1.6B views",
  },
  {
    id: "M7lc1UVf-VE",
    title: "YouTube Developers Live: Embedded Web Player Customization",
    description: "Learn how to customize the embedded player.",
    thumbnail: "https://i.ytimg.com/vi/M7lc1UVf-VE/hqdefault.jpg",
    channelTitle: "Google for Developers",
    channelId: "UC_x5XG1OV2P6uZZ5FSM9Ttw",
    viewCount: "2.1M views",
  },
  {
    id: "aqz-KE-bpKQ",
    title: "Big Buck Bunny 60fps 4K - Official Blender Foundation Short Film",
    description: "Big Buck Bunny in 4K 60fps.",
    thumbnail: "https://i.ytimg.com/vi/aqz-KE-bpKQ/hqdefault.jpg",
    channelTitle: "Blender",
    channelId: "UCSMOQeBJ2RAnuFungnQOxLg",
    viewCount: "19.2M views",
  },
  {
    id: "9bZkp7q19f0",
    title: "PSY - GANGNAM STYLE(강남스타일) M/V",
    description: "PSY - GANGNAM STYLE Official Music Video.",
    thumbnail: "https://i.ytimg.com/vi/9bZkp7q19f0/hqdefault.jpg",
    channelTitle: "officialpsy",
    channelId: "UCrDkAvwZum-UTjHmzDI2iIw",
    viewCount: "5.4B views",
  },
  {
    id: "kJQP7kiw5Fk",
    title: "Luis Fonsi - Despacito ft. Daddy Yankee",
    description: "Despacito Official Music Video.",
    thumbnail: "https://i.ytimg.com/vi/kJQP7kiw5Fk/hqdefault.jpg",
    channelTitle: "Luis Fonsi",
    channelId: "UCLp8RBhQHu9wSsq62j_Md6A",
    viewCount: "8.6B views",
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
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 3500);
      const res = await fetch(`${base}${path}`, {
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      if (res.ok) return await res.json();
    } catch {
      // Try next instance
    }
  }
  return null;
}

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
          "Video",
        description:
          v.detailedMetadataSnippets?.[0]?.snippetText?.runs
            ?.map((r: any) => r.text)
            .join("") || "",
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        channelTitle: ownerRuns?.text || fallbackChannelTitle || "Creator",
        channelId:
          ownerRuns?.navigationEndpoint?.browseEndpoint?.browseId ||
          fallbackChannelId ||
          "",
        viewCount:
          v.shortViewCountText?.simpleText ||
          v.viewCountText?.simpleText ||
          "Video",
        isShort: false,
      });
    }

    const reel = node.reelItemRenderer;
    if (reel && reel.videoId && !seen.has(reel.videoId)) {
      seen.add(reel.videoId);
      found.push({
        id: reel.videoId,
        title: reel.headline?.simpleText || "Short",
        thumbnail: `https://i.ytimg.com/vi/${reel.videoId}/hqdefault.jpg`,
        channelTitle: fallbackChannelTitle || "Creator",
        channelId: fallbackChannelId || "",
        viewCount: reel.viewCountText?.simpleText || "Short",
        isShort: true,
      });
    }

    const shortModel = node.shortsLockupViewModel;
    const shortId =
      shortModel?.onTap?.innertubeCommand?.reelWatchEndpoint?.videoId ||
      shortModel?.entityId?.replace("shorts-shelf-item-", "");
    if (shortModel && shortId && !seen.has(shortId)) {
      seen.add(shortId);
      found.push({
        id: shortId,
        title:
          shortModel.overlayMetadata?.primaryText?.content ||
          shortModel.accessibilityText ||
          "Short",
        thumbnail: `https://i.ytimg.com/vi/${shortId}/hqdefault.jpg`,
        channelTitle: fallbackChannelTitle || "Creator",
        channelId: fallbackChannelId || "",
        viewCount: shortModel.overlayMetadata?.secondaryText?.content || "Short",
        isShort: true,
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

async function searchYouTubeDirect(query: string) {
  try {
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

    return { videos: videos.slice(0, 30), channels: channels.slice(0, 3) };
  } catch {
    return { videos: [], channels: [] };
  }
}

async function searchInvidiousFallback(query: string) {
  const results = await fetchFromInvidious(
    `/api/v1/search?q=${encodeURIComponent(query)}`
  );
  if (!Array.isArray(results)) return { videos: [], channels: [] };

  const videos = results
    .filter((item: any) => item.type === "video" && item.videoId)
    .map((v: any) => ({
      id: v.videoId,
      title: v.title || "Video",
      description: v.description || "",
      thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
      channelTitle: v.author || "Creator",
      channelId: v.authorId || "",
      viewCount: formatViews(v.viewCount),
    }));

  const channels = results
    .filter((item: any) => item.type === "channel" && item.authorId)
    .map((c: any) => ({
      id: c.authorId,
      title: c.author || "Channel",
      handle: c.subCount ? `${c.subCount.toLocaleString()} subscribers` : "",
      subscribers: "",
      description: c.description || "",
      avatar: c.authorThumbnails?.slice(-1)[0]?.url || "",
    }));

  return { videos: videos.slice(0, 24), channels: channels.slice(0, 3) };
}

async function fetchChannelRssVideos(channelId: string, channelTitle: string) {
  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { cache: "no-store" }
    );
    if (!res.ok) return [];
    const xml = await res.text();
    const entries = xml.split("<entry>").slice(1);
    return entries
      .map((entry) => {
        const id = entry.match(/<yt:videoId>(.*?)<\/yt:videoId>/)?.[1] || "";
        const title =
          entry
            .match(/<title>(.*?)<\/title>/)?.[1]
            ?.replace(/&amp;/g, "&")
            ?.replace(/&quot;/g, '"')
            ?.replace(/&#39;/g, "'") || "Video";
        const views = entry.match(/views="(\d+)"/)?.[1];
        return {
          id,
          title,
          thumbnail: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
          channelTitle,
          channelId,
          viewCount: views ? formatViews(Number(views)) : "Upload",
        };
      })
      .filter((v) => v.id);
  } catch {
    return [];
  }
}

async function fetchChannelData(channelId: string, tab = "videos") {
  const headers = {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Accept-Language": "en-US,en;q=0.9",
    Cookie: "CONSENT=YES+cb",
  };

  const pathSuffix =
    tab === "shorts" ? "/shorts" : tab === "live" ? "/streams" : "/videos";

  let title = "Channel";
  let description = "";
  let avatar = "";
  let banner = "";
  let videos: any[] = [];

  try {
    const res = await fetch(
      `https://www.youtube.com/channel/${encodeURIComponent(channelId)}${pathSuffix}`,
      { headers, cache: "no-store" }
    );
    const html = await res.text();
    const match = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);

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
  } catch {
    // Continue to RSS / Invidious fallback
  }

  if (tab === "videos" && channelId.startsWith("UC")) {
    const rssVideos = await fetchChannelRssVideos(channelId, title);
    const seen = new Set(videos.map((v) => v.id));
    for (const rv of rssVideos) {
      if (!seen.has(rv.id)) {
        videos.push(rv);
        seen.add(rv.id);
      }
    }
  }

  if (videos.length === 0) {
    const invChannel = await fetchFromInvidious(`/api/v1/channels/${channelId}`);
    if (invChannel?.latestVideos) {
      title = invChannel.author || title;
      description = invChannel.description || description;
      avatar = invChannel.authorThumbnails?.slice(-1)[0]?.url || avatar;
      videos = invChannel.latestVideos.map((v: any) => ({
        id: v.videoId,
        title: v.title,
        thumbnail: `https://i.ytimg.com/vi/${v.videoId}/hqdefault.jpg`,
        channelTitle: title,
        channelId,
        viewCount: formatViews(v.viewCount),
      }));
    }
  }

  return {
    channel: {
      id: channelId,
      title,
      description,
      avatar: avatar.startsWith("//") ? `https:${avatar}` : avatar,
      banner: banner.startsWith("//") ? `https:${banner}` : banner,
    },
    videos: videos.slice(0, 60),
  };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q") || "";
  const videoId = searchParams.get("videoId");
  const channelId = searchParams.get("channelId");
  const channelName = searchParams.get("channelName");
  const channelTab = searchParams.get("tab") || "videos";

  // 1. Channel Page Request
  if (channelId || channelName) {
    let targetId = channelId || "";
    let fallbackInfo: any = null;

    if (!targetId && channelName) {
      let searchRes = await searchYouTubeDirect(channelName);
      if (searchRes.videos.length === 0 && searchRes.channels.length === 0) {
        searchRes = await searchInvidiousFallback(channelName);
      }
      fallbackInfo = searchRes.channels[0] || null;
      targetId =
        searchRes.channels[0]?.id ||
        searchRes.videos.find((v) => v.channelId)?.channelId ||
        "";
    }

    if (targetId) {
      const channelData = await fetchChannelData(targetId, channelTab);
      if (channelData) {
        if (fallbackInfo) {
          channelData.channel.avatar =
            channelData.channel.avatar || fallbackInfo.avatar;
          channelData.channel.description =
            channelData.channel.description || fallbackInfo.description;
        }
        return NextResponse.json(channelData);
      }
    }

    return NextResponse.json({
      channel: {
        id: targetId || "channel",
        title: channelName || "Channel",
        description: fallbackInfo?.description || "Videos from this creator.",
        avatar: fallbackInfo?.avatar || "",
        banner: "",
      },
      videos: BACKUP_VIDEOS,
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

  // 3. Search or Home Feed (Direct YouTube -> Invidious -> Guaranteed Backup)
  const searchTerm = query.trim() || "popular music gaming tech 2026";
  const directResults = await searchYouTubeDirect(searchTerm);
  if (directResults.videos.length > 0 || directResults.channels.length > 0) {
    return NextResponse.json({
      videos: directResults.videos,
      channels: query.trim() ? directResults.channels : [],
    });
  }

  const invidiousResults = await searchInvidiousFallback(searchTerm);
  if (invidiousResults.videos.length > 0) {
    return NextResponse.json({
      videos: invidiousResults.videos,
      channels: query.trim() ? invidiousResults.channels : [],
    });
  }

  return NextResponse.json({ videos: BACKUP_VIDEOS, channels: [] });
}
