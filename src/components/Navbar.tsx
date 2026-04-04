"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

interface NavbarProps {
  onAddVideo: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  userEmail: string | null;
  onLoginClick: () => void;
  onProfileClick: () => void;
  onMenuClick?: () => void; // New prop for mobile menu
}

export default function Navbar({
  onAddVideo,
  searchQuery,
  onSearchChange,
  userEmail,
  onLoginClick,
  onProfileClick,
  onMenuClick,
}: NavbarProps) {
  const avatarLetter = userEmail ? userEmail[0].toUpperCase() : "";
  const [isFocused, setIsFocused] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-strong">
      <div className="max-w-[1600px] mx-auto px-6 h-16 flex items-center justify-between gap-6">
        {/* Left Side: Burger + Back + Logo */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button 
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-white/5 text-vault-text-secondary active:scale-95 transition-all outline-none"
            aria-label="Toggle Menu"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" />
            </svg>
          </button>

          {pathname !== '/' && (
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-white/5 text-vault-muted hover:text-white active:scale-95 transition-all outline-none flex items-center gap-1"
              aria-label="Go Back"
              title="Go Back"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
            </button>
          )}

          <Link href="/" className="flex items-center gap-3 shrink-0 hover:opacity-80 transition-opacity">
            <div className="w-9 h-9 rounded-lg bg-accent-gradient flex items-center justify-center shadow-glow">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="m10 9 5 3-5 3z" />
              </svg>
            </div>
            <h1 className="text-lg font-bold tracking-tight hidden sm:block">
              <span className="text-gradient">Content</span>
              <span className="text-vault-text-secondary ml-1">Vault</span>
            </h1>
          </Link>
        </div>

        {/* Search - Show on all, scale down on mobile */}
        <div className="flex-1 max-w-xl relative flex items-center h-full">
          <div className={`relative w-full transition-all duration-300 ${isFocused ? "scale-[1.02]" : ""}`}>
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 text-vault-muted w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              className="vault-input pl-10 pr-4 py-2 h-10 text-sm"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          {userEmail ? (
            <button
              onClick={onProfileClick}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full flex items-center justify-center bg-vault-card border border-vault-accent/30 text-vault-accent font-bold hover:shadow-glow hover:border-vault-accent transition-all duration-300 ring-2 ring-transparent hover:ring-vault-accent/20"
              title="View Profile"
            >
              {avatarLetter}
            </button>
          ) : (
            <button onClick={onLoginClick} className="vault-btn-ghost flex items-center gap-2 px-3 sm:px-4">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 0 1 2-2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3" />
              </svg>
              <span className="hidden xs:inline">Login</span>
            </button>
          )}

        </div>
      </div>
    </nav>
  );
}
