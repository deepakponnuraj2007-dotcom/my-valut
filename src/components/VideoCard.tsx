"use client";

import { Video } from "@/types/video";

interface VideoCardProps {
  video: Video;
  onDelete?: (id: string) => void;
}

export default function VideoCard({ video, onDelete }: VideoCardProps) {
  const platformColors: Record<string, { badge: string; label: string }> = {
    youtube: {
      badge: "bg-vault-youtube/15 text-vault-youtube border border-vault-youtube/20",
      label: "YouTube",
    },
    instagram: {
      badge: "bg-vault-instagram/15 text-vault-instagram border border-vault-instagram/20",
      label: "Instagram",
    },
    facebook: {
      badge: "bg-blue-500/15 text-blue-400 border border-blue-500/20",
      label: "Facebook",
    },
  };

  const platform = platformColors[video.platform.toLowerCase()] || {
    badge: "bg-vault-accent/15 text-vault-accent border border-vault-accent/20",
    label: video.platform.charAt(0).toUpperCase() + video.platform.slice(1),
  };

  const formatCount = (count: number): string => {
    if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M`;
    if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K`;
    return String(count);
  };

  const formatDuration = (iso: string | null): string => {
    if (!iso) return "";
    const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return "";
    const h = match[1] ? `${match[1]}:` : "";
    const m = match[2] ? match[2].padStart(2, "0") : "00";
    const s = match[3] ? match[3].padStart(2, "0") : "00";
    return `${h}${m}:${s}`;
  };

  return (
    <div className="group glass rounded-xl overflow-hidden card-hover animate-fade-in">
      {/* Thumbnail */}
      <a
        href={video.video_url}
        target="_blank"
        rel="noopener noreferrer"
        className="block relative aspect-video overflow-hidden bg-vault-deeper"
      >
        {video.thumbnail_url ? (
          <>
            <img
              src={video.thumbnail_url}
              alt={video.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            {video.is_18_plus && (
              <div className="absolute top-2 right-2 px-2 py-0.5 rounded-md bg-red-600/90 text-white text-[10px] font-black tracking-tighter backdrop-blur-md shadow-lg z-10 border border-white/20 animate-pulse">
                18+
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <svg
              className="w-12 h-12 text-vault-muted"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              viewBox="0 0 24 24"
            >
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <path d="m10 9 5 3-5 3z" />
            </svg>
          </div>
        )}

        {/* Duration badge */}
        {video.duration && (
          <span className="absolute bottom-2 right-2 bg-black/80 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            {formatDuration(video.duration)}
          </span>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-vault-accent/0 group-hover:bg-vault-accent/10 transition-colors duration-300 flex items-center justify-center">
          <svg
            className="w-12 h-12 text-white opacity-0 group-hover:opacity-80 transition-all duration-300 scale-75 group-hover:scale-100"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </a>

      {/* Info */}
      <div className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-snug line-clamp-2 text-vault-text group-hover:text-white transition-colors">
            {video.title}
          </h3>
          {onDelete && (
            <button
              onClick={() => onDelete(video.id)}
              className="shrink-0 p-1 rounded-md text-vault-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Delete video"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z" />
              </svg>
            </button>
          )}
        </div>

        {video.channel_name && (
          <p className="text-xs text-vault-text-secondary truncate">
            {video.channel_name}
          </p>
        )}

        <div className="flex items-center justify-between pt-1">
          <span className={`platform-badge ${platform.badge}`}>
            {platform.label}
          </span>

          <div className="flex items-center gap-3 text-xs text-vault-muted">
            {video.view_count > 0 && (
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                {formatCount(video.view_count)}
              </span>
            )}
            {video.like_count > 0 && (
              <span className="flex items-center gap-1">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
                {formatCount(video.like_count)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
