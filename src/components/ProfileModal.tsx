import { useState, useRef, useEffect } from "react";
import { Profile } from "@/types/user";
import { calculateAge } from "@/utils/age";
import { supabase } from "@/lib/supabaseClient";

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
  
  // Navigation State
  const [activeView, setActiveView] = useState<'main' | 'verify_settings' | 'settings' | 'change_password'>('main');

  // Verify Settings State
  const [verifyPassword, setVerifyPassword] = useState("");
  const [verifyError, setVerifyError] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);

  // Profile Settings State
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Change Password State
  const [cpEmail, setCpEmail] = useState("");
  const [cpNewPassword, setCpNewPassword] = useState("");
  const [cpError, setCpError] = useState("");
  const [cpSuccess, setCpSuccess] = useState("");
  const [emailMatched, setEmailMatched] = useState(false);
  const [isCpLoading, setIsCpLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setActiveView('main');
      setVerifyPassword('');
      setVerifyError('');
      setCpEmail('');
      setCpNewPassword('');
      setCpError('');
      setCpSuccess('');
      setEmailMatched(false);
      setIsConfirmingClear(false);
    }
  }, [isOpen]);

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

  const handleMenuClick = (id: string) => {
    if (id === 'settings') {
      setActiveView('verify_settings');
    } else if (id === 'password') {
      setActiveView('change_password');
    }
  };

  const handleVerifyPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyPassword) return;
    
    setIsVerifying(true);
    setVerifyError("");
    
    const { error } = await supabase.auth.signInWithPassword({
      email: userEmail!,
      password: verifyPassword
    });

    if (error) {
      setVerifyError("Incorrect password. Please try again.");
    } else {
      setActiveView('settings');
      setVerifyPassword('');
    }
    setIsVerifying(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert("Image must be less than 2MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsUploading(true);
      
      if (profile?.id) {
        const { error } = await supabase
          .from('profiles')
          .update({ avatar_url: base64String })
          .eq('id', profile.id);

        if (!error) {
          window.location.reload(); 
        } else {
          alert("Failed to update profile image.");
        }
      }
      setIsUploading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleCheckEmail = (e: React.FormEvent) => {
    e.preventDefault();
    setCpError("");
    if (cpEmail.trim().toLowerCase() === userEmail?.toLowerCase()) {
      setEmailMatched(true);
    } else {
      setCpError("Email does not match your account correctly.");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cpNewPassword) return;
    if (cpNewPassword.length < 6) {
      setCpError("Password must be at least 6 characters.");
      return;
    }

    setIsCpLoading(true);
    setCpError("");
    setCpSuccess("");

    const { error } = await supabase.auth.updateUser({ password: cpNewPassword });
    
    if (error) {
      setCpError(error.message);
    } else {
      setCpSuccess("Password updated successfully!");
      setTimeout(() => {
        setActiveView('main');
        setCpEmail('');
        setCpNewPassword('');
        setEmailMatched(false);
        setCpSuccess('');
      }, 2000);
    }
    setIsCpLoading(false);
  };

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

        <div className="p-10 relative min-h-[500px] flex flex-col justify-center">
          
          {/* ----- MAIN VIEW ----- */}
          {activeView === 'main' && (
            <div className="animate-fade-in">
              <div className="flex flex-col items-center mb-10">
                <h2 className="text-xl font-bold text-white mb-8 self-start">Profile & Settings</h2>
                
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-vault-accent to-purple-600 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000"></div>
                  <div className="relative w-32 h-32 rounded-full bg-vault-card border-4 border-[#0F172A] flex items-center justify-center overflow-hidden">
                    {profile?.avatar_url ? (
                      <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-4xl font-bold text-gradient uppercase">
                        {userEmail![0]}
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
                    onClick={() => handleMenuClick(item.id)}
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
          )}

          {/* ----- VERIFY SETTINGS VIEW ----- */}
          {activeView === 'verify_settings' && (
            <div className="flex flex-col h-full justify-center animate-slide-up">
              <button 
                onClick={() => { setActiveView('main'); setVerifyError(''); setVerifyPassword(''); }}
                className="self-start mb-6 text-white/40 hover:text-white flex items-center gap-2 transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>
              
              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-vault-accent/10 text-vault-accent rounded-full flex items-center justify-center mb-4 border border-vault-accent/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Security Check</h2>
                <p className="text-white/40 text-sm mt-2">Enter your password to access profile settings.</p>
              </div>

              <form onSubmit={handleVerifyPassword} className="space-y-4 flex flex-col">
                <div>
                  <input
                    type="password"
                    placeholder="Enter current password"
                    value={verifyPassword}
                    onChange={(e) => {
                      setVerifyPassword(e.target.value);
                      if (verifyError) setVerifyError("");
                    }}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-vault-accent focus:bg-vault-accent/5 transition-all text-center text-lg tracking-widest"
                    autoFocus
                  />
                  {verifyError && (
                    <p className="text-red-400 text-xs font-bold text-center mt-3 uppercase animate-shake">{verifyError}</p>
                  )}
                </div>
                <button
                  type="submit"
                  disabled={isVerifying || !verifyPassword}
                  className="w-full h-14 bg-vault-accent text-white font-black rounded-2xl hover:bg-vault-accent/90 transition-all uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed shadow-glow shadow-vault-accent/20 mt-4"
                >
                  {isVerifying ? "Verifying..." : "Access Settings"}
                </button>
              </form>
            </div>
          )}

          {/* ----- ACTUAL SETTINGS VIEW ----- */}
          {activeView === 'settings' && (
            <div className="flex flex-col h-full animate-slide-up">
              <div className="flex items-center justify-between mb-8">
                <button 
                  onClick={() => setActiveView('main')}
                  className="text-white/40 hover:text-white flex items-center gap-2 transition-colors text-xs font-bold uppercase tracking-widest"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                    <path d="M19 12H5M12 19l-7-7 7-7"/>
                  </svg>
                  Back
                </button>
                <h2 className="text-lg font-black text-white uppercase tracking-wider">Profile Settings</h2>
              </div>
              
              <div className="space-y-8 flex-1">
                {/* Profile Image Section */}
                <div className="flex flex-col items-center">
                  <div className="relative group mb-4">
                    <div className="w-24 h-24 rounded-full bg-vault-card border-2 border-white/10 flex items-center justify-center overflow-hidden">
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl font-bold text-gradient uppercase">
                          {userEmail![0]}
                        </span>
                      )}
                      
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
                        <button 
                          onClick={() => fileInputRef.current?.click()}
                          className="text-xs font-bold uppercase tracking-widest text-white hover:text-vault-accent transition-colors"
                          disabled={isUploading}
                        >
                          {isUploading ? "..." : "Change"}
                        </button>
                      </div>
                    </div>
                  </div>
                  <input 
                    type="file" 
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handleImageUpload}
                    className="hidden" 
                  />
                  <p className="text-xs text-white/30 uppercase tracking-widest">Profile Photo</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-[10px] text-white/40 uppercase tracking-widest font-bold ml-4 mb-2 block">Registered Email</label>
                    <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white/80 flex items-center gap-4">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="text-white/30">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline>
                      </svg>
                      {userEmail}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ----- CHANGE PASSWORD VIEW ----- */}
          {activeView === 'change_password' && (
            <div className="flex flex-col h-full justify-center animate-slide-up">
              <button 
                onClick={() => { setActiveView('main'); setCpError(''); setCpSuccess(''); setEmailMatched(false); setCpEmail(''); setCpNewPassword(''); }}
                className="self-start mb-6 text-white/40 hover:text-white flex items-center gap-2 transition-colors text-sm font-bold uppercase tracking-widest"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                  <path d="M19 12H5M12 19l-7-7 7-7"/>
                </svg>
                Back
              </button>

              <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-vault-accent/10 text-vault-accent rounded-full flex items-center justify-center mb-4 border border-vault-accent/20">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3L15.5 7.5z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Change Password</h2>
                <p className="text-white/40 text-sm mt-2">
                  {!emailMatched ? "Verify your email to continue." : "Enter your new desired password."}
                </p>
              </div>

              {!emailMatched ? (
                <form onSubmit={handleCheckEmail} className="space-y-4">
                  <div>
                    <input
                      type="email"
                      placeholder="Type your current email"
                      value={cpEmail}
                      onChange={(e) => setCpEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-vault-accent focus:bg-vault-accent/5 transition-all text-center text-sm tracking-widest"
                      autoFocus
                    />
                  </div>
                  {cpError && <p className="text-red-400 text-xs font-bold text-center uppercase animate-shake">{cpError}</p>}
                  
                  <button
                    type="submit"
                    disabled={!cpEmail}
                    className="w-full h-14 bg-white/5 border border-white/10 text-white font-black rounded-2xl hover:bg-white/10 transition-all uppercase tracking-widest disabled:opacity-50 mt-4"
                  >
                    Continue
                  </button>
                </form>
              ) : (
                <form onSubmit={handleChangePassword} className="space-y-4 animate-fade-in">
                  <div>
                    <input
                      type="password"
                      placeholder="Enter new password"
                      value={cpNewPassword}
                      onChange={(e) => setCpNewPassword(e.target.value)}
                      className="w-full bg-white/5 border-vault-accent/50 border rounded-2xl px-6 py-4 text-white placeholder:text-white/20 focus:outline-none focus:border-vault-accent focus:bg-vault-accent/5 transition-all text-center text-lg tracking-widest shadow-glow shadow-vault-accent/10"
                      autoFocus
                    />
                  </div>
                  {cpError && <p className="text-red-400 text-xs font-bold text-center uppercase animate-shake">{cpError}</p>}
                  {cpSuccess && <p className="text-green-400 text-xs font-bold text-center uppercase">{cpSuccess}</p>}
                  
                  <button
                    type="submit"
                    disabled={isCpLoading || !cpNewPassword}
                    className="w-full h-14 bg-vault-accent text-white font-black rounded-2xl hover:bg-vault-accent/90 transition-all uppercase tracking-widest disabled:opacity-50 mt-4 shadow-glow shadow-vault-accent/20"
                  >
                    {isCpLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
