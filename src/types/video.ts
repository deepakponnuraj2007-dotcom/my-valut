export type Platform = string;
export type Category = "Education" | "Entertainment" | "Skill" | "Vlogs" | "Other";

export interface Video {
  id: string;
  user_email: string;
  category: Category;
  platform: Platform;
  video_url: string;
  title: string;
  thumbnail_url: string | null;
  description: string | null;
  channel_name: string | null;
  published_at: string | null;
  tags: string[];
  view_count: number;
  like_count: number;
  duration: string | null;
  created_at: string;
  updated_at: string;
}

export interface VideoInsert {
  user_email?: string;
  platform: Platform;
  category?: Category;
  video_url: string;
  title: string;
  thumbnail_url?: string | null;
  description?: string | null;
  channel_name?: string | null;
  published_at?: string | null;
  tags?: string[];
  view_count?: number;
  like_count?: number;
  duration?: string | null;
}

// ----- YouTube Data API response shapes -----

export interface YouTubeSnippet {
  title: string;
  description: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default: { url: string; width: number; height: number };
    medium: { url: string; width: number; height: number };
    high: { url: string; width: number; height: number };
    maxres?: { url: string; width: number; height: number };
  };
  tags?: string[];
}

export interface YouTubeStatistics {
  viewCount: string;
  likeCount: string;
  commentCount: string;
}

export interface YouTubeContentDetails {
  duration: string; // ISO 8601
}

export interface YouTubeVideoResource {
  id: string;
  snippet: YouTubeSnippet;
  statistics: YouTubeStatistics;
  contentDetails: YouTubeContentDetails;
}

export interface YouTubeAPIResponse {
  items: YouTubeVideoResource[];
  pageInfo: {
    resultsPerPage: number;
  };
  nextPageToken?: string;
}
