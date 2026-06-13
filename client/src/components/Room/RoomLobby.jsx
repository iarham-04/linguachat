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
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 mb-4 shadow-xl shadow-primary-500/25">
            <span className="text-3xl">💬</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Welcome, <span className="bg-gradient-to-r from-primary-400 to-violet-400 bg-clip-text text-transparent">{user?.name}</span>
          </h2>
          <p className="text-surface-400 mt-1 text-sm">Create a new room or join an existing one</p>
        </div>

        {/* Mode Selection */}
        {!mode && (
          <div className="space-y-4 animate-fade-in">
            <button
              id="create-room-btn"
              onClick={() => { setMode('create'); handleCreateRoom(); }}
              className="w-full glass-card rounded-2xl p-6 text-left hover:bg-surface-800/60 
                         transition-all duration-200 group cursor-pointer border border-surface-700/30
                         hover:border-primary-500/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 
                                flex items-center justify-center text-2xl shadow-lg shadow-emerald-500/20
                                group-hover:scale-110 transition-transform">
                  ✨
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Create Room</h3>
                  <p className="text-sm text-surface-400">Start a new multilingual chat room</p>
                </div>
              </div>
            </button>

            <button
              id="join-room-btn"
              onClick={() => setMode('join')}
              className="w-full glass-card rounded-2xl p-6 text-left hover:bg-surface-800/60 
                         transition-all duration-200 group cursor-pointer border border-surface-700/30
                         hover:border-primary-500/30"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 
                                flex items-center justify-center text-2xl shadow-lg shadow-primary-500/20
                                group-hover:scale-110 transition-transform">
                  🔗
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Join Room</h3>
                  <p className="text-sm text-surface-400">Enter a room code to join</p>
                </div>
              </div>
            </button>
          </div>
        )}

        {/* Join Room Form */}
        {mode === 'join' && (
          <form onSubmit={handleJoinRoom} className="glass-card rounded-2xl p-8 space-y-6 animate-fade-in">
            <div>
              <label htmlFor="room-code-input" className="block text-sm font-medium text-surface-300 mb-2">
                Room Code
              </label>
              <input
                id="room-code-input"
                type="text"
                value={roomInput}
                onChange={(e) => { setRoomInput(e.target.value.toUpperCase()); setError(''); }}
                placeholder="e.g. ABC123"
                maxLength={6}
                className="w-full px-4 py-4 rounded-xl bg-surface-800/80 border border-surface-700/50 
                           text-white text-center text-2xl font-mono tracking-[0.3em] placeholder-surface-600
                           focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500/50 
                           transition-all duration-200 uppercase"
                autoFocus
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm animate-fade-in text-center">{error}</p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMode(null); setError(''); setRoomInput(''); }}
                className="flex-1 py-3 px-4 rounded-xl font-medium text-surface-300 
                           bg-surface-800 hover:bg-surface-700 border border-surface-700/50
                           transition-all duration-200"
              >
                Back
              </button>
              <button
                id="join-room-submit"
                type="submit"
                disabled={loading || roomInput.length < 6}
                className="flex-1 py-3 px-4 rounded-xl font-semibold text-white
                           bg-gradient-to-r from-primary-600 to-violet-600 
                           hover:from-primary-500 hover:to-violet-500
                           disabled:opacity-50 disabled:cursor-not-allowed
                           transition-all duration-200 shadow-lg shadow-primary-500/25"
              >
                {loading ? 'Joining...' : 'Join Room'}
              </button>
            </div>
          </form>
        )}

        {/* Creating Room Loader */}
        {mode === 'create' && loading && (
          <div className="glass-card rounded-2xl p-8 text-center animate-fade-in">
            <div className="flex justify-center gap-1 mb-4">
              <span className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-pulse-dot" />
              <span className="w-2.5 h-2.5 bg-violet-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
              <span className="w-2.5 h-2.5 bg-primary-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-surface-400">Creating your room...</p>
          </div>
        )}

        {/* Create Room Error */}
        {mode === 'create' && !loading && error && (
          <div className="glass-card rounded-2xl p-8 space-y-4 animate-fade-in">
            <p className="text-red-400 text-center">{error}</p>
            <button
              onClick={() => { setMode(null); setError(''); }}
              className="w-full py-3 px-4 rounded-xl font-medium text-surface-300 
                         bg-surface-800 hover:bg-surface-700 border border-surface-700/50
                         transition-all duration-200"
            >
              Back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
