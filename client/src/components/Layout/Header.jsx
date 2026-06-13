import { useSocket } from '../../contexts/SocketContext';
import { getFlag } from '../../utils/languages';
import { useUser } from '../../contexts/UserContext';

export default function Header({ roomCode, userCount }) {
  const { isConnected } = useSocket();
  const { user } = useUser();

  return (
    <header className="flex items-center justify-between px-4 py-3 bg-surface-900/95 
                        border-b border-surface-800/80 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        {/* Logo */}
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-500 to-violet-600 
                        flex items-center justify-center shadow-lg shadow-primary-500/20">
          <span className="text-lg">🌐</span>
        </div>
        <div>
          <h1 className="text-base font-bold bg-gradient-to-r from-primary-400 to-violet-400 
                         bg-clip-text text-transparent leading-tight">
            LinguaChat
          </h1>
          <p className="text-[10px] text-surface-500 leading-tight">
            {roomCode && `Room: ${roomCode}`}
            {userCount ? ` · ${userCount} online` : ''}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Current user badge */}
        {user && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full 
                          bg-surface-800/60 border border-surface-700/40">
            <span className="text-sm">{getFlag(user.lang)}</span>
            <span className="text-xs text-surface-300 font-medium">{user.name}</span>
          </div>
        )}

        {/* Connection status */}
        <div className="flex items-center gap-1.5">
          <div className={`w-2 h-2 rounded-full ${
            isConnected 
              ? 'bg-emerald-500 shadow-lg shadow-emerald-500/50' 
              : 'bg-red-500 shadow-lg shadow-red-500/50 animate-pulse'
          }`} />
          <span className={`text-xs ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
            {isConnected ? 'Connected' : 'Reconnecting...'}
          </span>
        </div>
      </div>
    </header>
  );
}
