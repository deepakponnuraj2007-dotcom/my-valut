import { useState } from "react";
import { Profile } from "@/types/user";
import { calculateAge } from "@/utils/age";

interface CategoryStats {
  Education: number;
  Entertainment: number;
  Skill: number;
  Vlogs: number;
  Other: number;
}

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail: string | null;
  profile: Profile | null;
  onLogout: (clearData: boolean) => void;
  stats: {
    total: number;
    categories: CategoryStats;
  };
}

export default function ProfileModal({
  isOpen,
  onClose,
  userEmail,
  profile,
  onLogout,
  stats,
}: ProfileModalProps) {
  const [isConfirmingClear, setIsConfirmingClear] = useState(false);

  if (!isOpen || !userEmail) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  const displayName = profile?.full_name || userEmail.split("@")[0];
  const joinDate = profile?.created_at 
    ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : "Joined recently";
  const membershipStatus = profile?.is_premium ? "Premium Member" : "Standard Member";

  const settingsItems = [
    { id: 'account', label: 'Account', icon: <><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></> },
    { id: 'settings', label: 'Profile Settings', icon: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" /></> },
    { id: 'security', label: 'Security', icon: <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /> },
    { id: 'password', label: 'Change Password', icon: <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z" /> },
    { id: 'preferences', label: 'Preferences', icon: <><line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" /><line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" /><line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" /><line x1="1" y1="14" x2="7" y2="14" /><line x1="9" y1="8" x2="15" y2="8" /><line x1="17" y1="16" x2="23" y2="16" /></> },
    { id: 'vault', label: 'Manage Vault', icon: <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" /> },
  ];

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />

      <div className="relative w-full max-w-lg glass-strong rounded-[40px] shadow-glow-lg overflow-hidden animate-slide-up border border-white/10">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-white/40 hover:text-white hover:bg-white/10 transition-all z-20"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="p-10 relative">
          <div className="flex flex-col items-center mb-10">
            <h2 className="text-xl font-bold text-white mb-8 self-start">Profile & Settings</h2>
            
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-vault-accent to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
              <div className="relative w-32 h-32 rounded-full bg-vault-card border-4 border-[#0F172A] flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <span className="text-4xl font-bold text-gradient uppercase">
                    {userEmail[0]}
                  </span>
                )}
              </div>
            </div>

            <div className="mt-6 text-center">
              <h3 className="text-2xl font-black text-white tracking-tight uppercase">
                {displayName}
              </h3>
              <div className="flex items-center justify-center gap-2 mt-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  profile?.is_premium 
                  ? "bg-green-500/10 text-green-400 border-green-500/20" 
                  : "bg-vault-accent/10 text-vault-accent border-vault-accent/20"
                }`}>
                  {membershipStatus}
                </span>
                <span className="text-[10px] text-white/30 uppercase tracking-widest font-medium">
                  {joinDate}
                </span>
              </div>
            </div>

            {/* Account Details (DOB & Age) */}
            {profile?.date_of_birth && (
              <div className="mt-6 flex flex-col items-center animate-fade-in">
                <div className="px-4 py-2 rounded-2xl bg-white/5 border border-white/10 flex items-center gap-4">
                  <div className="text-left">
                    <div className="text-[9px] uppercase font-bold text-white/30 tracking-widest leading-none mb-1">Birth Date</div>
                    <div className="text-xs font-bold text-white/80">
                      {new Date(profile.date_of_birth).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
                    </div>
                  </div>
                  <div className="w-px h-6 bg-white/10" />
                  <div className="text-right">
                    <div className="text-[9px] uppercase font-bold text-white/30 tracking-widest leading-none mb-1">Status</div>
                    <div className={`text-[10px] font-black px-2 py-0.5 rounded-full ${calculateAge(profile.date_of_birth) >= 18 ? 'bg-green-500/20 text-green-400' : 'bg-vault-accent/20 text-vault-accent'}`}>
                      {calculateAge(profile.date_of_birth) >= 18 ? 'ADULT (18+)' : `MINOR (${calculateAge(profile.date_of_birth)})`}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4 mb-10">
            {settingsItems.map((item) => (
              <button
                key={item.id}
                className="flex items-center gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 hover:bg-white/10 hover:border-white/10 transition-all group"
              >
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white/50 group-hover:text-vault-accent group-hover:bg-vault-accent/10 transition-all">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {item.icon}
                  </svg>
                </div>
                <span className="text-sm font-semibold text-white/70 group-hover:text-white transition-colors text-left leading-tight">
                  {item.label}
                </span>
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em] mb-4 text-center">Logout Options</h4>
            {!isConfirmingClear ? (
              <div className="space-y-3">
                <button
                  onClick={() => onLogout(false)}
                  className="w-full h-16 flex flex-col items-center justify-center bg-vault-accent rounded-[24px] hover:bg-vault-accent/90 transition-all group shadow-glow shadow-vault-accent/20"
                >
                  <div className="flex items-center gap-2 text-white font-black text-base">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/>
                    </svg>
                    Log Out (Save Data)
                  </div>
                  <span className="text-[10px] text-white/60 font-medium">Saves app state and preferences</span>
                </button>
                <button
                  onClick={() => setIsConfirmingClear(true)}
                  className="w-full flex flex-col items-center gap-1 group py-2"
                >
                  <span className="text-red-500/80 group-hover:text-red-400 text-[11px] font-bold border-b border-red-500/30 group-hover:border-red-400 transition-all uppercase tracking-tighter">
                    Clear all data and log out
                  </span>
                  <span className="text-[9px] text-white/20 font-medium">Deletes all local files, history, and preferences permanently</span>
                </button>
              </div>
            ) : (
              <div className="bg-red-500/5 border border-red-500/20 rounded-[24px] p-6 animate-shake">
                <p className="text-[11px] text-red-400 font-black text-center mb-4 uppercase tracking-widest leading-relaxed">
                  Are you absolutely sure? This will permanently erase your vault data.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setIsConfirmingClear(false)}
                    className="flex-1 h-12 bg-white/5 hover:bg-white/10 text-white rounded-xl transition-all font-bold text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => onLogout(true)}
                    className="flex-1 h-12 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all font-bold text-sm shadow-glow shadow-red-500/20"
                  >
                    Wipe & Log Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
