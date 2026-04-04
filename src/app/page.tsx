"use client";

import { useState, useEffect, useMemo } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import LoginModal from "@/components/LoginModal";
import ProfileModal from "@/components/ProfileModal";
import { YouTubeVideoResource } from "@/types/video";
import { Profile } from "@/types/user";
import { 
  searchYouTubeVideos, 
  mapYouTubeToVideoInsert, 
  fetchPopularVideos,
  ContentFilters
} from "@/services/youtube";
import { calculateAge } from "@/utils/age";
import { supabase } from "@/lib/supabaseClient";

export default function ExplorePage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<YouTubeVideoResource[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());
  const [isSuccess, setIsSuccess] = useState<string | null>(null);
  const [activePlatform, setActivePlatform] = useState<string>("youtube");
  
  // Content filter states
  const [selectedRegion, setSelectedRegion] = useState("IN");
  const [selectedLanguage, setSelectedLanguage] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // Auth states
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter data
  const regions = [
    { code: "IN", name: "🇮🇳 India" },
    { code: "US", name: "🇺🇸 United States" },
    { code: "GB", name: "🇬🇧 United Kingdom" },
    { code: "CA", name: "🇨🇦 Canada" },
    { code: "AU", name: "🇦🇺 Australia" },
    { code: "DE", name: "🇩🇪 Germany" },
    { code: "FR", name: "🇫🇷 France" },
    { code: "JP", name: "🇯🇵 Japan" },
    { code: "KR", name: "🇰🇷 South Korea" },
    { code: "BR", name: "🇧🇷 Brazil" },
    { code: "RU", name: "🇷🇺 Russia" },
    { code: "MX", name: "🇲🇽 Mexico" },
    { code: "SA", name: "🇸🇦 Saudi Arabia" },
    { code: "AE", name: "🇦🇪 UAE" },
    { code: "SG", name: "🇸🇬 Singapore" },
    { code: "MY", name: "🇲🇾 Malaysia" },
    { code: "ID", name: "🇮🇩 Indonesia" },
    { code: "PH", name: "🇵🇭 Philippines" },
    { code: "TH", name: "🇹🇭 Thailand" },
    { code: "VN", name: "🇻🇳 Vietnam" },
  ];

  const languages = [
    { code: "", name: "All Languages" },
    { code: "en", name: "English" },
    { code: "ta", name: "தமிழ் (Tamil)" },
    { code: "hi", name: "हिन्दी (Hindi)" },
    { code: "te", name: "తెలుగు (Telugu)" },
    { code: "ml", name: "മലയാളം (Malayalam)" },
    { code: "kn", name: "ಕನ್ನಡ (Kannada)" },
    { code: "bn", name: "বাংলা (Bengali)" },
    { code: "mr", name: "मराठी (Marathi)" },
    { code: "gu", name: "ગુજરાતી (Gujarati)" },
    { code: "pa", name: "ਪੰਜਾਬੀ (Punjabi)" },
    { code: "es", name: "Español (Spanish)" },
    { code: "fr", name: "Français (French)" },
    { code: "de", name: "Deutsch (German)" },
    { code: "ja", name: "日本語 (Japanese)" },
    { code: "ko", name: "한국어 (Korean)" },
    { code: "pt", name: "Português (Portuguese)" },
    { code: "ar", name: "العربية (Arabic)" },
    { code: "ru", name: "Русский (Russian)" },
    { code: "zh", name: "中文 (Chinese)" },
    { code: "th", name: "ไทย (Thai)" },
  ];

  const categories = [
    { id: "", name: "All Categories" },
    { id: "1", name: "🎬 Film & Animation" },
    { id: "2", name: "🚗 Autos & Vehicles" },
    { id: "10", name: "🎵 Music" },
    { id: "15", name: "🐾 Pets & Animals" },
    { id: "17", name: "⚽ Sports" },
    { id: "19", name: "✈️ Travel & Events" },
    { id: "20", name: "🎮 Gaming" },
    { id: "22", name: "👥 People & Blogs" },
    { id: "23", name: "😂 Comedy" },
    { id: "24", name: "🎭 Entertainment" },
    { id: "25", name: "📰 News & Politics" },
    { id: "26", name: "💄 How-to & Style" },
    { id: "27", name: "📚 Education" },
    { id: "28", name: "🔬 Science & Technology" },
  ];

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserEmail(session?.user?.email ?? null);
      if (session?.user?.id) fetchProfile(session.user.id);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? null;
      setUserEmail(email);
      if (email && session?.user?.id) {
        setIsLoginModalOpen(false);
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    // Fetch popular videos on mount
    fetchPopular();

    return () => subscription.unsubscribe();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activePlatform, selectedRegion, selectedLanguage, selectedCategory]);

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

  const getActiveFilters = (): ContentFilters => ({
    regionCode: selectedRegion || undefined,
    language: selectedLanguage || undefined,
    videoCategoryId: selectedCategory || undefined,
  });

  const fetchPopular = async () => {
    setIsLoading(true);
    setResults([]);
    try {
      const filters = getActiveFilters();
      if (activePlatform === "youtube") {
        const data = await fetchPopularVideos(100, filters);
        setResults(data);
      } else {
        const platformQuery = activePlatform === "instagram" ? "trending instagram reels shorts" : "trending facebook videos";
        const data = await searchYouTubeVideos(platformQuery, 50, filters);
        setResults(data);
      }
    } catch (error) {
      console.error("Failed to fetch popular videos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const executeSearch = async (searchQuery: string) => {
    setIsLoading(true);
    setResults([]);
    try {
      const filters = getActiveFilters();
      let platformKeywords = "";
      if (activePlatform === "instagram") platformKeywords = "instagram reel shorts";
      if (activePlatform === "facebook") platformKeywords = "facebook video";
      
      const effectiveQuery = activePlatform === "youtube" 
        ? searchQuery 
        : `${searchQuery} ${platformKeywords}`.trim();
      
      const data = await searchYouTubeVideos(effectiveQuery, 50, filters);
      setResults(data);
    } catch (error) {
      console.error("Search failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!query.trim()) {
      fetchPopular();
      return;
    }
    await executeSearch(query);
  };

  const addToVault = async (resource: YouTubeVideoResource) => {
    if (!userEmail) {
      setIsLoginModalOpen(true);
      return;
    }

    const videoUrl = `https://www.youtube.com/watch?v=${resource.id}`;
    
    // Check for duplicate in the database
    const { data: existing } = await supabase
      .from("videos")
      .select("id")
      .eq("user_email", userEmail)
      .eq("video_url", videoUrl)
      .limit(1);

    if (existing && existing.length > 0) {
      alert("This video is already in your vault!");
      return;
    }

    const mapped = await mapYouTubeToVideoInsert(resource, videoUrl);
    
    // Explicitly add user_email for persistence
    const finalData = {
      ...mapped,
      user_email: userEmail
    };

    const { error } = await supabase.from("videos").insert([finalData]);

    if (!error) {
      setAddedIds((prev) => new Set(prev).add(resource.id));
      setIsSuccess(resource.id);
      setTimeout(() => setIsSuccess(null), 3000);
    } else {
      console.error("Failed to add to vault:", error);
    }
  };

  const handleLogout = async (clearData: boolean) => {
    if (clearData) {
      const { error } = await supabase.from("videos").delete().match({ user_email: userEmail });
      if (error) console.error("Failed to clear data:", error);
    }
    await supabase.auth.signOut();
    setIsProfileOpen(false);
  };

  const filteredResults = useMemo(() => {
    const userAge = calculateAge(profile?.date_of_birth || null);
    const isAdult = userAge >= 18;
    return results.filter(v => isAdult || !(v as any).is_18_plus);
  }, [results, profile]);

  return (
    <>
      <Navbar
        onAddVideo={() => {}} 
        searchQuery=""
        onSearchChange={() => {}}
        userEmail={userEmail}
        onLoginClick={() => setIsLoginModalOpen(true)}
        onProfileClick={() => setIsProfileOpen(true)}
        onMenuClick={() => setIsSidebarOpen(true)}
      />

      {/* Mobile Backdrop for Explore Sidebar */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm lg:hidden animate-fade-in"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <main className="pt-24 pb-12 px-6 max-w-[1600px] mx-auto min-h-screen">
        <div className="flex gap-8">
          <aside className={`
            fixed inset-y-0 left-0 z-[70] w-72 bg-vault-bg border-r border-white/10 p-6 
            transform transition-transform duration-300 ease-out lg:relative lg:translate-x-0 lg:z-0 lg:bg-transparent lg:border-none lg:p-0 lg:w-64 lg:block
            ${isSidebarOpen ? "translate-x-0 shadow-glow" : "-translate-x-full lg:translate-x-0"}
          `}>
             {/* Mobile Header with Close */}
            <div className="flex items-center justify-between mb-8 lg:hidden">
              <h2 className="text-xl font-bold text-gradient">Platforms</h2>
              <button onClick={() => setIsSidebarOpen(false)} className="p-2 rounded-lg bg-white/5 text-vault-muted hover:text-white transition-colors">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
            
            <div className="sticky top-24 space-y-8">
              <h3 className="text-xs font-semibold text-vault-muted uppercase tracking-widest mb-4">Platforms</h3>
              <div className="space-y-1">
                <button 
                  onClick={() => { setActivePlatform("youtube"); setQuery(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    activePlatform === "youtube" 
                    ? "bg-vault-accent/15 text-vault-accent border border-vault-accent/30 font-medium shadow-glow-sm"
                    : "text-vault-muted border border-transparent hover:bg-white/5"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                  YouTube
                </button>
                <button 
                  onClick={() => { setActivePlatform("instagram"); setQuery(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    activePlatform === "instagram" 
                    ? "bg-vault-instagram/15 text-vault-instagram border border-vault-instagram/30 font-medium shadow-glow-sm"
                    : "text-vault-muted border border-transparent hover:bg-white/5"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204 0-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
                  </svg>
                  Instagram
                </button>
                <button 
                  onClick={() => { setActivePlatform("facebook"); setQuery(""); }}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${
                    activePlatform === "facebook" 
                    ? "bg-blue-500/15 text-blue-400 border border-blue-500/30 font-medium shadow-glow-sm"
                    : "text-vault-muted border border-transparent hover:bg-white/5"
                  }`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  Facebook
                </button>
              </div>
            </div>

            {/* Content Filters Section */}
            <div className="space-y-4">
              <button 
                onClick={() => setIsFiltersOpen(!isFiltersOpen)}
                className="w-full flex items-center justify-between text-xs font-semibold text-vault-muted uppercase tracking-widest"
              >
                <span className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <line x1="4" y1="6" x2="20" y2="6" />
                    <line x1="7" y1="12" x2="17" y2="12" />
                    <line x1="10" y1="18" x2="14" y2="18" />
                  </svg>
                  Content Filters
                </span>
                <svg 
                  width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className={`transition-transform duration-300 ${isFiltersOpen ? 'rotate-180' : ''}`}
                >
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              <div className={`space-y-3 overflow-hidden transition-all duration-400 ease-out ${
                isFiltersOpen ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0'
              }`}>
                {/* Region Filter */}
                <div>
                  <label className="text-[10px] font-bold text-vault-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="2" y1="12" x2="22" y2="12" />
                      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
                    </svg>
                    Region
                  </label>
                  <select
                    value={selectedRegion}
                    onChange={(e) => setSelectedRegion(e.target.value)}
                    className="w-full bg-vault-card border border-white/10 rounded-xl px-3 py-2 text-xs text-vault-text focus:outline-none focus:ring-2 focus:ring-vault-accent/50 focus:border-vault-accent transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  >
                    {regions.map(r => (
                      <option key={r.code} value={r.code}>{r.name}</option>
                    ))}
                  </select>
                </div>

                {/* Language Filter */}
                <div>
                  <label className="text-[10px] font-bold text-vault-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M5 8l6 6" />
                      <path d="M4 14l6-6 2-3" />
                      <path d="M2 5h12" />
                      <path d="M7 2h1" />
                      <path d="m22 22-5-10-5 10" />
                      <path d="M14 18h6" />
                    </svg>
                    Language
                  </label>
                  <select
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="w-full bg-vault-card border border-white/10 rounded-xl px-3 py-2 text-xs text-vault-text focus:outline-none focus:ring-2 focus:ring-vault-accent/50 focus:border-vault-accent transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  >
                    {languages.map(l => (
                      <option key={l.code} value={l.code}>{l.name}</option>
                    ))}
                  </select>
                </div>

                {/* Category Filter */}
                <div>
                  <label className="text-[10px] font-bold text-vault-muted uppercase tracking-wider mb-1.5 block flex items-center gap-1.5">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="3" width="7" height="7" rx="1" />
                      <rect x="14" y="3" width="7" height="7" rx="1" />
                      <rect x="3" y="14" width="7" height="7" rx="1" />
                      <rect x="14" y="14" width="7" height="7" rx="1" />
                    </svg>
                    Category
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full bg-vault-card border border-white/10 rounded-xl px-3 py-2 text-xs text-vault-text focus:outline-none focus:ring-2 focus:ring-vault-accent/50 focus:border-vault-accent transition-all appearance-none cursor-pointer"
                    style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center' }}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                {/* Active Filters Indicator */}
                {(selectedLanguage || selectedCategory || selectedRegion !== "IN") && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {selectedRegion !== "IN" && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-vault-accent/10 text-vault-accent border border-vault-accent/20 font-medium">
                        {regions.find(r => r.code === selectedRegion)?.name}
                      </span>
                    )}
                    {selectedLanguage && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20 font-medium">
                        {languages.find(l => l.code === selectedLanguage)?.name}
                      </span>
                    )}
                    {selectedCategory && (
                      <span className="text-[9px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                        {categories.find(c => c.id === selectedCategory)?.name}
                      </span>
                    )}
                    <button
                      onClick={() => { setSelectedRegion("IN"); setSelectedLanguage(""); setSelectedCategory(""); }}
                      className="text-[9px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors font-medium"
                    >
                      ✕ Clear All
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-vault-accent/5 border border-vault-accent/10">
              <p className="text-xs text-vault-accent font-bold mb-2 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="12" y1="16" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12.01" y2="8" />
                </svg>
                Tip
              </p>
              <p className="text-[11px] text-vault-text-secondary leading-relaxed">
                Use filters to discover region-specific trending content in your preferred language!
              </p>
            </div>
          </aside>

          <div className="flex-1 min-w-0">
            <div className="mb-12">
              <h1 className="text-4xl font-black mb-4 tracking-tight">
                Explore <span className="text-gradient">Trending and Popular Content</span>
              </h1>
              <p className="text-vault-text-secondary max-w-2xl mb-3">
                Discover the latest trending videos updated daily. 
                One click to save them directly to your personal vault.
              </p>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-vault-accent/10 border border-vault-accent/20">
                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-xs font-semibold text-vault-accent">
                  Trending Today — {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                </span>
              </div>
            </div>

            <form onSubmit={handleSearch} className="max-w-2xl mb-16 relative">
              <div className="relative group">
                <input
                  type="text"
                  placeholder="Search for anything (e.g., Python Tutorial, Cinematic Vlog)..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full h-14 bg-vault-card border border-white/10 rounded-2xl pl-12 pr-32 text-vault-text focus:outline-none focus:ring-2 focus:ring-vault-accent/50 focus:border-vault-accent transition-all shadow-glow-sm"
                />
                <svg 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-vault-muted w-5 h-5 group-focus-within:text-vault-accent transition-colors" 
                  fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"
                >
                  <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                </svg>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="absolute right-2 top-2 bottom-2 px-6 bg-vault-accent text-white font-semibold rounded-xl hover:bg-vault-accent/90 transition-colors disabled:opacity-50"
                >
                  {isLoading ? "Searching..." : "Search"}
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 mt-4">
                <span className="text-xs text-vault-muted uppercase tracking-widest mr-2">Quick:</span>
                {["Python", "React", "Tech", "Vlogs", "Gaming"].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => { setQuery(tag); executeSearch(tag); }}
                    className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/5 hover:border-vault-accent/30 hover:bg-vault-accent/5 transition-all outline-none"
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </form>

            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-vault-accent/20 border-t-vault-accent rounded-full animate-spin" />
                <p className="text-vault-muted animate-pulse">Finding matching {activePlatform} content...</p>
              </div>
            ) : filteredResults.length > 0 ? (
              <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
                {filteredResults.map((video) => {
                  // All explore content comes from YouTube API, so always use YouTube URL
                  const videoUrl = `https://www.youtube.com/watch?v=${video.id}`;

                  return (
                    <div key={video.id} className="group glass rounded-2xl overflow-hidden card-hover animate-fade-in flex flex-col">
                      <a 
                        href={videoUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="relative overflow-hidden block aspect-video"
                      >
                        <img
                          src={video.snippet.thumbnails.high?.url || video.snippet.thumbnails.medium?.url}
                          alt={video.snippet.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        {/* Source badge - always YouTube since content comes from YouTube API */}
                        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
                          <div className="text-[10px] font-bold px-2 py-0.5 rounded uppercase border backdrop-blur-md bg-black/80 text-vault-youtube border-vault-youtube/30 flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                            </svg>
                            YouTube
                          </div>
                          {activePlatform !== "youtube" && (
                            <div className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase border backdrop-blur-md ${
                              activePlatform === "instagram" ? "bg-black/80 text-vault-instagram border-vault-instagram/30" :
                              "bg-black/80 text-blue-400 border-blue-500/30"
                            }`}>
                              {activePlatform === "instagram" ? "IG Style" : "FB Style"}
                            </div>
                          )}
                        </div>
                        
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60 group-hover:opacity-80 transition-opacity" />
                        
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 transform scale-90 group-hover:scale-100">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md bg-red-500/10 border-red-500/20">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                              <path d="M5 3l14 9-14 9V3z" />
                            </svg>
                          </div>
                        </div>
                      </a>
                      
                      <div className="p-3 flex flex-col flex-1 gap-2">
                        <a 
                          href={videoUrl} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-xs font-bold line-clamp-2 text-vault-text transition-colors block group-hover:text-vault-accent"
                        >
                          {video.snippet.title}
                        </a>

                        <p className="text-[10px] text-vault-muted truncate">
                          {video.snippet.channelTitle}
                        </p>

                        <div className="flex items-center justify-between mt-auto">
                          <span className="text-[9px] text-vault-muted bg-white/5 px-1.5 py-0.5 rounded-full">
                            {parseInt(video.statistics.viewCount || "0").toLocaleString()} views
                          </span>
                          
                          <button
                            onClick={() => addToVault(video)}
                            className={`p-1.5 rounded-lg transition-all ${
                              addedIds.has(video.id) ? "text-green-400 bg-green-400/10" :
                              "text-vault-accent hover:bg-vault-accent hover:text-white"
                            }`}
                          >
                            {addedIds.has(video.id) ? (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <polyline points="20 6 9 17 4 12" />
                              </svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (query || results.length > 0) && filteredResults.length === 0 && !isLoading ? (
               <div className="text-center py-20 flex flex-col items-center">
                <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mb-4 border border-red-500/20">
                  <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-vault-text">Content Restricted</h3>
                <p className="text-vault-muted text-sm max-w-xs mx-auto">
                  18+ content matched your search but is hidden due to your account age.
                </p>
                <div className="mt-6 px-4 py-2 rounded-full border border-vault-accent/30 bg-vault-accent/5 text-[10px] text-vault-accent font-black uppercase tracking-widest">
                   Adult Verification Required
                </div>
              </div>
            ) : query && !isLoading ? (
              <div className="text-center py-20">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
                  <svg className="w-8 h-8 text-vault-muted" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
                    <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-vault-text">No results found</h3>
                <p className="text-vault-muted text-sm">Try searching for something else!</p>
              </div>
            ) : (
              <div className="text-center py-20 opacity-30">
                <p className="text-vault-muted italic">Results will appear here...</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Auth Modals */}
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
        stats={{
          total: 0, // Simplified for explore
          categories: { Education: 0, Entertainment: 0, Skill: 0, Vlogs: 0, Other: 0 }
        }}
      />

      {isSuccess && (
        <div className="fixed bottom-6 right-6 z-[200] animate-slide-up">
          <div className="glass-strong border border-green-500/30 bg-green-500/5 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-glow-sm">
            <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-bold text-white">Saved Successfully!</p>
              <p className="text-xs text-green-400/80">Video added to your vault.</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
