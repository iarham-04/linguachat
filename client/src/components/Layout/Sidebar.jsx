import { useState } from 'react';
import { getFlag, getLanguageName, LANGUAGES } from '../../utils/languages';
import { useUser } from '../../contexts/UserContext';
import { useSocket } from '../../contexts/SocketContext';

export default function Sidebar({ users, roomCode, onLeave, onClose }) {
  const { user, changeLanguage } = useUser();
  const { socket } = useSocket();
  const [settingsOpen, setSettingsOpen] = useState(false);

  const handleLangChange = (e) => {
    const newLang = e.target.value;
    changeLanguage(newLang);
    if (socket && roomCode) {
      socket.emit('update-language', { lang: newLang, roomCode });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-[#1a1a1a] relative select-none">
      {/* Sidebar header */}
      <div className="p-4 flex flex-col relative">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2 text-white">
            {/* Chat/Message Icon */}
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5.5 h-5.5 text-white">
              <path fillRule="evenodd" d="M4.848 2.771A49.144 49.144 0 0 1 12 2.25c2.43 0 4.817.178 7.152.52 1.978.292 3.348 2.024 3.348 3.97v6.02c0 1.946-1.37 3.678-3.348 3.97a48.908 48.908 0 0 1-5.152.455c-.244.014-.49.025-.736.033l-4.08 4.078a.75.75 0 0 1-1.28-.53v-3.71c-1.748-.066-3.418-.286-4.954-.645C2.106 15.996 1 14.394 1 12.5V8.568c0-1.945 1.106-3.547 2.848-3.827l.004-.001ZM18.75 9a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0V9ZM12.75 9a.75.75 0 0 0-1.5 0v3a.75.75 0 0 0 1.5 0V9ZM7.5 9.75a.75.75 0 0 1 .75-.75h.008a.75.75 0 0 1 .75.75v.008a.75.75 0 0 1-.75.75H8.25a.75.75 0 0 1-.75-.75V9.75Z" clipRule="evenodd" />
            </svg>
            <h3 className="font-bold text-white text-base tracking-tight">LinguaChat</h3>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Settings/Hamburger Toggle button */}
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className="p-1.5 rounded-lg hover:bg-[#252525] text-gray-400 hover:text-white transition-all active:scale-95"
              title="Settings"
              id="sidebar-settings-btn"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 1 1-3 0m3 0a1.5 1.5 0 1 0-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 0 1-3 0m3 0a1.5 1.5 0 0 0-3 0m-9.75 0h9.75" />
              </svg>
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="md:hidden p-1.5 rounded-lg hover:bg-[#252525] text-gray-400 hover:text-white transition-all"
                title="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Short Gold/Yellow Accent Line */}
        <div className="w-[40px] h-[3px] bg-[#f0c040] rounded mt-1 mb-2" />

        {/* Floating Settings Dropdown Modal */}
        {settingsOpen && (
          <div className="absolute right-4 top-14 w-60 bg-[#252525] border border-[#333] rounded-xl p-4 shadow-2xl z-30 space-y-3.5 animate-slide-up">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Settings</span>
                <button onClick={() => setSettingsOpen(false)} className="text-gray-500 hover:text-white text-xs">✕</button>
              </div>
              
              <div className="flex items-center gap-1.5 bg-[#1a1a1a] p-2 rounded-lg border border-[#333] mb-3">
                <span className="text-[10px] text-gray-400 font-semibold uppercase tracking-wider flex-1">Room Code:</span>
                <code className="text-xs font-mono text-[#f0c040] tracking-wider">{roomCode}</code>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomCode);
                  }}
                  className="p-1 rounded bg-[#252525] hover:bg-[#333] text-gray-400 hover:text-white text-[10px]"
                  title="Copy room code"
                >
                  📋
                </button>
              </div>
            </div>

            {user && (
              <div className="space-y-1.5">
                <label htmlFor="sidebar-language-select" className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Translation Language
                </label>
                <div className="relative">
                  <select
                    id="sidebar-language-select"
                    value={user.lang}
                    onChange={handleLangChange}
                    className="w-full px-3 py-2 rounded-lg bg-[#1a1a1a] border border-[#333] 
                               text-white text-xs focus:outline-none focus:ring-1 focus:ring-[#4CAF88] 
                               transition-all duration-200 appearance-none cursor-pointer"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'right 8px center',
                      backgroundSize: '12px'
                    }}
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.code} value={lang.code} className="bg-[#1a1a1a] text-white">
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
              className="w-full py-2 px-3 rounded-lg text-xs font-semibold
                         text-red-400 hover:text-white bg-red-500/10 hover:bg-red-500/80 
                         border border-red-500/20 hover:border-transparent
                         transition-all duration-200"
            >
              Leave Room
            </button>
          </div>
        )}
      </div>

      {/* Section label: RECENT CHATS with badge & dropdown arrow */}
      <div className="px-4 py-2 flex items-center justify-between text-gray-400">
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">RECENT CHATS</span>
          <span className="text-[10px] font-semibold text-[#4CAF88] bg-[#4CAF88]/10 px-1.5 py-0.5 rounded-full border border-[#4CAF88]/20">
            {users.length}
          </span>
        </div>
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-3.5 h-3.5 text-gray-500">
          <path strokeLinecap="round" strokeLinejoin="round" d="m19.5 8.25-7.5 7.5-7.5-7.5" />
        </svg>
      </div>

      {/* Users list */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
        {users.map((roomUser) => {
          const isSelf = roomUser.name === user?.name;
          const initials = roomUser.name.charAt(0).toUpperCase();
          
          const getAvatarGradient = (name) => {
            const gradients = [
              'from-purple-600 to-indigo-600',
              'from-teal-600 to-emerald-600',
              'from-blue-600 to-cyan-600',
              'from-pink-600 to-rose-600',
              'from-orange-600 to-amber-600'
            ];
            let hash = 0;
            for (let i = 0; i < name.length; i++) {
              hash = name.charCodeAt(i) + ((hash << 5) - hash);
            }
            return gradients[Math.abs(hash) % gradients.length];
          };

          return (
            <div
              key={roomUser.id}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl hover:bg-[#252525]/50 group transition-all duration-150 relative ${
                isSelf ? 'bg-[#252525]/30' : ''
              }`}
            >
              {/* Circular Avatar on Left */}
              <div className="relative flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getAvatarGradient(roomUser.name)} flex items-center justify-center text-white text-sm font-bold shadow-md`}>
                  {initials}
                </div>
                {/* Online Status Dot */}
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4CAF88] rounded-full border-2 border-[#1a1a1a] shadow-md shadow-[#4CAF88]/20" />
              </div>

              {/* Name + Details */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between mb-0.5">
                  <p className="text-sm font-bold text-white group-hover:text-white truncate">
                    {roomUser.name} {isSelf && <span className="text-[10px] text-gray-500 font-semibold">(You)</span>}
                  </p>
                  <span className="text-[10px] text-gray-500">12:45 PM</span>
                </div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-gray-400 truncate pr-2">
                    Active in {getLanguageName(roomUser.lang)} [{roomUser.lang.toUpperCase()}]
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Bottom of sidebar: three dots option */}
      <div className="py-3 flex justify-center border-t border-[#252525]">
        <button
          onClick={() => setSettingsOpen(!settingsOpen)}
          className="text-gray-600 hover:text-white transition-colors tracking-[0.2em] font-extrabold text-sm"
          title="More options"
        >
          •••
        </button>
      </div>
    </div>
  );
}
