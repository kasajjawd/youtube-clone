import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const INVIDIOUS_INSTANCES = [
  "https://inv.nadeko.net",
  "https://invidious.nerdvpn.de",
  "https://yewtu.be",
  "https://invidious.privacyredirect.com",
];

const BROWSER_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Cookie: "CONSENT=YES+cb",
};

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

function extractVideosFromJson(
  root: any,
  fallbackChannelTitle = "",
  fallbackChannelId = ""
) {
  const found: any[] = [];
  const seen = new Set<string>();
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;

    const v =
      node.videoRenderer ||
      node.gridVideoRenderer ||
      node.playlistVideoRenderer;
    if (v && v.videoId && !seen.has(v.videoId)) {
      seen.add(v.videoId);
      const ownerRuns =
        v.ownerText?.runs?.[0] ||
        v.shortBylineText?.runs?.[0] ||
        v.longBylineText?.runs?.[0];
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
      { headers: BROWSER_HEADERS, cache: "no-store" }
    );
    const html = await res.text();
    const match = html.match(/var ytInitialData\s*=\s*({.*?});\s*<\/script>/s);
    if (!match) return { videos: [], channels: [] };

    const data = JSON.parse(match[1]);
    const videos = extractVideosFromJson(data);

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

    return { videos: videos.slice(0, 35), channels: channels.slice(0, 3) };
  } catch {
    return { videos: [], channels: [] };
  }
}

async function searchInvidiousFallback(query: string, page = 1) {
  const results = await fetchFromInvidious(
    `/api/v1/search?q=${encodeURIComponent(query)}&page=${page}`
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

  return { videos, channels: channels.slice(0, 3) };
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

// Pull deep catalog of creator videos using parallel multi-angle queries + RSS + channel scrape
async function fetchChannelData(
  channelId: string,
  tab = "videos",
  knownName = ""
) {
  const pathSuffix =
    tab === "shorts" ? "/shorts" : tab === "live" ? "/streams" : "/videos";

  let title = knownName || "Channel";
  let description = "";
  let avatar = "";
  let banner = "";
  const allVideos: any[] = [];
  const seen = new Set<string>();

  const belongsToCreator = (v: any) => {
    if (channelId && v.channelId && v.channelId === channelId) return true;
    if (
      title &&
      title !== "Channel" &&
      v.channelTitle?.toLowerCase().trim() === title.toLowerCase().trim()
    ) {
      return true;
    }
    return false;
  };

  const addUnique = (items: any[], strictFilter = false) => {
    for (const item of items) {
      if (!item.id || seen.has(item.id)) continue;
      if (strictFilter && !belongsToCreator(item)) continue;
      seen.add(item.id);
      allVideos.push({
        ...item,
        channelTitle: title !== "Channel" ? title : item.channelTitle,
        channelId: channelId || item.channelId,
      });
    }
  };

  // 1. Scrape the channel tab HTML for header metadata & initial grid
  try {
    const res = await fetch(
      `https://www.youtube.com/channel/${encodeURIComponent(channelId)}${pathSuffix}`,
      { headers: BROWSER_HEADERS, cache: "no-store" }
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

      addUnique(extractVideosFromJson(data, title, channelId), false);
    }
  } catch {
    // Continue to RSS + parallel search harvest
  }

  // 2. Merge RSS feed (15 newest uploads)
  if (tab === "videos" && channelId.startsWith("UC")) {
    const rssVideos = await fetchChannelRssVideos(channelId, title);
    addUnique(rssVideos, false);
  }

  // 3. Run parallel multi-angle queries for this exact creator to bypass single-page limits
  if (title && title !== "Channel") {
    const querySuffixes =
      tab === "shorts"
        ? ["#shorts", "shorts", "funny", "clip"]
        : tab === "live"
        ? ["stream", "live", "vod", "full stream"]
        : ["", "2026", "2025", "2024", "best", "full", "episode", "part"];

    const searchPromises = querySuffixes.map((suffix) =>
      searchYouTubeDirect(`${title} ${suffix}`.trim())
    );
    const invidiousPromises = [1, 2, 3].map((page) =>
      searchInvidiousFallback(title, page)
    );

    const [ytBatch, invBatch] = await Promise.all([
      Promise.all(searchPromises),
      Promise.all(invidiousPromises),
    ]);

    for (const res of ytBatch) {
      addUnique(res.videos, true);
    }
    for (const res of invBatch) {
      addUnique(res.videos, true);
    }
  }

  // 4. Sort by view count on the "popular" tab
  if (tab === "popular" && allVideos.length > 0) {
    const parseViewNum = (str: string) => {
      const m = (str || "").replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i);
      if (!m) return 0;
      const num = parseFloat(m[1]);
      const mult =
        m[2]?.toUpperCase() === "B"
          ? 1e9
          : m[2]?.toUpperCase() === "M"
          ? 1e6
          : m[2]?.toUpperCase() === "K"
          ? 1e3
          : 1;
      return num * mult;
    };
    allVideos.sort((a, b) => parseViewNum(b.viewCount) - parseViewNum(a.viewCount));
  }

  return {
    channel: {
      id: channelId,
      title,
      description,
      avatar: avatar.startsWith("//") ? `https:${avatar}` : avatar,
      banner: banner.startsWith("//") ? `https:${banner}` : banner,
    },
    videos: allVideos.slice(0, 150),
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
      const channelData = await fetchChannelData(
        targetId,
        channelTab,
        channelName || ""
      );
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

  // 3. Search or Home Feed
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
