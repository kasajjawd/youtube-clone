import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const YT_HEADERS = {
  "Content-Type": "application/json",
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://www.youtube.com",
  Referer: "https://www.youtube.com/",
};

const CLIENT_CONTEXT = {
  client: {
    clientName: "WEB",
    clientVersion: "2.20261101.01.00",
    hl: "en",
    gl: "US",
  },
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

function extractVideosAndChannels(
  root: any,
  fallbackChannelTitle = "",
  fallbackChannelId = ""
) {
  const videos: any[] = [];
  const channels: any[] = [];
  const seenVideos = new Set<string>();
  const seenChannels = new Set<string>();
  const stack = [root];

  while (stack.length > 0) {
    const node = stack.pop();
    if (!node || typeof node !== "object") continue;

    // Channels
    const c = node.channelRenderer;
    if (c && c.channelId && !seenChannels.has(c.channelId)) {
      seenChannels.add(c.channelId);
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

    // Standard, Grid, and Playlist Videos
    const v =
      node.videoRenderer ||
      node.gridVideoRenderer ||
      node.playlistVideoRenderer;
    if (v && v.videoId && !seenVideos.has(v.videoId)) {
      seenVideos.add(v.videoId);
      const ownerRuns =
        v.ownerText?.runs?.[0] ||
        v.shortBylineText?.runs?.[0] ||
        v.longBylineText?.runs?.[0];
      videos.push({
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
          "YouTube Video",
        isShort: false,
      });
    }

    // Shorts
    const reel = node.reelItemRenderer;
    if (reel && reel.videoId && !seenVideos.has(reel.videoId)) {
      seenVideos.add(reel.videoId);
      videos.push({
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
    if (shortModel && shortId && !seenVideos.has(shortId)) {
      seenVideos.add(shortId);
      videos.push({
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

  return { videos, channels };
}

// Direct JSON InnerTube Search (bypasses HTML consent wall)
async function searchInnerTube(query: string) {
  try {
    const res = await fetch(
      "https://www.youtube.com/youtubei/v1/search?prettyPrint=false",
      {
        method: "POST",
        headers: YT_HEADERS,
        body: JSON.stringify({
          context: CLIENT_CONTEXT,
          query,
        }),
        cache: "no-store",
      }
    );

    if (!res.ok) return { videos: [], channels: [] };
    const data = await res.json();
    const { videos, channels } = extractVideosAndChannels(data);
    return { videos: videos.slice(0, 35), channels: channels.slice(0, 3) };
  } catch {
    return { videos: [], channels: [] };
  }
}

// Direct JSON InnerTube Player / Next for Video Info & Comments
async function fetchVideoDetails(videoId: string) {
  try {
    const [playerRes, nextRes] = await Promise.all([
      fetch("https://www.youtube.com/youtubei/v1/player?prettyPrint=false", {
        method: "POST",
        headers: YT_HEADERS,
        body: JSON.stringify({ context: CLIENT_CONTEXT, videoId }),
        cache: "no-store",
      }),
      fetch("https://www.youtube.com/youtubei/v1/next?prettyPrint=false", {
        method: "POST",
        headers: YT_HEADERS,
        body: JSON.stringify({ context: CLIENT_CONTEXT, videoId }),
        cache: "no-store",
      }),
    ]);

    const playerJson = playerRes.ok ? await playerRes.json() : null;
    const nextJson = nextRes.ok ? await nextRes.json() : null;
    const details = playerJson?.videoDetails;

    const views = Number(details?.viewCount || 0);
    const viewText =
      views >= 1_000_000
        ? `${(views / 1_000_000).toFixed(1)}M views`
        : views >= 1_000
        ? `${(views / 1_000).toFixed(1)}K views`
        : views > 0
        ? `${views} views`
        : "YouTube Video";

    const comments: any[] = [];
    if (nextJson) {
      const stack = [nextJson];
      while (stack.length > 0 && comments.length < 15) {
        const node = stack.pop();
        if (!node || typeof node !== "object") continue;
        const c = node.commentRenderer;
        if (c && c.commentId) {
          comments.push({
            id: c.commentId,
            author: c.authorText?.simpleText || "@viewer",
            text: c.contentText?.runs?.map((r: any) => r.text).join("") || "",
          });
        }
        if (Array.isArray(node)) {
          for (let i = node.length - 1; i >= 0; i--) stack.push(node[i]);
        } else {
          for (const key of Object.keys(node)) stack.push(node[key]);
        }
      }
    }

    return {
      video: details
        ? {
            id: videoId,
            title: details.title,
            description: details.shortDescription || "No description available.",
            channelTitle: details.author,
            channelId: details.channelId || "",
            viewCount: viewText,
          }
        : null,
      comments,
    };
  } catch {
    return { video: null, comments: [] };
  }
}

// Fetch creator channel metadata + deep catalog via InnerTube browse & parallel searches
async function fetchChannelData(
  channelId: string,
  tab = "videos",
  knownName = ""
) {
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

  // 1. InnerTube Browse for channel metadata & initial tab videos
  if (channelId.startsWith("UC")) {
    try {
      const browseRes = await fetch(
        "https://www.youtube.com/youtubei/v1/browse?prettyPrint=false",
        {
          method: "POST",
          headers: YT_HEADERS,
          body: JSON.stringify({
            context: CLIENT_CONTEXT,
            browseId: channelId,
            params: tab === "shorts" ? "EgZzaG9ydHPyBgQKAjoA" : "EgZ2aWRlb3PyBgQKAjoA",
          }),
          cache: "no-store",
        }
      );

      if (browseRes.ok) {
        const data = await browseRes.json();
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

        const extracted = extractVideosAndChannels(data, title, channelId);
        addUnique(extracted.videos, false);
      }
    } catch {}
  }

  // 2. Parallel InnerTube searches filtered to this creator for deep catalog
  if (title && title !== "Channel") {
    const suffixes =
      tab === "shorts"
        ? ["#shorts", "shorts", "clip"]
        : tab === "live"
        ? ["stream", "live", "vod"]
        : ["", "2026", "2025", "2024", "best", "full"];

    const batches = await Promise.all(
      suffixes.map((s) => searchInnerTube(`${title} ${s}`.trim()))
    );
    for (const b of batches) {
      addUnique(b.videos, true);
    }
  }

  if (tab === "popular" && allVideos.length > 0) {
    const parseViews = (str: string) => {
      const m = (str || "").replace(/,/g, "").match(/([\d.]+)\s*([KMB])?/i);
      if (!m) return 0;
      const n = parseFloat(m[1]);
      const mult =
        m[2]?.toUpperCase() === "B"
          ? 1e9
          : m[2]?.toUpperCase() === "M"
          ? 1e6
          : m[2]?.toUpperCase() === "K"
          ? 1e3
          : 1;
      return n * mult;
    };
    allVideos.sort((a, b) => parseViews(b.viewCount) - parseViews(a.viewCount));
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

  if (channelId || channelName) {
    let targetId = channelId || "";
    let fallbackInfo: any = null;

    if (!targetId && channelName) {
      const searchRes = await searchInnerTube(channelName);
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
      if (fallbackInfo) {
        channelData.channel.avatar =
          channelData.channel.avatar || fallbackInfo.avatar;
        channelData.channel.description =
          channelData.channel.description || fallbackInfo.description;
      }
      return NextResponse.json(channelData);
    }

    return NextResponse.json({
      channel: {
        id: "channel",
        title: channelName || "Channel",
        description: "Videos from this creator.",
        avatar: "",
        banner: "",
      },
      videos: BACKUP_VIDEOS,
    });
  }

  if (videoId) {
    const details = await fetchVideoDetails(videoId);
    return NextResponse.json(details);
  }

  const searchTerm = query.trim() || "popular music gaming tech 2026";
  const results = await searchInnerTube(searchTerm);

  if (results.videos.length > 0 || results.channels.length > 0) {
    return NextResponse.json({
      videos: results.videos,
      channels: query.trim() ? results.channels : [],
    });
  }

  return NextResponse.json({ videos: BACKUP_VIDEOS, channels: [] });
}
