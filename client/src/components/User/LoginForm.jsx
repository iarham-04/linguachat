import { useState } from 'react';
import { LANGUAGES } from '../../utils/languages';
import { useUser } from '../../contexts/UserContext';
import { ANIMAL_AVATARS } from '../../utils/avatar';

export default function LoginForm() {
  const { login } = useUser();
  const [name, setName] = useState('');
  const [lang, setLang] = useState('en');
  const [selectedAvatar, setSelectedAvatar] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please enter your display name');
      return;
    }
    if (name.trim().length > 20) {
      setError('Name must be 20 characters or less');
      return;
    }
    const finalName = selectedAvatar ? `${selectedAvatar} ${name.trim()}` : name.trim();
    login(finalName, lang);
  };

  return (
    <div className="min-h-[100dvh] w-full flex items-center justify-center bg-[#121212] p-4 overflow-y-auto">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-[#4CAF88]/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-[#f0c040]/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10 py-6">
        {/* Logo / Brand */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-[#1e1e1e] mb-3 border border-[#2e2e2e] shadow-lg">
            <span className="text-3xl">🌐</span>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            LinguaChat
          </h1>
          {/* Gold/Yellow Underline Accent */}
          <div className="w-10 h-[3px] bg-[#f0c040] rounded mt-2.5 mb-2.5" />
          <p className="text-gray-400 text-xs mt-1">
            Chat in any language. Understand everyone.
          </p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="bg-[#1a1a1a] border border-[#2e2e2e] rounded-2xl p-6 sm:p-7 space-y-5 shadow-2xl">
          <div>
            <label htmlFor="display-name" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-[#252525] border border-[#333] 
                         text-white text-base placeholder-gray-600 focus:outline-none focus:ring-1 
                         focus:ring-[#4CAF88] focus:border-[#4CAF88] transition-all duration-200"
              autoFocus
            />
          </div>

          <div>
            <span className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Choose Animal Avatar (Optional)
            </span>
            <div className="grid grid-cols-5 gap-2">
              {ANIMAL_AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.emoji;
                return (
                  <button
                    key={avatar.emoji}
                    type="button"
                    onClick={() => setSelectedAvatar(isSelected ? '' : avatar.emoji)}
                    className={`h-10 rounded-xl flex items-center justify-center text-xl border transition-all duration-150 active:scale-95 ${
                      isSelected 
                        ? 'bg-[#4CAF88]/20 border-[#4CAF88] scale-105 shadow-md shadow-[#4CAF88]/10 text-2xl' 
                        : 'bg-[#252525] border-[#333] hover:border-gray-600'
                    }`}
                    title={avatar.label}
                  >
                    {avatar.emoji}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="language-select" className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Your Language
            </label>
            <select
              id="language-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-[#252525] border border-[#333] 
                         text-white text-base focus:outline-none focus:ring-1 focus:ring-[#4CAF88] 
                         focus:border-[#4CAF88] transition-all duration-200 appearance-none
                         cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%23888888'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '18px',
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code} className="bg-[#1a1a1a] text-white">
                  {l.flag} {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-xs animate-fade-in">{error}</p>
          )}

          <button
            id="login-button"
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-semibold text-white
                       bg-[#4CAF88] hover:bg-[#439e7a]
                       focus:outline-none focus:ring-2 focus:ring-[#4CAF88]/50
                       active:scale-[0.98]
                       transition-all duration-200 shadow-lg shadow-[#4CAF88]/10"
          >
            Continue
          </button>
        </form>

        <p className="text-center text-gray-600 text-[11px] mt-6">
          No account needed. Just pick a name and start chatting.
        </p>
      </div>
    </div>
  );
}
