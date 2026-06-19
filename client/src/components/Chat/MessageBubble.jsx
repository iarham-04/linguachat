import { useState } from 'react';
import { getFlag, getLanguageName } from '../../utils/languages';
import { parseNameAndAvatar } from '../../utils/avatar';

export default function MessageBubble({ message, onEdit, onUnsend }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const [isOpenImage, setIsOpenImage] = useState(false);
  const isOwn = message.isOwn;
  const flag = getFlag(message.senderLang);
  const langName = getLanguageName(message.senderLang);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wasTranslated = !isOwn && message.translatedText !== message.originalText;
  const { name: cleanName, avatar: parsedAvatar } = parseNameAndAvatar(message.senderName);
  const avatarContent = message.senderAvatar || parsedAvatar || '?';
  const isEmojiAvatar = avatarContent.length > 1 || avatarContent.charCodeAt(0) > 127;
  
  const elapsed = Date.now() - message.timestamp;
  const isTextMessage = !message.messageType || message.messageType === 'text';
  const canModify = isOwn && (elapsed < 120000); // 2 minutes

  const getAvatarGradient = (name) => {
    if (!name) return 'from-gray-600 to-gray-700';
    const gradients = [
      'from-purple-600 to-indigo-600',
      'from-teal-600 to-emerald-600',
      'from-blue-600 to-cyan-600',
      'from-pink-600 to-rose-600',
      'from-orange-600 to-amber-600'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return gradients[Math.abs(hash) % gradients.length];
  };

  return (
    <div className={`flex items-end gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up group`}>
      
      {/* Received Message Avatar (Left) */}
      {!isOwn && (
        <div className="relative flex-shrink-0 mb-4 select-none">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(cleanName)} flex items-center justify-center text-white font-bold shadow-md ${
            isEmojiAvatar ? 'text-lg pt-0.5' : 'text-xs'
          }`}>
            {avatarContent}
          </div>
        </div>
      )}

      {/* Bubble + Text Box */}
      <div className={`flex flex-col max-w-[85%] md:max-w-[70%] ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Info for Received messages */}
        {!isOwn && (
          <span className="text-[10px] text-theme-secondary font-semibold mb-1 ml-1 flex items-center gap-1.5 select-none">
            <span>{cleanName}</span>
            <span className="text-[9px] text-theme-secondary font-mono">[{message.senderLang.toUpperCase()}]</span>
            <span className="text-xs leading-none">{flag}</span>
          </span>
        )}

        {/* Message Bubble itself */}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isOwn
              ? 'bg-theme-bubble-own text-[var(--theme-bubble-own-text)] rounded-tr-sm'
              : 'bg-theme-bubble-other text-[var(--theme-bubble-other-text)] rounded-tl-sm border border-theme-divider'
          }`}
        >
          {message.messageType === 'image' ? (
            <div className="my-1 max-w-sm rounded-xl overflow-hidden cursor-pointer hover:opacity-95 transition-opacity" onClick={() => setIsOpenImage(true)}>
              <img
                src={message.translatedText}
                alt={message.fileName || "Shared Image"}
                className="max-h-60 rounded-xl object-contain bg-black/10 border border-theme-divider"
              />
            </div>
          ) : message.messageType === 'file' ? (
            <div className="my-1 flex items-center gap-3 bg-theme-sidebar border border-theme-divider rounded-xl p-3 max-w-xs select-none">
              <div className="w-10 h-10 rounded-lg bg-theme-panel border border-theme-divider flex items-center justify-center text-xl flex-shrink-0">
                📄
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-theme-primary truncate" title={message.fileName}>
                  {message.fileName || 'Shared File'}
                </p>
                <a
                  href={message.translatedText}
                  download={message.fileName || 'file'}
                  className="inline-block mt-1 text-[10px] font-semibold text-theme-accent hover:underline"
                >
                  Download
                </a>
              </div>
            </div>
          ) : (
            <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
              {message.translatedText}
            </p>
          )}

          {/* Show original button toggle */}
          {wasTranslated && isTextMessage && (
            <div className="mt-2 flex flex-col items-start border-t border-theme-divider pt-1.5">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="inline-flex items-center gap-1 text-[10px] text-theme-secondary hover:text-theme-primary transition-colors"
                title={showOriginal ? 'Hide original' : 'Show original text'}
              >
                <span>🌐</span>
                <span>{showOriginal ? 'Hide original' : 'Show original'}</span>
              </button>

              {showOriginal && (
                <p className="mt-1 text-xs text-theme-secondary italic break-words whitespace-pre-wrap leading-relaxed">
                  {message.originalText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[9px] text-theme-secondary mt-1 select-none px-1 flex items-center gap-1.5">
          <span>{time}</span>
          {message.isEdited && <span className="text-theme-secondary font-normal italic select-none">(edited)</span>}
        </span>
      </div>

      {isOwn && canModify && (
        <div className="flex gap-1 opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-center mr-1.5 flex-shrink-0 select-none">
          {isTextMessage && (
            <button
              onClick={() => onEdit(message.id, message.originalText)}
              className="p-1.5 rounded-lg bg-theme-sidebar hover:bg-theme-bubble-own border border-theme-divider text-theme-secondary hover:text-theme-primary text-[11px] cursor-pointer active:scale-90 transition-all"
              title="Edit message"
            >
              ✏️
            </button>
          )}
          <button
            onClick={() => onUnsend(message.id)}
            className="p-1.5 rounded-lg bg-theme-sidebar hover:bg-red-950/20 border border-theme-divider text-theme-secondary hover:text-red-400 text-[11px] cursor-pointer active:scale-90 transition-all"
            title="Unsend message"
          >
            🗑️
          </button>
        </div>
      )}

      {/* Sent Message Avatar (Right) */}
      {isOwn && (
        <div className="relative flex-shrink-0 mb-4 select-none">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(cleanName)} flex items-center justify-center text-white font-bold shadow-md ${
            isEmojiAvatar ? 'text-lg pt-0.5' : 'text-xs'
          }`}>
            {avatarContent}
          </div>
        </div>
      )}

      {/* Lightbox image overlay modal */}
      {isOpenImage && (
        <div
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 cursor-pointer animate-fade-in select-none"
          onClick={() => setIsOpenImage(false)}
        >
          <div className="relative max-w-4xl max-h-[90vh] flex flex-col items-center">
            <img
              src={message.translatedText}
              alt={message.fileName || "Preview"}
              className="max-w-full max-h-[80vh] rounded-lg object-contain shadow-2xl animate-scale-up"
            />
            {message.fileName && (
              <span className="mt-4 text-xs font-semibold text-white/80 bg-black/40 px-3 py-1 rounded-full">
                {message.fileName}
              </span>
            )}
            <button
              onClick={() => setIsOpenImage(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/40 text-white flex items-center justify-center hover:bg-black/60 transition-colors text-xl font-bold cursor-pointer border-0"
            >
              ✕
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
