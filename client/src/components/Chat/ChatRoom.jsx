import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../contexts/UserContext';
import Header from '../Layout/Header';
import Sidebar from '../Layout/Sidebar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import TranslatingIndicator from './TranslatingIndicator';

export default function ChatRoom() {
  const { socket, isConnected } = useSocket();
  const { user, roomCode, leaveRoom } = useUser();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [translating, setTranslating] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // Auto-scroll to bottom
  const scrollToBottom = useCallback(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Request user list on mount (handles race condition with room-users event)
  useEffect(() => {
    if (!socket || !roomCode) return;
    socket.emit('request-room-users', { roomCode });
  }, [socket, roomCode]);

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (message) => {
      setMessages((prev) => [...prev, message]);
      setTranslating(null);
    };

    const handleRoomUsers = ({ users: roomUsers }) => {
      setUsers(roomUsers);
    };

    const handleUserJoined = (joinedUser) => {
      // Add a system message
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: 'system',
          text: `${joinedUser.name} joined the room`,
          timestamp: Date.now(),
        },
      ]);
    };

    const handleUserLeft = ({ name }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `system-${Date.now()}`,
          type: 'system',
          text: `${name} left the room`,
          timestamp: Date.now(),
        },
      ]);
    };

    const handleTranslating = ({ senderName }) => {
      setTranslating(senderName);
      // Auto-clear after 5 seconds (safety net)
      setTimeout(() => setTranslating(null), 5000);
    };

    const handleError = ({ message }) => {
      console.error('[Chat] Error:', message);
    };

    socket.on('receive-message', handleReceiveMessage);
    socket.on('room-users', handleRoomUsers);
    socket.on('user-joined', handleUserJoined);
    socket.on('user-left', handleUserLeft);
    socket.on('translating', handleTranslating);
    socket.on('error', handleError);

    return () => {
      socket.off('receive-message', handleReceiveMessage);
      socket.off('room-users', handleRoomUsers);
      socket.off('user-joined', handleUserJoined);
      socket.off('user-left', handleUserLeft);
      socket.off('translating', handleTranslating);
      socket.off('error', handleError);
    };
  }, [socket]);

  const handleSendMessage = (text) => {
    if (!socket || !roomCode) return;
    socket.emit('send-message', { text, roomCode });
  };

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    leaveRoom();
  };

  return (
    <div className="h-screen flex flex-col bg-surface-950">
      {/* Header */}
      <Header roomCode={roomCode} userCount={users.length} />

      <div className="flex-1 flex overflow-hidden relative">
        {/* Sidebar — desktop */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <Sidebar users={users} roomCode={roomCode} onLeave={handleLeave} />
        </div>

        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div className="fixed inset-0 z-50 md:hidden">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
            <div className="absolute left-0 top-0 bottom-0 w-72 animate-slide-in-left">
              <Sidebar users={users} roomCode={roomCode} onLeave={handleLeave} />
            </div>
          </div>
        )}

        {/* Chat Area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Mobile top bar with sidebar toggle */}
          <div className="md:hidden flex items-center gap-2 px-4 py-2 bg-surface-900/60 border-b border-surface-800/50">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-1.5 rounded-lg hover:bg-surface-800 text-surface-400 transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
              </svg>
            </button>
            <span className="text-xs text-surface-500">{users.length} online</span>
            <code className="ml-auto text-xs text-primary-400 font-mono">{roomCode}</code>
          </div>

          {/* Messages */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-4 space-y-3 scroll-smooth"
          >
            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in">
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500/20 to-violet-500/20 
                                flex items-center justify-center mb-4 border border-surface-700/30">
                  <span className="text-4xl">🌍</span>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Room is ready!</h3>
                <p className="text-surface-400 text-sm max-w-xs">
                  Share the room code <span className="font-mono text-primary-400">{roomCode}</span> with
                  others to start chatting across languages.
                </p>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center animate-fade-in">
                    <span className="text-xs text-surface-500 bg-surface-800/60 px-3 py-1 rounded-full
                                     border border-surface-700/30">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                />
              );
            })}

            {/* Translating indicator */}
            <TranslatingIndicator senderName={translating} />

            {/* Scroll anchor */}
            <div ref={messagesEndRef} />
          </div>

          {/* Message Input */}
          <MessageInput onSend={handleSendMessage} disabled={!isConnected} />
        </div>
      </div>
    </div>
  );
}
