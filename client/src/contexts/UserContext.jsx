import { createContext, useContext, useState, useCallback } from 'react';

const UserContext = createContext(null);

export function UserProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = sessionStorage.getItem('linguachat_user');
      return stored ? JSON.parse(stored) : null;
    } catch (e) {
      return null;
    }
  });

  const [roomCode, setRoomCode] = useState(() => {
    return sessionStorage.getItem('linguachat_room') || null;
  });

  const login = useCallback((userName, userLang) => {
    const userData = { name: userName, lang: userLang };
    setUser(userData);
    sessionStorage.setItem('linguachat_user', JSON.stringify(userData));
  }, []);

  const joinRoom = useCallback((code) => {
    setRoomCode(code);
    sessionStorage.setItem('linguachat_room', code);
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    sessionStorage.removeItem('linguachat_room');
  }, []);

  const changeLanguage = useCallback((newLang) => {
    setUser((prev) => {
      if (!prev) return null;
      const updated = { ...prev, lang: newLang };
      sessionStorage.setItem('linguachat_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setRoomCode(null);
    sessionStorage.removeItem('linguachat_user');
    sessionStorage.removeItem('linguachat_room');
  }, []);

  return (
    <UserContext.Provider value={{ user, roomCode, login, joinRoom, leaveRoom, logout, changeLanguage }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
