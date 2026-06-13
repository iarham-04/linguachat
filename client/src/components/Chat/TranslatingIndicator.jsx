export default function TranslatingIndicator({ senderName }) {
  if (!senderName) return null;

  return (
    <div className="flex items-center gap-2 px-4 py-2 animate-fade-in">
      <div className="flex gap-1">
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" />
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
        <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
      </div>
      <span className="text-xs text-amber-400/80">
        Translating message from {senderName}...
      </span>
    </div>
  );
}
