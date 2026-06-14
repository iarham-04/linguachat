import { getFlag, getLanguageName, LANGUAGES } from '../../utils/languages';
import { useUser } from '../../contexts/UserContext';
import { useSocket } from '../../contexts/SocketContext';

export default function Sidebar({ users, roomCode, onLeave }) {
  const { user, changeLanguage } = useUser();
  const { socket } = useSocket();

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    changeLanguage(newLang);
    if (socket && roomCode) {
      socket.emit('update-language', { lang: newLang, roomCode });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-surface-900/95 border-r border-surface-800/80">
      {/* Room info header */}
      <div className="p-4 border-b border-surface-800/80">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-lg">💬</span>
          <h3 className="font-semibold text-white text-sm">Room</h3>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <code className="flex-1 px-3 py-1.5 bg-surface-800 rounded-lg text-primary-400 
                           font-mono text-sm tracking-wider text-center border border-surface-700/40">
            {roomCode}
          </code>
          <button
            onClick={() => navigator.clipboard.writeText(roomCode)}
            className="px-2 py-1.5 rounded-lg bg-surface-800 border border-surface-700/40
                       text-surface-400 hover:text-white hover:bg-surface-700 
                       transition-all duration-150 text-sm"
            title="Copy room code"
          >
            📋
          </button>
        </div>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center gap-2 mb-3">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-surface-500">
            Online
          </h4>
          <span className="text-xs text-surface-600 bg-surface-800 px-1.5 py-0.5 rounded-full">
            {users.length}
          </span>
        </div>

        <div className="space-y-2">
          {users.map((roomUser) => {
            const isSelf = roomUser.name === user?.name;
            return (
              <div
                key={roomUser.id}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all duration-150 ${
                  isSelf 
                    ? 'bg-primary-500/10 border-primary-500/30' 
                    : 'bg-surface-800/50 border-surface-700/30'
                }`}
              >
                {/* Online indicator */}
                <div className="relative flex-shrink-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500/20 to-violet-500/20 
                                  flex items-center justify-center text-base border border-surface-700/40">
                    {getFlag(roomUser.lang)}
                  </div>
                  <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-500 rounded-full 
                                  border-2 border-surface-900 shadow-lg shadow-emerald-500/30" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white truncate">
                    {roomUser.name} {isSelf && <span className="text-[10px] text-primary-400 font-semibold">(You)</span>}
                  </p>
                  <p className="text-xs text-surface-500">{getLanguageName(roomUser.lang)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer controls: Language Picker + Leave Room */}
      <div className="p-4 border-t border-surface-800/80 space-y-4">
        {/* Dynamic language picker */}
        {user && (
          <div>
            <label htmlFor="sidebar-language-select" className="block text-xs font-semibold uppercase tracking-wider text-surface-500 mb-2">
              Your Translation Language
            </label>
            <div className="relative">
              <select
                id="sidebar-language-select"
                value={user.lang}
                onChange={handleLangChange}
                className="w-full px-3 py-2 rounded-xl bg-surface-800/80 border border-surface-700/50 
                           text-white text-sm focus:outline-none focus:ring-2 focus:ring-primary-500/50 
                           focus:border-primary-500/50 transition-all duration-200 appearance-none
                           cursor-pointer"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                  backgroundRepeat: 'no-repeat',
                  backgroundPosition: 'right 12px center',
                  backgroundSize: '16px'
                }}
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code} className="bg-surface-900 text-white">
                    {lang.flag} {lang.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        <button
          id="leave-room-btn"
          onClick={onLeave}
          className="w-full py-2.5 px-4 rounded-xl text-sm font-medium
                     text-red-400 hover:text-red-300 bg-red-500/10 hover:bg-red-500/20 
                     border border-red-500/20 hover:border-red-500/30
                     transition-all duration-200"
        >
          Leave Room
        </button>
      </div>
    </div>
  );
}
