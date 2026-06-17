import { useState } from 'react';
import { getFlag, getLanguageName } from '../../utils/languages';

export default function MessageBubble({ message }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const isOwn = message.isOwn;
  const flag = getFlag(message.senderLang);
  const langName = getLanguageName(message.senderLang);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  const wasTranslated = !isOwn && message.translatedText !== message.originalText;
  const initials = message.senderName ? message.senderName.charAt(0).toUpperCase() : '?';

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
    <div className={`flex items-end gap-2.5 ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      
      {/* Received Message Avatar (Left) */}
      {!isOwn && (
        <div className="relative flex-shrink-0 mb-4 select-none">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(message.senderName)} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
            {initials}
          </div>
        </div>
      )}

      {/* Bubble + Text Box */}
      <div className={`flex flex-col max-w-[75%] sm:max-w-[65%] ${isOwn ? 'items-end' : 'items-start'}`}>
        
        {/* Sender Info for Received messages */}
        {!isOwn && (
          <span className="text-[10px] text-gray-500 font-semibold mb-1 ml-1 flex items-center gap-1.5 select-none">
            <span>{message.senderName}</span>
            <span className="text-[9px] text-gray-600 font-mono">[{message.senderLang.toUpperCase()}]</span>
            <span className="text-xs leading-none">{flag}</span>
          </span>
        )}

        {/* Message Bubble itself */}
        <div
          className={`rounded-2xl px-4 py-2 shadow-sm ${
            isOwn
              ? 'bg-[#333333] text-white rounded-tr-sm'
              : 'bg-[#2e2e2e] text-gray-200 rounded-tl-sm border border-[#333]/20'
          }`}
        >
          <p className="text-[14px] leading-relaxed break-words whitespace-pre-wrap">
            {message.translatedText}
          </p>

          {/* Show original button toggle */}
          {wasTranslated && (
            <div className="mt-2 flex flex-col items-start border-t border-[#3a3a3a] pt-1.5">
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
        <span className="text-[9px] text-gray-600 mt-1 select-none px-1">
          {time}
        </span>
      </div>

      {/* Sent Message Avatar (Right) */}
      {isOwn && (
        <div className="relative flex-shrink-0 mb-4 select-none">
          <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarGradient(message.senderName)} flex items-center justify-center text-white text-xs font-bold shadow-md`}>
            {initials}
          </div>
        </div>
      )}

    </div>
  );
}
