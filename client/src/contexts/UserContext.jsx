import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useAuth, useUser as useClerkUser } from '@clerk/clerk-react';

const UserContext = createContext(null);
const hasClerk = !!import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

// ── Clerk Authentication Provider ─────────────────
function ClerkUserProvider({ children }) {
  const { isSignedIn, user: clerkUser } = useClerkUser();
  const { getToken, signOut } = useAuth();
  
  const [user, setUser] = useState(null);
  const [dbProfile, setDbProfile] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [mustSetupProfile, setMustSetupProfile] = useState(false);

  const [roomCode, setRoomCode] = useState(() => {
    return sessionStorage.getItem('linguachat_room') || null;
  });

  useEffect(() => {
    if (!isSignedIn) {
      setUser(null);
      setDbProfile(null);
      setIsLoadingProfile(false);
      setMustSetupProfile(false);
      return;
    }

    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const token = await getToken();
        const res = await fetch('/api/users/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (res.status === 401) {
          setUser(null);
          setMustSetupProfile(false);
          return;
        }
        
        const data = await res.json();
        if (data.exists) {
          const userData = {
            id: data.user.clerk_id,
            name: data.user.username,
            lang: data.user.language,
            avatar: data.user.avatar,
          };
          setUser(userData);
          setDbProfile(data.user);
          setMustSetupProfile(false);
        } else {
          setMustSetupProfile(true);
        }
      } catch (err) {
        console.error('[UserContext] Error fetching profile:', err);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    fetchProfile();
  }, [isSignedIn, clerkUser, getToken]);

  const login = useCallback(async (username, language, avatar) => {
    setIsLoadingProfile(true);
    try {
      const token = await getToken();
      const res = await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username, language, avatar })
      });
      
      const data = await res.json();
      if (data.success) {
        const userData = {
          id: data.user.clerk_id,
          name: data.user.username,
          lang: data.user.language,
          avatar: data.user.avatar,
        };
        setUser(userData);
        setDbProfile(data.user);
        setMustSetupProfile(false);
        return { success: true };
      } else {
        return { error: data.error || 'Failed to setup profile' };
      }
    } catch (err) {
      console.error('[UserContext] Profile setup error:', err);
      return { error: 'Server connection error' };
    } finally {
      setIsLoadingProfile(false);
    }
  }, [getToken]);

  const joinRoom = useCallback((code) => {
    setRoomCode(code);
    sessionStorage.setItem('linguachat_room', code);
  }, []);

  const leaveRoom = useCallback(() => {
    setRoomCode(null);
    sessionStorage.removeItem('linguachat_room');
  }, []);

  const changeLanguage = useCallback(async (newLang) => {
    if (!user) return;
    try {
      setUser((prev) => (prev ? { ...prev, lang: newLang } : null));
      const token = await getToken();
      await fetch('/api/users/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: user.name,
          language: newLang,
          avatar: user.avatar
        })
      });
    } catch (err) {
      console.error('[UserContext] Error updating language:', err);
    }
  }, [user, getToken]);

  const logout = useCallback(async () => {
    setUser(null);
    setRoomCode(null);
    setDbProfile(null);
    setMustSetupProfile(false);
    sessionStorage.removeItem('linguachat_room');
    await signOut();
  }, [signOut]);

  return (
    <UserContext.Provider value={{ 
      user, 
      roomCode, 
      login, 
      joinRoom, 
      leaveRoom, 
      logout, 
      changeLanguage, 
      isLoadingProfile, 
      mustSetupProfile,
      isClerkActive: true
    }}>
      {children}
    </UserContext.Provider>
  );
}

// ── Local Bypass Authentication Provider ──────────
function BypassUserProvider({ children }) {
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

  const login = useCallback(async (userName, userLang, avatar) => {
    const userId = 'mock_' + userName.toLowerCase().trim();
    const userData = { id: userId, name: userName, lang: userLang, avatar };
    setUser(userData);
    sessionStorage.setItem('linguachat_user', JSON.stringify(userData));
    return { success: true };
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
    <UserContext.Provider value={{ 
      user, 
      roomCode, 
      login, 
      joinRoom, 
      leaveRoom, 
      logout, 
      changeLanguage,
      isLoadingProfile: false,
      mustSetupProfile: false,
      isClerkActive: false
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const UserProvider = hasClerk ? ClerkUserProvider : BypassUserProvider;

export function useUser() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
