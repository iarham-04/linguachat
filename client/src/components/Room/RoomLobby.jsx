import { useState, useEffect } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../contexts/UserContext';

const getRelativeTimeString = (timestamp) => {
  const diffMs = Date.now() - timestamp;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);

  if (diffSecs < 60) {
    return 'Just joined';
  } else if (diffMins < 60) {
    return `Joined ${diffMins}m ago`;
  } else {
    return `Joined ${diffHours}h ago`;
  }
};

export default function RoomLobby() {
  const { socket } = useSocket();
  const { user, joinRoom } = useUser();
  const [mode, setMode] = useState(null); // null | 'create' | 'join'
  const [roomInput, setRoomInput] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdCode, setCreatedCode] = useState('');
  const [recentRooms, setRecentRooms] = useState([]);

  useEffect(() => {
    const loadRecentRooms = () => {
      try {
        const stored = localStorage.getItem('linguachat_recent_rooms');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) {
            const now = Date.now();
            const validRooms = parsed.filter(r => now - r.joinedAt < 24 * 60 * 60 * 1000);
            if (validRooms.length !== parsed.length) {
              localStorage.setItem('linguachat_recent_rooms', JSON.stringify(validRooms));
            }
            setRecentRooms(validRooms);
          }
        }
      } catch (e) {
        console.error('Failed to load recent rooms:', e);
      }
    };

    loadRecentRooms();
  }, []);

  const removeRecentRoom = (code) => {
    try {
      const stored = localStorage.getItem('linguachat_recent_rooms');
      if (stored) {
        let parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          parsed = parsed.filter(r => r.code !== code.toUpperCase());
          localStorage.setItem('linguachat_recent_rooms', JSON.stringify(parsed));
          setRecentRooms(parsed);
        }
      }
    } catch (e) {
      console.error('Failed to remove recent room:', e);
    }
  };

  const handleRejoinRoom = (code) => {
    if (!socket) {
      setError('Connection to server lost. Please try again.');
      return;
    }
    setLoading(true);
    setError('');

    socket.emit('join-room', {
      roomCode: code.toUpperCase(),
      userId: user.id,
      userName: user.name,
      userLang: user.lang,
    }, (response) => {
      setLoading(false);
      if (response.error) {
        setError(response.error);
        removeRecentRoom(code);
      } else {
        joinRoom(response.roomCode);
      }
    });
  };

  const handleCreateRoom = (roomType = 'group') => {
    if (!socket) {
      setError('Connection to server lost. Please try again.');
      setMode(null);
      return;
    }
    setLoading(true);
    setError('');
    setMode('create');

    socket.emit('create-room', {
      userId: user.id,
      userName: user.name,
      userLang: user.lang,
      roomType,
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
    if (!roomInput.trim()) return;
    if (!socket) {
      setError('Connection to server lost. Please try again.');
      return;
    }
    setLoading(true);
    setError('');

    socket.emit('join-room', {
      roomCode: roomInput.trim().toUpperCase(),
      userId: user.id,
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

        {/* Error notification on lobby */}
        {!mode && error && (
          <div className="mb-4 bg-red-400/10 border border-red-500/20 text-red-400 text-xs rounded-xl p-3 text-center flex items-center justify-between animate-fade-in">
            <span className="flex-1">{error}</span>
            <button onClick={() => setError('')} className="ml-2 font-bold hover:text-white transition-colors cursor-pointer">&times;</button>
          </div>
        )}

        {/* Mode Selection */}
        {!mode && !loading && (
          <div className="space-y-4 animate-fade-in">
            <button
              id="create-room-btn"
              onClick={() => { setMode('create_type'); }}
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

        {/* Create Room Type Selection */}
        {mode === 'create_type' && (
          <div className="bg-theme-panel border border-theme-divider rounded-2xl p-6 sm:p-7 space-y-5 animate-fade-in shadow-2xl">
            <h3 className="text-xs font-semibold text-theme-secondary uppercase tracking-wider text-center">
              Choose Room Capacity
            </h3>
            
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => handleCreateRoom('group')}
                className="w-full bg-theme-sidebar border border-theme-divider rounded-xl p-4 text-left hover:bg-theme-panel hover:border-theme-accent transition-all duration-200 group cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-theme-panel flex items-center justify-center text-xl">
                    👥
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-theme-primary group-hover:text-theme-accent transition-colors">Group Room</h4>
                    <p className="text-[11px] text-theme-secondary">Supports up to 4 participants</p>
                  </div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => handleCreateRoom('pair')}
                className="w-full bg-theme-sidebar border border-theme-divider rounded-xl p-4 text-left hover:bg-theme-panel hover:border-theme-accent transition-all duration-200 group cursor-pointer animate-fade-in"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-theme-panel flex items-center justify-center text-xl">
                    👤👥
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-theme-primary group-hover:text-theme-accent transition-colors">1-on-1 Pair Room</h4>
                    <p className="text-[11px] text-theme-secondary">Supports max 2 participants</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              type="button"
              onClick={() => setMode(null)}
              className="w-full py-3 px-4 rounded-xl font-medium text-theme-secondary 
                         bg-theme-sidebar border border-theme-divider hover:bg-theme-panel hover:text-theme-primary
                         transition-all duration-200 text-sm"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Recent Rooms */}
        {!mode && !loading && recentRooms.length > 0 && (
          <div className="mt-8 space-y-3 animate-fade-in">
            <h3 className="text-xs font-semibold text-theme-secondary uppercase tracking-wider text-center">
              Recent Rooms (Joined within 24h)
            </h3>
            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {recentRooms.map((room) => (
                <div
                  key={room.code}
                  className="flex items-center justify-between bg-theme-panel border border-theme-divider 
                             rounded-xl p-3 hover:bg-theme-sidebar transition-all duration-200 group"
                >
                  <button
                    onClick={() => handleRejoinRoom(room.code)}
                    disabled={loading}
                    className="flex-1 flex items-center justify-between text-left cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-theme-sidebar border border-theme-divider
                                      flex items-center justify-center text-sm font-semibold text-theme-accent">
                        💬
                      </div>
                      <div>
                        <span className="font-mono font-bold text-sm tracking-wider text-theme-primary group-hover:text-theme-accent transition-colors">
                          {room.code}
                        </span>
                        <span className="block text-[10px] text-theme-secondary">
                          {getRelativeTimeString(room.joinedAt)}
                        </span>
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-theme-accent group-hover:translate-x-0.5 transition-transform mr-2">
                      Rejoin &rarr;
                    </span>
                  </button>
                  
                  {/* Remove Button */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeRecentRoom(room.code);
                    }}
                    className="p-1.5 rounded-lg text-theme-secondary hover:text-red-400 hover:bg-red-400/10 transition-colors"
                    title="Remove from history"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rejoining Room Loader */}
        {!mode && loading && (
          <div className="bg-theme-panel border border-theme-divider rounded-2xl p-8 text-center animate-fade-in shadow-2xl">
            <div className="flex justify-center gap-1.5 mb-4">
              <span className="w-2.5 h-2.5 bg-theme-accent rounded-full animate-pulse" />
              <span className="w-2.5 h-2.5 bg-[#f0c040] rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
              <span className="w-2.5 h-2.5 bg-theme-accent rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
            </div>
            <p className="text-theme-secondary text-sm">Rejoining room...</p>
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
