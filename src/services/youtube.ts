"use server";

import {
  YouTubeAPIResponse,
  YouTubeVideoResource,
  VideoInsert,
  Category,
} from "@/types/video";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

/**
 * Extract the video ID from various YouTube URL formats.
 *
 * Supported formats:
 *  - https://www.youtube.com/watch?v=VIDEO_ID
 *  - https://youtu.be/VIDEO_ID
 *  - https://www.youtube.com/embed/VIDEO_ID
 *  - https://www.youtube.com/shorts/VIDEO_ID
 */
export async function extractVideoId(url: string): Promise<string | null> {
  const patterns = [
    /(?:youtube\.com\/watch\?v=)([a-zA-Z0-9_-]{11})/,
    /(?:youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /(?:youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }

  return null;
}

/**
 * Detect the platform from a URL string.
 */
export async function detectPlatformFromUrl(url: string): Promise<string> {
  const lowercaseUrl = url.toLowerCase();
  if (lowercaseUrl.includes("youtube.com") || lowercaseUrl.includes("youtu.be")) {
    return "youtube";
  }
  if (lowercaseUrl.includes("instagram.com")) {
    return "instagram";
  }
  if (lowercaseUrl.includes("facebook.com") || lowercaseUrl.includes("fb.watch") || lowercaseUrl.includes("fb.com")) {
    return "facebook";
  }
  return "other";
}

/**
 * Fetch full video details from the YouTube Data API v3.
 */
export async function fetchVideoDetails(
  videoId: string
): Promise<YouTubeVideoResource | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
  }

  const params = new URLSearchParams({
    part: "snippet,statistics,contentDetails",
    id: videoId,
    key: apiKey,
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);

  if (!response.ok) {
    throw new Error(
      `YouTube API error: ${response.status} ${response.statusText}`
    );
  }

  const data: YouTubeAPIResponse = await response.json();

  if (!data.items || data.items.length === 0) {
    return null;
  }

  return data.items[0];
}

/**
 * Map a YouTube API resource to the VideoInsert shape used by Supabase.
 */
export async function mapYouTubeToVideoInsert(
  resource: YouTubeVideoResource,
  originalUrl: string
): Promise<VideoInsert> {
  const { snippet, statistics, contentDetails } = resource;
  
  const title = snippet.title;
  const description = snippet.description;
  const combinedText = `${title} ${description}`.toLowerCase();
  const category = autoDetectCategory(combinedText);

  return {
    platform: "youtube",
    category,
    video_url: originalUrl,
    title,
    thumbnail_url:
      snippet.thumbnails.maxres?.url ||
      snippet.thumbnails.high?.url ||
      snippet.thumbnails.medium?.url ||
      snippet.thumbnails.default.url,
    description,
    channel_name: snippet.channelTitle,
    published_at: snippet.publishedAt,
    tags: snippet.tags ?? [],
    view_count: parseInt(statistics.viewCount, 10) || 0,
    like_count: parseInt(statistics.likeCount, 10) || 0,
    duration: contentDetails.duration,
  };
}

/**
 * Basic keyword-based category detection
 */
function autoDetectCategory(text: string): Category {
  const keywords = {
    Education: ["learn", "course", "tutorial", "study", "explained", "how to", "why", "science", "math", "history", "school", "university", "lecture"],
    Skill: ["coding", "programming", "javascript", "python", "react", "development", "design", "figma", "photoshop", "editing", "drawing", "painting", "art", "craft", "cook", "recipe", "workout", "fitness"],
    Entertainment: ["music", "song", "movie", "trailer", "comedy", "funny", "joke", "prank", "gaming", "gameplay", "stream", "show", "entertainment", "dance"],
    Vlogs: ["vlog", "travel", "my day", "daily", "life", "tour", "unboxing", "review", "lifestyle"],
  };

  for (const [category, words] of Object.entries(keywords)) {
    if (words.some((word) => text.includes(word))) {
      return category as Category;
    }
  }

  return "Other";
}

/**
 * Search YouTube videos by query string. Returns up to `maxResults` items.
 */
export async function searchYouTubeVideos(
  query: string,
  maxResults: number = 5
): Promise<YouTubeVideoResource[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;

  if (!apiKey) {
    throw new Error("YOUTUBE_API_KEY is not set in environment variables.");
  }

  // Step 1: Search for video IDs (supporting more than 50 via pagination)
  let videoIds: string[] = [];
  let nextPageToken: string | undefined;
  const targetCount = Math.min(maxResults, 100); // User requested 100

  while (videoIds.length < targetCount) {
    const searchParams = new URLSearchParams({
      part: "snippet",
      q: query,
      type: "video",
      order: "viewCount",
      maxResults: String(Math.min(targetCount - videoIds.length, 50)),
      key: apiKey,
    });
    if (nextPageToken) searchParams.append("pageToken", nextPageToken);

    const searchRes = await fetch(`${YOUTUBE_API_BASE}/search?${searchParams}`);
    if (!searchRes.ok) break;

    const data = await searchRes.json();
    const batchIds = data.items.map((item: any) => item.id.videoId);
    videoIds = [...videoIds, ...batchIds];
    nextPageToken = data.nextPageToken;

    if (!nextPageToken || batchIds.length === 0) break;
  }

  if (videoIds.length === 0) return [];

  // Step 2: Fetch full details for those IDs
  // YouTube allows fetching up to 50 IDs at a time in the /videos endpoint
  let allResources: YouTubeVideoResource[] = [];
  
  for (let i = 0; i < videoIds.length; i += 50) {
    const chunk = videoIds.slice(i, i + 50);
    const detailParams = new URLSearchParams({
      part: "snippet,statistics,contentDetails",
      id: chunk.join(","),
      key: apiKey,
    });

    const detailRes = await fetch(`${YOUTUBE_API_BASE}/videos?${detailParams}`);
    if (detailRes.ok) {
      const detailData: YouTubeAPIResponse = await detailRes.json();
      allResources = [...allResources, ...detailData.items];
    }
  }

  return allResources;
}

/**
 * Fetch most popular videos (Trending) from YouTube.
 */
export async function fetchPopularVideos(maxResults: number = 50): Promise<YouTubeVideoResource[]> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error("YOUTUBE_API_KEY not set.");

  let allResources: YouTubeVideoResource[] = [];
  let nextPageToken: string | undefined;
  const targetCount = Math.min(maxResults, 100);

  while (allResources.length < targetCount) {
    const params = new URLSearchParams({
      part: "snippet,statistics,contentDetails",
      chart: "mostPopular",
      maxResults: String(Math.min(targetCount - allResources.length, 50)),
      key: apiKey,
    });
    if (nextPageToken) params.append("pageToken", nextPageToken);

    const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);
    if (!response.ok) break;

    const data: YouTubeAPIResponse = await response.json();
    allResources = [...allResources, ...data.items];
    nextPageToken = data.nextPageToken;

    if (!nextPageToken || data.items.length === 0) break;
  }

  return allResources;
}

/**
 * Generic metadata scraper for non-YouTube links (OG tags)
 */
export async function fetchMetadataFromUrl(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
      next: { revalidate: 3600 }
    });
    
    if (!response.ok) return null;
    const html = await response.text();

    const getMeta = (nameOrProperty: string) => {
      // Look for both property="..." and name="..."
      const patterns = [
        new RegExp(`<meta[^>]+property=["']${nameOrProperty}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${nameOrProperty}["']`, "i"),
        new RegExp(`<meta[^>]+name=["']${nameOrProperty}["'][^>]+content=["']([^"']+)["']`, "i"),
        new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${nameOrProperty}["']`, "i"),
      ];

      for (const pattern of patterns) {
        const match = html.match(pattern);
        if (match) return decodeHtmlEntities(match[1]);
      }
      return null;
    };

    const titleRegex = /<title[^>]*>([^<]+)<\/title>/i;
    const titleMatch = html.match(titleRegex);
    const title = getMeta("og:title") || getMeta("twitter:title") || (titleMatch ? decodeHtmlEntities(titleMatch[1]) : "");
    
    // Try to extract channel name from site_name or URL
    let channelName = getMeta("og:site_name") || getMeta("og:author") || "";
    
    // Clean up generic site names
    if (channelName === "Facebook" || channelName === "Instagram" || !channelName) {
      // Try to extract from URL (e.g., facebook.com/USERNAME/videos/...)
      // Instagram reels: instagram.com/reel/ID/ or instagram.com/reels/USERNAME/
      const fbMatch = url.match(/facebook\.com\/([^/?#]+)/);
      const igMatch = url.match(/instagram\.com\/([^/?#]+)/);
      const igReelMatch = url.match(/instagram\.com\/reels?\/([^/?#]+)/);

      if (igReelMatch && !["reel", "reels"].includes(igReelMatch[1])) {
        channelName = igReelMatch[1];
      } else if (igMatch && !["p", "reel", "reels"].includes(igMatch[1])) {
        channelName = igMatch[1];
      } else if (fbMatch && !["videos", "watch", "story.php"].includes(fbMatch[1])) {
        channelName = fbMatch[1];
      } else {
        channelName = ""; // If it's just 'reel' or 'videos', it's not a username
      }
    }

    // Handle generic titles that some platforms return when blocked
    let finalTitle = title;
    const description = (getMeta("og:description") || getMeta("twitter:description") || getMeta("description") || "").trim();
    
    if (finalTitle === "Instagram" || finalTitle === "Facebook" || finalTitle === "Reel") {
      // Try to find a better title in the description (e.g., "Username on Instagram: 'Title'")
      const igTitleMatch = description.match(/^([^:]+): "([^"]+)"/);
      if (igTitleMatch) {
         finalTitle = igTitleMatch[2];
         if (!channelName) channelName = igTitleMatch[1].split(' ')[0];
      } else {
        finalTitle = ""; 
      }
    }

    // Fallback channel extraction from description if URL parsing failed
    if (!channelName && description.toLowerCase().includes("by ")) {
      const byMatch = description.match(/by ([^.]+)/i);
      if (byMatch) channelName = byMatch[1].trim();
    }

    // Try parsing JSON-LD as a last resort
    let thumbnail = getMeta("og:image") || getMeta("twitter:image") || "";
    if (!thumbnail && html.includes('application/ld+json')) {
      try {
        const jsonMatch = html.match(/<script type="application\/ld\+json">([\s\S]+?)<\/script>/);
        if (jsonMatch) {
          const ld = JSON.parse(jsonMatch[1]);
          if (ld.thumbnailUrl) thumbnail = ld.thumbnailUrl;
          if (!finalTitle && ld.name) finalTitle = ld.name;
        }
      } catch (e) {}
    }

    return {
      title: finalTitle.trim(),
      thumbnail: thumbnail,
      description: description,
      channel_name: channelName.trim(),
      category: autoDetectCategory((finalTitle + " " + channelName).toLowerCase())
    };
  } catch (error) {
    console.error("Scraping error:", error);
    return null;
  }
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/&#([0-9]+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
}
