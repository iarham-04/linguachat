import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const THEMES = {
  charcoal: {
    id: 'charcoal',
    name: 'Midnight Charcoal',
    emoji: '🖤',
    color: '#4CAF88'
  },
  amethyst: {
    id: 'amethyst',
    name: 'Royal Amethyst',
    emoji: '🔮',
    color: '#a78bfa'
  },
  breeze: {
    id: 'breeze',
    name: 'Ocean Breeze',
    emoji: '🌊',
    color: '#06b6d4'
  },
  sunset: {
    id: 'sunset',
    name: 'Sunset Glow',
    emoji: '🌅',
    color: '#f97316'
  },
  moss: {
    id: 'moss',
    name: 'Forest Moss',
    emoji: '🌲',
    color: '#84cc16'
  }
};

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('linguachat_theme') || 'charcoal';
  });

  useEffect(() => {
    localStorage.setItem('linguachat_theme', theme);
    const root = document.documentElement;
    // Remove other theme classes
    Object.keys(THEMES).forEach((t) => {
      root.classList.remove(`theme-${t}`);
    });
    // Add current theme class
    root.classList.add(`theme-${theme}`);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
