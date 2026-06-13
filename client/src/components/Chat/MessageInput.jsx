import { useState, useRef } from 'react';

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    inputRef.current?.focus();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-end gap-2 p-4 bg-surface-900/90 border-t border-surface-800/80 backdrop-blur-xl">
      <div className="flex-1 relative">
        <textarea
          id="message-input"
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          disabled={disabled}
          rows={1}
          className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700/40 
                     text-white placeholder-surface-500 resize-none
                     focus:outline-none focus:ring-2 focus:ring-primary-500/40 focus:border-primary-500/40
                     transition-all duration-200 text-[15px] leading-relaxed
                     disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ maxHeight: '120px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
      </div>
      <button
        id="send-button"
        type="submit"
        disabled={!text.trim() || disabled}
        className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-primary-600 to-violet-600 
                   text-white flex items-center justify-center
                   hover:from-primary-500 hover:to-violet-500
                   disabled:opacity-40 disabled:cursor-not-allowed
                   transform hover:scale-105 active:scale-95
                   transition-all duration-200 shadow-lg shadow-primary-500/20"
        title="Send message"
      >
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
          <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
        </svg>
      </button>
    </form>
  );
}
