import { useState } from 'react';
import { getFlag, getLanguageName } from '../../utils/languages';

export default function MessageBubble({ message, currentUserId }) {
  const [showOriginal, setShowOriginal] = useState(false);
  const isOwn = message.isOwn;
  const flag = getFlag(message.senderLang);
  const langName = getLanguageName(message.senderLang);

  const time = new Date(message.timestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  // Check if the displayed text differs from original (i.e., was translated)
  const wasTranslated = !isOwn && message.translatedText !== message.originalText;

  return (
    <div className={`flex ${isOwn ? 'justify-end' : 'justify-start'} animate-slide-up`}>
      <div className={`max-w-[80%] sm:max-w-[70%] ${isOwn ? 'order-1' : 'order-1'}`}>
        {/* Sender info (only for others' messages) */}
        {!isOwn && (
          <div className="flex items-center gap-1.5 mb-1 ml-1">
            <span className="text-base leading-none">{flag}</span>
            <span className="text-xs font-medium text-surface-400">{message.senderName}</span>
            <span className="text-xs text-surface-600">· {langName}</span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={`relative rounded-2xl px-4 py-2.5 ${
            isOwn
              ? 'bg-gradient-to-br from-primary-600 to-violet-600 text-white rounded-tr-md'
              : 'bg-surface-800/80 border border-surface-700/40 text-surface-100 rounded-tl-md'
          }`}
        >
          {/* Message text */}
          <p className="text-[15px] leading-relaxed break-words whitespace-pre-wrap">
            {message.translatedText}
          </p>

          {/* Show original toggle */}
          {wasTranslated && (
            <div className="mt-1.5">
              <button
                onClick={() => setShowOriginal(!showOriginal)}
                className={`inline-flex items-center gap-1 text-xs transition-colors duration-150
                  ${isOwn 
                    ? 'text-white/60 hover:text-white/90' 
                    : 'text-surface-500 hover:text-surface-300'
                  }`}
                title={showOriginal ? 'Hide original' : 'Show original text'}
              >
                <span className="text-sm">🌐</span>
                <span>{showOriginal ? 'Hide original' : 'Show original'}</span>
              </button>

              {showOriginal && (
                <div
                  className={`mt-2 pt-2 border-t text-sm animate-fade-in ${
                    isOwn
                      ? 'border-white/20 text-white/70'
                      : 'border-surface-700/50 text-surface-400'
                  }`}
                >
                  <p className="italic break-words whitespace-pre-wrap">{message.originalText}</p>
                </div>
              )}
            </div>
          )}

          {/* Timestamp */}
          <div className={`flex items-center justify-end mt-1 ${
            isOwn ? 'text-white/50' : 'text-surface-600'
          }`}>
            <span className="text-[10px]">{time}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
