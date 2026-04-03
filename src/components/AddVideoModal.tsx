"use client";

import { useEffect, useState } from "react";
import { Platform, VideoInsert, Category } from "@/types/video";
import { extractVideoId, fetchVideoDetails, mapYouTubeToVideoInsert, detectPlatformFromUrl, fetchMetadataFromUrl } from "@/services/youtube";

interface AddVideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (video: VideoInsert) => void;
}

export default function AddVideoModal({
  isOpen,
  onClose,
  onSave,
}: AddVideoModalProps) {
  const [platform, setPlatform] = useState<string>("youtube");
  const [customPlatform, setCustomPlatform] = useState("");
  const [isOtherPlatform, setIsOtherPlatform] = useState(false);
  const [category, setCategory] = useState<Category>("Other");
  const [videoUrl, setVideoUrl] = useState("");
  const [title, setTitle] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState("");
  const [channelName, setChannelName] = useState("");
  const [description, setDescription] = useState("");
  const [is18Plus, setIs18Plus] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      if (!videoUrl || videoUrl.length < 10) return;

      const detected = await detectPlatformFromUrl(videoUrl);
      if (isCancelled) return;

      if (detected === "other") {
        setIsOtherPlatform(true);
      } else {
        setIsOtherPlatform(false);
        setPlatform(detected);
      }

      setIsLoading(true);
      try {
        if (detected === "youtube") {
          const videoId = await extractVideoId(videoUrl);
          if (videoId && !isCancelled) {
            const resource = await fetchVideoDetails(videoId);
            if (resource && !isCancelled) {
              const mapped = await mapYouTubeToVideoInsert(resource, videoUrl);
              setTitle(mapped.title);
              setThumbnailUrl(mapped.thumbnail_url || "");
              setChannelName(mapped.channel_name || "");
              setDescription(mapped.description || "");
              if (mapped.category) setCategory(mapped.category);
              if (mapped.is_18_plus !== undefined) setIs18Plus(mapped.is_18_plus);
            }
          }
        } else {
          const metadata = await fetchMetadataFromUrl(videoUrl);
          if (metadata && !isCancelled) {
            setTitle(metadata.title);
            setThumbnailUrl(metadata.thumbnail);
            setDescription(metadata.description);
            setChannelName(metadata.channel_name || "");
            if (metadata.category) setCategory(metadata.category);
          }
        }
      } catch (error) {
        console.error("Auto-fill error:", error);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }, 800);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [videoUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVideoUrl(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const video: VideoInsert = {
      platform: isOtherPlatform ? customPlatform : platform,
      category,
      video_url: videoUrl,
      title,
      thumbnail_url: thumbnailUrl || null,
      channel_name: channelName || null,
      description: description || null,
      is_18_plus: is18Plus,
    };

    onSave(video);
    resetForm();
    setIsLoading(false);
  };

  const resetForm = () => {
    setVideoUrl("");
    setTitle("");
    setThumbnailUrl("");
    setChannelName("");
    setDescription("");
    setPlatform("youtube");
    setCategory("Other");
    setCustomPlatform("");
    setIsOtherPlatform(false);
    setIs18Plus(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
      resetForm();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div className="relative w-full max-w-lg glass-strong rounded-2xl shadow-glow-lg animate-slide-up overflow-hidden">
        {/* Accent top bar */}
        <div className="h-1 bg-accent-gradient" />

        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gradient">Add Video</h2>
            <button
              onClick={() => {
                onClose();
                resetForm();
              }}
              className="p-1.5 rounded-lg text-vault-muted hover:text-vault-text hover:bg-vault-card transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Platform toggle */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                Platform
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => { setPlatform("youtube"); setIsOtherPlatform(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    platform === "youtube" && !isOtherPlatform
                      ? "bg-vault-youtube/15 text-vault-youtube border border-vault-youtube/30"
                      : "bg-vault-deeper text-vault-muted border border-vault-border hover:border-vault-youtube/20"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  YouTube
                </button>

                <button
                  type="button"
                  onClick={() => { setPlatform("instagram"); setIsOtherPlatform(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    platform === "instagram" && !isOtherPlatform
                      ? "bg-vault-instagram/15 text-vault-instagram border border-vault-instagram/30"
                      : "bg-vault-deeper text-vault-muted border border-vault-border hover:border-vault-instagram/20"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                  Instagram
                </button>

                <button
                  type="button"
                  onClick={() => { setPlatform("facebook"); setIsOtherPlatform(false); }}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    platform === "facebook" && !isOtherPlatform
                      ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                      : "bg-vault-deeper text-vault-muted border border-vault-border hover:border-blue-500/20"
                  }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>

                <button
                  type="button"
                  onClick={() => setIsOtherPlatform(true)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isOtherPlatform
                      ? "bg-vault-accent/15 text-vault-accent border border-vault-accent/30"
                      : "bg-vault-deeper text-vault-muted border border-vault-border hover:border-vault-accent/20"
                  }`}
                >
                  Other
                </button>
              </div>
              {isOtherPlatform && (
                <div className="mt-3 animate-fade-in">
                  <input
                    type="text"
                    required
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    placeholder="Enter Platform Name (e.g. TikTok, Twitter)"
                    className="vault-input !py-2 !text-xs"
                  />
                </div>
              )}
            </div>

            {/* URL */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                Video URL *
              </label>
              <input
                type="url"
                required
                value={videoUrl}
                onChange={handleUrlChange}
                placeholder="https://youtube.com/watch?v=..."
                className="vault-input"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="vault-input appearance-none bg-vault-deeper"
              >
                <option value="Education">Education</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Skill">Skill</option>
                <option value="Vlogs">Vlogs</option>
                <option value="Other">Other</option>
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                Title *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Video title"
                className="vault-input"
              />
            </div>

            {/* Thumbnail URL */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                Thumbnail URL
              </label>
              <input
                type="url"
                value={thumbnailUrl}
                onChange={(e) => setThumbnailUrl(e.target.value)}
                placeholder="https://img.youtube.com/vi/..."
                className="vault-input"
              />
            </div>

            {/* Channel Name */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                Channel / Creator
              </label>
              <input
                type="text"
                value={channelName}
                onChange={(e) => setChannelName(e.target.value)}
                placeholder="Channel name"
                className="vault-input"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description..."
                rows={3}
                className="vault-input resize-none"
              />
            </div>

            {/* 18+ Toggle */}
            <div className="flex items-center justify-between p-4 bg-vault-deeper/50 rounded-xl border border-vault-border group hover:border-vault-accent/20 transition-all duration-300">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg transition-colors ${is18Plus ? 'bg-red-500/20 text-red-400' : 'bg-vault-card text-vault-muted'}`}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 8v4M12 16h.01" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-vault-text">18+ Restricted Content</h3>
                  <p className="text-[10px] text-vault-muted">Hide this video from users under 18</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIs18Plus(!is18Plus)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                   is18Plus ? "bg-red-500/60 shadow-[0_0_10px_rgba(239,68,68,0.3)]" : "bg-vault-card border border-vault-border"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform duration-300 ${
                    is18Plus ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Actions */}
            <div className="flex justify-center items-center gap-4 pt-4">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  resetForm();
                }}
                className="vault-btn-ghost px-6"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="vault-btn-primary px-6 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                      <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                    </svg>
                    Saving…
                  </span>
                ) : (
                  "Save to Vault"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
