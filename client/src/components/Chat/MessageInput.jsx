import { useState, useRef, useEffect } from 'react';

const EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🚀', '😢', '😍', '🤔', '👏', '🙌', '😮', '😡', '🤫', '👀', '💯', '✨'];

export default function MessageInput({ onSend, disabled, editingMessage, onCancelEdit }) {
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

  // Update input text and height when editing message changes
  useEffect(() => {
    if (editingMessage) {
      setText(editingMessage.text);
      if (inputRef.current) {
        inputRef.current.style.height = 'auto';
        inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 100) + 'px';
        inputRef.current.focus();
      }
    } else {
      setText('');
      if (inputRef.current) {
        inputRef.current.style.height = '32px';
      }
    }
  }, [editingMessage]);

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
    <div className="w-full relative flex flex-col">
      {/* Editing message ribbon */}
      {editingMessage && (
        <div className="px-4 py-2 bg-theme-sidebar border-t border-theme-divider flex justify-between items-center text-xs text-theme-secondary select-none animate-slide-up">
          <span className="truncate flex items-center gap-1.5">
            <span>✏️</span>
            <span>Editing message...</span>
          </span>
          <button
            type="button"
            onClick={onCancelEdit}
            className="text-theme-accent hover:text-theme-primary font-semibold cursor-pointer bg-transparent border-0"
          >
            Cancel
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-3 p-4 bg-theme-panel border-t border-theme-divider select-none relative">
        {/* Floating Emoji Picker Popover */}
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute left-2 right-2 bottom-16 sm:left-4 sm:right-auto sm:w-[260px] bg-theme-sidebar border border-theme-divider rounded-xl p-3 shadow-2xl z-30 space-y-2 animate-slide-up"
          >
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-bold text-theme-secondary bg-transparent uppercase tracking-wider">Quick Emojis</span>
              <button
                type="button"
                onClick={() => setShowPicker(false)}
                className="text-theme-secondary hover:text-theme-primary text-xs bg-transparent border-0 cursor-pointer"
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
                  className="h-8 rounded-lg flex items-center justify-center text-lg hover:bg-theme-panel active:scale-90 transition-all duration-100 bg-transparent border-0 cursor-pointer text-theme-primary"
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
          className="emoji-toggle-btn flex-shrink-0 w-10 h-10 rounded-xl bg-theme-sidebar border border-theme-divider hover:bg-theme-panel text-theme-secondary hover:text-theme-primary flex items-center justify-center transition-colors active:scale-95 pb-0.5"
          title="Add emoji"
        >
          <span className="text-2xl font-light leading-none">{showPicker ? '✕' : '+'}</span>
        </button>

        {/* Input container */}
        <div className="flex-1 bg-theme-sidebar border border-theme-divider rounded-xl px-2 py-1.5 flex items-center focus-within:border-theme-accent transition-colors">
          <textarea
            id="message-input"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type something..."
            disabled={disabled}
            rows={1}
            className="w-full px-2 py-1 bg-transparent text-theme-primary placeholder-theme-secondary resize-none focus:outline-none text-base leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed scrollbar-hide"
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
          className="flex-shrink-0 px-4 h-10 rounded-xl text-white bg-theme-accent hover:bg-theme-accent-hover font-semibold text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[var(--theme-glow)]"
        >
          {editingMessage ? 'Save' : 'Send'}
        </button>
      </form>
    </div>
  );
}
