import { useState, useRef, useEffect } from 'react';

const EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🚀', '😢', '😍', '🤔', '👏', '🙌', '😮', '😡', '🤫', '👀', '💯', '✨'];

export default function MessageInput({ onSend, disabled }) {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (pickerRef.current && !pickerRef.current.contains(event.target) && !event.target.closest('.emoji-toggle-btn')) {
        setShowPicker(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    setShowPicker(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleEmojiClick = (emoji) => {
    setText((prev) => prev + emoji);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 bg-[#252525] border-t border-[#2e2e2e]/40 select-none relative">
      {/* Floating Emoji Picker Popover */}
      {showPicker && (
        <div
          ref={pickerRef}
          className="absolute left-4 bottom-16 w-[260px] bg-[#1a1a1a] border border-[#2e2e2e] rounded-xl p-3 shadow-2xl z-30 space-y-2 animate-slide-up"
        >
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-bold text-gray-500 bg-transparent uppercase tracking-wider">Quick Emojis</span>
            <button
              type="button"
              onClick={() => setShowPicker(false)}
              className="text-gray-500 hover:text-white text-xs bg-transparent border-0 cursor-pointer"
            >
              ✕
            </button>
          </div>
          <div className="grid grid-cols-6 gap-2">
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => handleEmojiClick(emoji)}
                className="h-8 rounded-lg flex items-center justify-center text-lg hover:bg-[#252525] active:scale-90 transition-all duration-100 bg-transparent border-0 cursor-pointer text-white"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* "+" button on the left */}
      <button
        type="button"
        onClick={() => setShowPicker(!showPicker)}
        className="emoji-toggle-btn flex-shrink-0 w-10 h-10 rounded-xl bg-[#1a1a1a] border border-[#2e2e2e]/40 hover:bg-[#1e1e1e] text-gray-400 hover:text-white flex items-center justify-center transition-colors active:scale-95 pb-0.5"
        title="Add emoji"
      >
        <span className="text-2xl font-light leading-none">{showPicker ? '✕' : '+'}</span>
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
        className="flex-shrink-0 px-4 h-10 rounded-xl text-white hover:text-white hover:bg-[#1e1e1e] font-semibold text-sm transition-all active:scale-95 disabled:opacity-30 disabled:hover:bg-transparent disabled:cursor-not-allowed bg-transparent border-0"
      >
        Send
      </button>
    </form>
  );
}
