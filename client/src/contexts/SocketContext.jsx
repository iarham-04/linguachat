import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { SERVER_URL } from '../utils/constants';
import { useUser } from './UserContext';
import { useAuth } from '@clerk/clerk-react';

const SocketContext = createContext(null);

// ── Clerk Handshake Socket Provider ────────────────
function ClerkSocketProvider({ children }) {
  const { user } = useUser();
  const { getToken } = useAuth();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    let activeSocket = null;

    const establishConnection = async () => {
      try {
        const token = await getToken();
        
        activeSocket = io(SERVER_URL, {
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 10,
          reconnectionDelay: 1000,
          auth: { token }
        });

        activeSocket.on('connect', () => {
          setIsConnected(true);
        });

        activeSocket.on('disconnect', () => {
          setIsConnected(false);
        });

        activeSocket.on('connect_error', (err) => {
          console.error('[Socket] Connection error:', err.message);
          setIsConnected(false);
        });

        setSocket(activeSocket);
      } catch (err) {
        console.error('[Socket] Failed to resolve auth token:', err.message);
      }
    };

    establishConnection();

    return () => {
      if (activeSocket) {
        activeSocket.close();
      }
    };
  }, [user, getToken]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

// ── Local Bypass Handshake Socket Provider ──────────
function BypassSocketProvider({ children }) {
  const { user } = useUser();
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user) {
      if (socket) {
        socket.close();
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    const activeSocket = io(SERVER_URL, {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      auth: { userId: user.id }
    });

    activeSocket.on('connect', () => {
      setIsConnected(true);
    });

    activeSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    activeSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err.message);
      setIsConnected(false);
    });

    setSocket(activeSocket);

    return () => {
      activeSocket.close();
    };
  }, [user]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
}

export function SocketProvider({ children }) {
  const { isClerkActive } = useUser();
  
  return isClerkActive ? (
    <ClerkSocketProvider>{children}</ClerkSocketProvider>
  ) : (
    <BypassSocketProvider>{children}</BypassSocketProvider>
  );
}

export function useSocket() {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
}
