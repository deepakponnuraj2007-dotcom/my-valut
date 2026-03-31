"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type ViewState = "selection" | "login" | "signup";

export default function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [view, setView] = useState<ViewState>("selection");
  const [email, setEmail] = useState("");
  const 
  [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const DEFAULT_PASSWORD = "vault_user_password_2024"; // Hardcoded for email-only experience

  if (!isOpen) return null;

  const handleReset = () => {
    setView("selection");
    setEmail("");
    setErrorMsg("");
  };

  const handleClose = () => {
    handleReset();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg("");

    if (view === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password: DEFAULT_PASSWORD,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        handleClose();
      }
    } else if (view === "signup") {
      const { error } = await supabase.auth.signUp({
        email,
        password: DEFAULT_PASSWORD,
      });

      if (error) {
        setErrorMsg(error.message);
      } else {
        // If "Confirm email" is disabled in Supabase, the user is logged in automatically.
        handleClose();
      }
    }

    setIsLoading(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-sm glass-strong rounded-2xl shadow-glow-lg animate-slide-up overflow-hidden">
        <div className="h-1 bg-accent-gradient" />

        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gradient">
              {view === "selection"
                ? "Get Started"
                : view === "login"
                ? "Login"
                : "Create New Account"}
            </h2>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-lg text-vault-muted hover:text-vault-text hover:bg-vault-card transition-colors"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {view === "selection" ? (
            <div className="space-y-4 py-4">
              <button
                onClick={() => setView("signup")}
                className="w-full vault-btn-primary py-4 text-base tracking-wide flex flex-col items-center gap-1 group overflow-hidden relative"
              >
                <span className="relative z-10">Create New Account</span>
                <span className="text-[10px] opacity-70 font-normal uppercase z-10">For new users</span>
                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              </button>
              
              <button
                onClick={() => setView("login")}
                className="w-full vault-btn-ghost py-4 text-base tracking-wide flex flex-col items-center gap-1 group relative bg-white/5 border-white/10 hover:border-vault-accent/30"
              >
                <span>Already Login Account</span>
                <span className="text-[10px] opacity-70 font-normal uppercase">Sign in to your vault</span>
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="animate-fade-in">
                  <button 
                    type="button"
                    onClick={() => setView("selection")}
                    className="flex items-center gap-1 text-[10px] uppercase font-bold text-vault-muted hover:text-vault-accent mb-4 transition-colors"
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
                      <path d="m15 18-6-6 6-6"/>
                    </svg>
                    Back to selection
                  </button>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-vault-muted mb-2">
                      {view === "login" ? "Email Address" : "New Account Email"}
                    </label>
                    <input
                      type="email"
                      required
                      autoFocus
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@gmail.com"
                      className="vault-input"
                    />
                  </div>
                </div>

              {errorMsg && (
              <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20 text-center">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full vault-btn-primary disabled:opacity-50 disabled:cursor-not-allowed justify-center mt-2"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" className="opacity-25" />
                    <path d="M4 12a8 8 0 0 1 8-8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" className="opacity-75" />
                  </svg>
                  Processing…
                </span>
              ) : view === "login" ? (
                "Login to Vault"
              ) : (
                "Create Account"
              )}
            </button>
          </form>
          )}
        </div>
      </div>
    </div>
  );
}
