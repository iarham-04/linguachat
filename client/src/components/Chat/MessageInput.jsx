import { useState, useRef, useEffect } from 'react';

const EMOJIS = ['😊', '😂', '❤️', '👍', '🔥', '🎉', '🚀', '😢', '😍', '🤔', '👏', '🙌', '😮', '😡', '🤫', '👀', '💯', '✨'];

export default function MessageInput({ onSend, disabled, editingMessage, onCancelEdit }) {
  const [text, setText] = useState('');
  const [showPicker, setShowPicker] = useState(false);
  const inputRef = useRef(null);
  const pickerRef = useRef(null);

  // File and Camera sharing states & refs
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCamera, setShowCamera] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [stream, setStream] = useState(null);
  const fileInputRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

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

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const limit = 5 * 1024 * 1024;
    if (file.size > limit) {
      alert('File size exceeds the 5MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target.result;
      const isImg = file.type.startsWith('image/');
      setSelectedFile({
        name: file.name,
        data: dataUrl,
        type: isImg ? 'image' : 'file',
        size: file.size,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const closeCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
    }
    setStream(null);
    setShowCamera(false);
    setCameraError('');
  };

  const captureSnapshot = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    context.translate(canvas.width, 0);
    context.scale(-1, 1);
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    context.setTransform(1, 0, 0, 1, 0, 0);

    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    setSelectedFile({
      name: `snapshot_${timestamp}.jpg`,
      data: dataUrl,
      type: 'image',
      size: Math.round(dataUrl.length * 0.75),
    });

    closeCamera();
  };

  useEffect(() => {
    let activeStream = null;
    if (showCamera) {
      setCameraError('');
      navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
        .then((s) => {
          activeStream = s;
          setStream(s);
          if (videoRef.current) {
            videoRef.current.srcObject = s;
          }
        })
        .catch((err) => {
          console.error('[Camera] Access failed:', err);
          setCameraError('Failed to access camera. Please check permissions.');
        });
    }

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [showCamera]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (disabled) return;
    if (!text.trim() && !selectedFile) return;

    onSend(text.trim(), selectedFile);
    setText('');
    setSelectedFile(null);
    
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
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

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

      {/* File Preview Ribbon */}
      {selectedFile && (
        <div className="px-4 py-3 bg-theme-sidebar border-t border-theme-divider flex justify-between items-center text-xs animate-slide-up relative">
          <div className="flex items-center gap-3 min-w-0">
            {selectedFile.type === 'image' ? (
              <img
                src={selectedFile.data}
                alt="Upload preview"
                className="w-12 h-12 rounded-lg object-cover border border-theme-divider bg-black/10"
              />
            ) : (
              <div className="w-12 h-12 rounded-lg bg-theme-panel border border-theme-divider flex items-center justify-center text-2xl flex-shrink-0">
                📄
              </div>
            )}
            <div className="min-w-0">
              <p className="font-semibold text-theme-primary truncate max-w-xs">{selectedFile.name}</p>
              <p className="text-[10px] text-theme-secondary font-mono">
                {Math.round(selectedFile.size / 1024)} KB · Ready to send
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSelectedFile(null)}
            className="w-8 h-8 rounded-full bg-theme-panel border border-theme-divider text-theme-secondary hover:text-red-400 flex items-center justify-center transition-colors cursor-pointer"
            title="Remove attachment"
          >
            ✕
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 p-2 sm:gap-3 sm:p-4 bg-theme-panel border-t border-theme-divider select-none relative">
        {/* Floating Emoji Picker Popover */}
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute left-2 right-2 bottom-14 sm:bottom-16 sm:left-4 sm:right-auto sm:w-[260px] bg-theme-sidebar border border-theme-divider rounded-xl p-3 shadow-2xl z-30 space-y-2 animate-slide-up"
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

        {/* Emoji Button */}
        <button
          type="button"
          onClick={() => setShowPicker(!showPicker)}
          className="emoji-toggle-btn flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-theme-sidebar border border-theme-divider hover:bg-theme-panel text-theme-secondary hover:text-theme-primary flex items-center justify-center transition-colors active:scale-95 pb-0.5 cursor-pointer"
          title="Add emoji"
        >
          <span className="text-lg sm:text-xl leading-none">😊</span>
        </button>

        {/* Camera Button */}
        <button
          type="button"
          onClick={() => setShowCamera(true)}
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-theme-sidebar border border-theme-divider hover:bg-theme-panel text-theme-secondary hover:text-theme-primary flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
          title="Take Photo"
        >
          <span className="text-lg sm:text-xl leading-none">📸</span>
        </button>

        {/* Attachment Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex-shrink-0 w-9 h-9 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-theme-sidebar border border-theme-divider hover:bg-theme-panel text-theme-secondary hover:text-theme-primary flex items-center justify-center transition-colors active:scale-95 cursor-pointer"
          title="Attach File"
        >
          <span className="text-lg sm:text-xl leading-none">📎</span>
        </button>

        {/* Input container */}
        <div className="flex-1 bg-theme-sidebar border border-theme-divider rounded-lg sm:rounded-xl px-1.5 py-1 sm:px-2 sm:py-1.5 flex items-center focus-within:border-theme-accent transition-colors">
          <textarea
            id="message-input"
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={selectedFile ? "Add..." : "Type..."}
            disabled={disabled}
            rows={1}
            className="w-full px-1.5 py-0.5 bg-transparent text-theme-primary placeholder-theme-secondary resize-none focus:outline-none text-base leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed scrollbar-hide"
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
          disabled={(!text.trim() && !selectedFile) || disabled}
          className="flex-shrink-0 px-3 sm:px-4 h-9 sm:h-10 rounded-lg sm:rounded-xl text-white bg-theme-accent hover:bg-theme-accent-hover font-semibold text-xs sm:text-sm transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[var(--theme-glow)]"
        >
          {editingMessage ? 'Save' : 'Send'}
        </button>
      </form>

      {/* Camera Snapshot Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg bg-theme-panel border border-theme-divider rounded-2xl p-6 relative flex flex-col items-center gap-4 animate-scale-up shadow-2xl">
            <h3 className="text-sm font-bold text-theme-primary text-center">Camera Snapshot</h3>
            
            <div className="w-full aspect-[4/3] rounded-xl bg-black border border-theme-divider overflow-hidden relative">
              {cameraError ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <span className="text-3xl mb-2">⚠️</span>
                  <p className="text-xs text-red-400 font-semibold">{cameraError}</p>
                </div>
              ) : (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover scale-x-[-1]"
                />
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-4 w-full justify-center">
              <button
                type="button"
                onClick={closeCamera}
                className="px-5 py-2.5 rounded-xl font-medium text-theme-secondary bg-theme-sidebar border border-theme-divider hover:bg-theme-panel transition-colors cursor-pointer text-xs"
              >
                Close
              </button>
              
              {!cameraError && (
                <button
                  type="button"
                  onClick={captureSnapshot}
                  className="px-5 py-2.5 rounded-xl font-bold text-white bg-theme-accent hover:bg-theme-accent-hover transition-colors shadow-md cursor-pointer text-xs flex items-center gap-1.5"
                >
                  📸 Capture
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
