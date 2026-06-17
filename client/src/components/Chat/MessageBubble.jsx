import { useState } from 'react';
import { getFlag, getLanguageName } from '../../utils/languages';
import { parseNameAndAvatar } from '../../utils/avatar';

export default function MessageBubble({ message, onEdit, onUnsend }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const isOwn = message.isOwn;
  const flag = getFlag(message.senderLang);
  const langName = getLanguageName(message.senderLang);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wasTranslated = !isOwn && message.translatedText !== message.originalText;
  const { name: cleanName, avatar: parsedAvatar } = parseNameAndAvatar(message.senderName);
  const avatarContent = parsedAvatar || '?';
  const isEmojiAvatar = avatarContent.length > 1 || avatarContent.charCodeAt(0) > 127;
  
  const elapsed = Date.now() - message.timestamp;
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
          <span className="text-[10px] text-gray-500 font-semibold mb-1 ml-1 flex items-center gap-1.5 select-none">
            <span>{cleanName}</span>
            <span className="text-[9px] text-gray-600 font-mono">[{message.senderLang.toUpperCase()}]</span>
            <span className="text-xs leading-none">{flag}</span>
          </span>
        )}

        {/* Message Bubble itself */}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isOwn
              ? 'bg-theme-bubble-own text-white rounded-tr-sm'
              : 'bg-theme-bubble-other text-gray-200 rounded-tl-sm border border-theme-divider'
          }`}
        >
          <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
            {message.translatedText}
          </p>

          {/* Show original button toggle */}
          {wasTranslated && (
            <div className="mt-2 flex flex-col items-start border-t border-theme-divider pt-1.5">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className="inline-flex items-center gap-1 text-[10px] text-gray-500 hover:text-white transition-colors"
                title={showOriginal ? 'Hide original' : 'Show original text'}
              >
                <span>🌐</span>
                <span>{showOriginal ? 'Hide original' : 'Show original'}</span>
              </button>

              {showOriginal && (
                <p className="mt-1 text-xs text-gray-500 italic break-words whitespace-pre-wrap leading-relaxed">
                  {message.originalText}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[9px] text-gray-600 mt-1 select-none px-1 flex items-center gap-1.5">
          <span>{time}</span>
          {message.isEdited && <span className="text-gray-500 font-normal italic select-none">(edited)</span>}
        </span>
      </div>

      {isOwn && canModify && (
        <div className="flex gap-1 opacity-60 hover:opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-center mr-1.5 flex-shrink-0 select-none">
          <button
            onClick={() => onEdit(message.id, message.originalText)}
            className="p-1.5 rounded-lg bg-theme-sidebar hover:bg-theme-bubble-own border border-theme-divider text-gray-400 hover:text-white text-[11px] cursor-pointer active:scale-90 transition-all"
            title="Edit message"
          >
            ✏️
          </button>
          <button
            onClick={() => onUnsend(message.id)}
            className="p-1.5 rounded-lg bg-theme-sidebar hover:bg-red-950/20 border border-theme-divider text-gray-400 hover:text-red-400 text-[11px] cursor-pointer active:scale-90 transition-all"
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

    </div>
  );
}
