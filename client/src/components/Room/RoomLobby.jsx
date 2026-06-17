import { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../contexts/UserContext';

export default function RoomLobby() {
  const { socket } = useSocket();
  const { user, joinRoom } = useUser();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');

  const handleCreateRoom = () => {
    if (!socket) return;
    setLoading(true);
    setError('');

    socket.emit('create-room', {
      userName: user.name,
      userLang: user.lang,
    }, (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
      } else {
        setCreatedCode(response.roomCode);
        joinRoom(response.roomCode);
      }
    });
  };

  const handleJoinRoom = (e) => {
    e.preventDefault();
    if (!socket || !roomInput.trim()) return;
    setLoading(true);
    setError('');

    socket.emit('join-room', {
      roomCode: roomInput.trim().toUpperCase(),
      userName: user.name,
      userLang: user.lang,
    }, (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
      } else {
        joinRoom(response.roomCode);
      }
    });
  };

  const copyCode = () => {
    navigator.clipboard.writeText(createdCode);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-theme-outer p-4 overflow-y-auto">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[var(--theme-accent)]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#f0c040]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10 py-6">
        {/* Header */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-theme-sidebar mb-3 border border-theme-divider shadow-lg">
            <span className="text-3xl">💬</span>
          </div>
          <h2 className="text-2xl font-bold text-theme-primary">
            Welcome, <span className="font-extrabold">{user?.name}</span>
          </h2>
          {/* Gold/Yellow Underline Accent */}
          <div className="w-10 h-[3px] bg-[#f0c040] rounded mt-2.5 mb-2.5" />
          <p className="text-theme-secondary text-xs mt-1">Create a new room or join an existing one</p>
        </div>

        {/* Mode Selection */}
        {!mode && (
          <div className="space-y-4 animate-fade-in">
            <button
              id="create-room-btn"
              onClick={() => { setMode('create'); handleCreateRoom(); }}
              className="w-full bg-theme-panel border border-theme-divider rounded-2xl p-5 text-left hover:bg-theme-sidebar 
                         transition-all duration-200 group cursor-pointer shadow-xl hover:border-theme-accent-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--theme-accent)] to-[var(--theme-accent-hover)] 
                                flex items-center justify-center text-2xl shadow-lg shadow-[var(--theme-glow)]
                                group-hover:scale-105 transition-transform">
                  ✨
                </div>
                <div>
                  <h3 className="text-base font-semibold text-theme-primary">Create Room</h3>
                  <p className="text-xs text-theme-secondary">Start a new multilingual chat room</p>
                </div>
              </div>
            </button>

            <button
              id="join-room-btn"
              onClick={() => setMode('join')}
              className="w-full bg-theme-panel border border-theme-divider rounded-2xl p-5 text-left hover:bg-theme-sidebar 
                         transition-all duration-200 group cursor-pointer shadow-xl hover:border-theme-accent-border"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-theme-sidebar border border-theme-divider
                                flex items-center justify-center text-2xl
                                group-hover:scale-105 transition-transform text-theme-accent">
                  🔗
                </div>
                <div>
                  <h3 className="text-base font-semibold text-theme-primary">Join Room</h3>
                  <p className="text-xs text-theme-secondary">Enter a room code to join</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Join Room Form */}
        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className="bg-theme-panel border border-theme-divider rounded-2xl p-6 sm:p-7 space-y-5 animate-fade-in shadow-2xl">
            <div>
              <label htmlFor="room-code-input" className="block text-xs font-semibold text-theme-secondary uppercase tracking-wider mb-2 text-center">
                Room Code
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomInput}
                onChange={(e) => { setRoomInput(e.target.value.toUpperCase()); setError(''); }}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="w-full px-4 py-4 rounded-xl bg-theme-sidebar border border-theme-divider 
                           text-theme-primary text-center text-2xl font-mono tracking-[0.2em] placeholder-theme-secondary
                           focus:outline-none focus:ring-1 focus:ring-theme-accent focus:border-theme-accent 
                           transition-all duration-200 uppercase"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs animate-fade-in text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMode(null); setError(''); setRoomInput(''); }}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-theme-secondary 
                           bg-theme-sidebar border border-theme-divider hover:bg-theme-panel hover:text-theme-primary
                           transition-all duration-200 text-sm"
              >
                Back
              </button>
              <button
                id="join-room-submit"
                type="submit"
                disabled={loading || roomInput.length < 6}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white
                           bg-theme-accent hover:bg-theme-accent-hover
                           disabled:opacity-40 disabled:cursor-not-allowed
                           transition-all duration-200 shadow-lg shadow-[var(--theme-glow)] text-sm"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </form>
        )}

        {/* Creating Room Loader */}
        {mode === 'create' && loading && (
          <div className="bg-theme-panel border border-theme-divider rounded-2xl p-8 text-center animate-fade-in shadow-2xl">
            <div className="flex justify-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 bg-theme-accent rounded-full animate-pulse" />
              <span className="w-2.5 h-2.5 bg-[#f0c040] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-2.5 h-2.5 bg-theme-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-theme-secondary text-sm">Creating your room...</p>
          </div>
        )}

        {/* Create Room Error */}
        {mode === 'create' && !loading && error && (
          <div className="bg-theme-panel border border-theme-divider rounded-2xl p-8 space-y-4 animate-fade-in shadow-2xl">
            <p className="text-red-400 text-sm text-center">{error}</p>
            <button
              onClick={() => { setMode(null); setError(''); }}
              className="w-full py-3 px-4 rounded-xl font-medium text-theme-secondary 
                         bg-theme-sidebar border border-theme-divider hover:bg-theme-panel hover:text-theme-primary
                         transition-all duration-200 text-sm"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
