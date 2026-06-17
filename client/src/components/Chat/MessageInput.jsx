import { useState, useRef } from 'react';

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const inputRef = useRef(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!text.trim() || disabled) return;
    onSend(text.trim());
    setText('');
    
    // Ensure height resets on submit
    if (inputRef.current) {
      inputRef.current.style.height = '32px';
      inputRef.current.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 bg-[#252525] border-t border-[#2e2e2e]/40 select-none">
      {/* "+" button on the left */}
      <button
        type="button"
        className="flex-shrink-0 w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e]/40 hover:bg-[#1e1e1e] text-gray-400 hover:text-white flex items-center justify-center transition-colors active:scale-95 pb-0.5"
        title="Add attachment"
      >
        <span className="text-2xl font-light leading-none">+</span>
      </button>

      {/* Input container */}
      <div className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e]/40 rounded-xl px-2 py-1.5 flex items-center focus-within:border-[#333] transition-colors">
        <textarea
          id="message-input"
          ref={inputRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Type something..."
          disabled={disabled}
          rows={1}
          className="w-full px-2 py-1 bg-transparent text-white placeholder-gray-600 resize-none focus:outline-none text-base leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed scrollbar-hide"
          style={{ height: '32px', maxHeight: '100px' }}
          onInput={(e) => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px';
          }}
        />
      </div>

      {/* "Send" button on the far right */}
      <button
        id="send-button"
        type="submit"
        disabled={!text.trim() || disabled}
        className="flex-shrink-0 px-4 h-10 rounded-xl text-white hover:text-white hover:bg-[#1e1e1e] font-semibold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed"
      >
        Send
      </button>
    </form>
  );
}
