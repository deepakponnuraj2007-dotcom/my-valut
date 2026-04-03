"use client";

import { useState, useMemo, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import VideoCard from "@/components/VideoCard";
import AddVideoModal from "@/components/AddVideoModal";
import LoginModal from "@/components/LoginModal";
import ProfileModal from "@/components/ProfileModal";
import EmptyState from "@/components/EmptyState";
import { Video, VideoInsert, Platform, Category } from "@/types/video";
import { Profile } from "@/types/user";
import { supabase } from "@/lib/supabaseClient";
import { calculateAge } from "@/services/youtube";

// No more DEMO_VIDEOS - We are using live Supabase data now

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoadingVideos, setIsLoadingVideos] = useState(true);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlatform, setActivePlatform] = useState<string | "all">("all");
  const [activeCategory, setActiveCategory] = useState<Category | "all">("all");
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchVideos = async () => {
    setIsLoadingVideos(true);
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setVideos(data as Video[]);
    } else {
      setVideos([]);
    }
    setIsLoadingVideos(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (!error && data) {
      setProfile(data as Profile);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      if (email && session?.user?.id) {
        fetchVideos();
        fetchProfile(session.user.id);
      }
      else {
        setVideos([]);
        setIsLoadingVideos(false);
        setProfile(null);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      if (email && session?.user?.id) {
        setIsLoginModalOpen(false);
        fetchVideos();
        fetchProfile(session.user.id);
      } else {
        setVideos([]);
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Filtered videos
  const filteredVideos = useMemo(() => {
    const userAge = calculateAge(profile?.date_of_birth || null);
    const isAdult = userAge >= 18;

    return videos.filter((v) => {
      // 18+ Filter
      if (v.is_18_plus && !isAdult) return false;

      const matchesPlatform =
        activePlatform === "all" || v.platform.toLowerCase() === activePlatform.toLowerCase();
      const matchesCategory =
        activeCategory === "all" || v.category === activeCategory;
      const matchesSearch =
        !searchQuery ||
        v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        v.channel_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesPlatform && matchesCategory && matchesSearch;
    });
  }, [videos, activePlatform, activeCategory, searchQuery, profile]);

  // Stats
  const stats = useMemo(
    () => ({
      total: videos.length,
      youtube: videos.filter((v) => v.platform === "youtube").length,
      instagram: videos.filter((v) => v.platform === "instagram").length,
      categories: {
        Education: videos.filter((v) => v.category === "Education").length,
        Entertainment: videos.filter((v) => v.category === "Entertainment").length,
        Skill: videos.filter((v) => v.category === "Skill").length,
        Vlogs: videos.filter((v) => v.category === "Vlogs").length,
        Other: videos.filter((v) => v.category === "Other").length,
      },
    }),
    [videos]
  );

  const uniquePlatforms = useMemo(() => {
    const platforms = videos.map((v) => v.platform.toLowerCase());
    return Array.from(new Set(platforms));
  }, [videos]);

  const handleSaveVideo = async (insert: VideoInsert) => {
    // Ensure all optional fields are properly handled as null if undefined
    const newVideoData: VideoInsert = {
      ...insert,
      user_email: userEmail || undefined,
      thumbnail_url: insert.thumbnail_url ?? null,
      description: insert.description ?? null,
      channel_name: insert.channel_name ?? null,
      published_at: insert.published_at ?? null,
      tags: insert.tags ?? [],
      view_count: insert.view_count ?? 0,
      like_count: insert.like_count ?? 0,
      duration: insert.duration ?? null,
    };

    const { data, error } = await supabase
      .from("videos")
      .insert([newVideoData])
      .select()
      .single();

    if (!error && data) {
      setVideos((prev) => [data as Video, ...prev]);
    } else {
      console.error("Failed to save video:", error);
    }
    
    setIsModalOpen(false);
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("videos").delete().eq("id", id);
    if (!error) {
      setVideos((prev) => prev.filter((v) => v.id !== id));
    } else {
      console.error("Failed to delete video:", error);
    }
  };

  const handleLogout = async (clearData: boolean) => {
    if (clearData) {
      const { error } = await supabase.from("videos").delete().match({ user_email: userEmail });
      if (error) console.error("Failed to clear data:", error);
    }
    await supabase.auth.signOut();
  };

  const handleAddVideoClick = () => {
    if (userEmail) {
      setIsModalOpen(true);
    } else {
      setIsLoginModalOpen(true);
    }
  };

  return (
    <>
      <Navbar
        onAddVideo={handleAddVideoClick}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        userEmail={userEmail}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      <main className="pt-20 pb-12 px-6 max-w-[1600px] mx-auto">
        <div className="flex gap-8">
          {/* Sidebar */}
          <Sidebar
            activePlatform={activePlatform}
            onPlatformChange={setActivePlatform}
            activeCategory={activeCategory}
            onCategoryChange={setActiveCategory}
            platforms={uniquePlatforms}
            stats={stats}
            isOpen={isSidebarOpen}
            onClose={() => setIsSidebarOpen(false)}
          />

          {/* Content area */}
          <div className="flex-1 min-w-0">
            {/* Header */}
            <div className="mb-8 animate-fade-in">
              <h2 className="text-2xl font-bold mb-1">
                {activePlatform === "all"
                  ? "All Videos"
                  : activePlatform === "youtube"
                  ? "YouTube Videos"
                  : "Instagram Videos"}
              </h2>
              <p className="text-vault-text-secondary text-sm">
                {filteredVideos.length}{" "}
                {filteredVideos.length === 1 ? "video" : "videos"} in your vault
              </p>
            </div>

            {/* Grid / Empty / Loading */}
            {isLoadingVideos ? (
              <div className="flex justify-center py-20">
                <div className="flex flex-col items-center gap-4">
                  <svg className="animate-spin w-8 h-8 text-vault-accent" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  <span className="text-vault-muted text-sm tracking-widest uppercase">Loading Vault...</span>
                </div>
              </div>
            ) : filteredVideos.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {filteredVideos.map((video) => (
                  <VideoCard
                    key={video.id}
                    video={video}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <EmptyState onAddVideo={handleAddVideoClick} />
            )}
          </div>
        </div>
      </main>

      <AddVideoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveVideo}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        userEmail={userEmail}
        profile={profile}
        onLogout={handleLogout}
        stats={stats}
      />
    </>
  );
}
