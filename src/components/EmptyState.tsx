export default function EmptyState({ onAddVideo }: { onAddVideo: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 px-6 animate-fade-in">
      {/* Icon */}
      <div className="w-24 h-24 rounded-2xl bg-vault-card border border-vault-border flex items-center justify-center mb-6 animate-pulse_glow">
        <svg
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-vault-accent"
        >
          <rect x="2" y="6" width="20" height="12" rx="2" />
          <path d="m10 9 5 3-5 3z" />
        </svg>
      </div>

      <h2 className="text-2xl font-bold mb-2 text-gradient">
        Your Vault is Empty
      </h2>
      <p className="text-vault-text-secondary text-center max-w-md mb-8 leading-relaxed">
        Start building your personal content library. Save your favourite
        YouTube and Instagram videos to access them anytime.
      </p>

      <button onClick={onAddVideo} className="vault-btn-primary text-base px-6 py-3 flex items-center gap-2">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
        Add Your First Video
      </button>
    </div>
  );
}
