import { useState } from 'react';
import { LANGUAGES } from '../../utils/languages';
import { useUser } from '../../contexts/UserContext';

export default function LoginForm() {
  const { login } = useUser();
  const [name, setName] = useState('');
  const [lang, setLang] = useState('en');
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
    login(name.trim(), lang);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-950 p-4">
      {/* Background decorations */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Logo / Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-violet-600 mb-4 shadow-xl shadow-primary-500/25">
            <span className="text-4xl">🌐</span>
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary-400 via-violet-400 to-primary-300 bg-clip-text text-transparent">
            LinguaChat
          </h1>
          <p className="text-surface-400 mt-2 text-sm">
            Chat in any language. Understand everyone.
          </p>
        </div>

        {/* Login Card */}
        <form onSubmit={handleSubmit} className="glass-card rounded-2xl p-8 space-y-6">
          <div>
            <label htmlFor="display-name" className="block text-sm font-medium text-surface-300 mb-2">
              Display Name
            </label>
            <input
              id="display-name"
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setError(''); }}
              placeholder="Enter your name..."
              maxLength={20}
              className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700/50 
                         text-white placeholder-surface-500 focus:outline-none focus:ring-2 
                         focus:ring-primary-500/50 focus:border-primary-500/50 transition-all duration-200"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="language-select" className="block text-sm font-medium text-surface-300 mb-2">
              Your Language
            </label>
            <select
              id="language-select"
              value={lang}
              onChange={(e) => setLang(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-surface-800/80 border border-surface-700/50 
                         text-white focus:outline-none focus:ring-2 focus:ring-primary-500/50 
                         focus:border-primary-500/50 transition-all duration-200 appearance-none
                         cursor-pointer"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='%2394a3b8'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px',
              }}
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.flag} {l.name} ({l.nativeName})
                </option>
              ))}
            </select>
          </div>

          {error && (
            <p className="text-red-400 text-sm animate-fade-in">{error}</p>
          )}

          <button
            id="login-button"
            type="submit"
            className="w-full py-3 px-4 rounded-xl font-semibold text-white
                       bg-gradient-to-r from-primary-600 to-violet-600 
                       hover:from-primary-500 hover:to-violet-500
                       focus:outline-none focus:ring-2 focus:ring-primary-500/50
                       transform hover:scale-[1.02] active:scale-[0.98]
                       transition-all duration-200 shadow-lg shadow-primary-500/25"
          >
            Continue
          </button>
        </form>

        <p className="text-center text-surface-600 text-xs mt-6">
          No account needed. Just pick a name and start chatting.
        </p>
      </div>
    </div>
  );
}
