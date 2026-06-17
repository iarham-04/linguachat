import { useState, useEffect, useRef, useCallback } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { useUser } from '../../contexts/UserContext';
import Sidebar from '../Layout/Sidebar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import { getFlag } from '../../utils/languages';
import { encryptMessage, decryptMessage } from '../../utils/crypto';
import { parseNameAndAvatar } from '../../utils/avatar';

export default function ChatRoom() {
  const { socket, isConnected } = useSocket();
  const { user, roomCode, leaveRoom } = useUser();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [translating, setTranslating] = useState(null);
  const [activePanel, setActivePanel] = useState('chat'); // 'sidebar' | 'chat'
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
      const decrypted = {
        ...message,
        translatedText: decryptMessage(message.translatedText, roomCode),
        originalText: decryptMessage(message.originalText, roomCode),
      };
      setMessages((prev) => [...prev, decrypted]);
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
          text: `${parseNameAndAvatar(joinedUser.name).name} joined the room`,
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
          text: `${parseNameAndAvatar(name).name} left the room`,
          timestamp: Date.now(),
        },
      ]);
    };

    const handleTranslating = ({ senderName }) => {
      setTranslating(parseNameAndAvatar(senderName).name);
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
  }, [socket, roomCode]);

  const handleSendMessage = (text) => {
    if (!socket || !roomCode) return;
    const encryptedText = encryptMessage(text, roomCode);
    socket.emit('send-message', { text: encryptedText, roomCode });
  };

  const handleLeave = () => {
    if (socket) {
      socket.disconnect();
      socket.connect();
    }
    leaveRoom();
  };

  const { name: cleanName, avatar: parsedAvatar } = parseNameAndAvatar(user?.name);
  const isEmojiAvatar = parsedAvatar.length > 1 || parsedAvatar.charCodeAt(0) > 127;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-[#121212] p-0 md:p-6 overflow-hidden">
      {/* Outer Floating Container */}
      <div className="w-full h-full max-w-6xl md:h-[90vh] bg-[#252525] rounded-none md:rounded-2xl shadow-[0_0_50px_rgba(0,0,0,0.65)] border border-[#2e2e2e]/30 flex overflow-hidden relative">
        
        {/* Left Sidebar Panel */}
        <div className={`${
          activePanel === 'sidebar' ? 'flex w-full' : 'hidden'
        } md:flex md:w-[280px] flex-shrink-0 border-r border-[#2e2e2e]/40`}>
          <Sidebar 
            users={users} 
            roomCode={roomCode} 
            onLeave={handleLeave} 
            onClose={() => setActivePanel('chat')} 
          />
        </div>

        {/* Right Chat Panel */}
        <div className={`${
          activePanel === 'chat' ? 'flex' : 'hidden'
        } md:flex flex-1 flex-col min-w-0 bg-[#252525]`}>
          
          {/* Top Bar */}
          <div className="h-14 px-4 flex items-center justify-between border-b border-[#2e2e2e]/40 bg-[#252525] select-none">
            <div className="flex items-center gap-3">
              {/* Back Button (Mobile only) */}
              <button
                onClick={() => setActivePanel('sidebar')}
                className="md:hidden p-1.5 rounded-lg hover:bg-[#1e1e1e] text-gray-400 hover:text-white transition-colors"
                title="Back to sidebar"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
                </svg>
              </button>
              
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-white leading-tight">To: Everyone</span>
                  <span className="text-gray-600 text-xs">·</span>
                  <span className="text-[11px] text-[#4CAF88] bg-[#4CAF88]/10 px-2 py-0.5 rounded-full border border-[#4CAF88]/20 font-medium flex items-center gap-1 animate-fade-in">
                    <span className="leading-none">{getFlag(user.lang)}</span>
                    <span>{isEmojiAvatar ? parsedAvatar + ' ' : ''}{cleanName}</span>
                  </span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono tracking-wider">Room: {roomCode}</span>
              </div>
            </div>
          </div>

          {/* Chat Messages Area */}
          <div
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-4 scroll-smooth bg-[#252525]"
          >
            {/* Date separator pill TODAY in center */}
            {messages.length > 0 && (
              <div className="flex justify-center my-3">
                <span className="text-[10px] font-bold text-gray-500 bg-[#1e1e1e] border border-[#2e2e2e]/80 px-3 py-1 rounded-full uppercase tracking-wider">
                  Today
                </span>
              </div>
            )}

            {/* Welcome message */}
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in select-none">
                <div className="w-16 h-16 rounded-2xl bg-[#1e1e1e] border border-[#333] flex items-center justify-center mb-4 shadow-lg">
                  <span className="text-3xl">🌍</span>
                </div>
                <h3 className="text-base font-bold text-white mb-1">Room is ready!</h3>
                <p className="text-gray-400 text-xs max-w-xs leading-relaxed">
                  Share the room code <span className="font-mono text-[#f0c040] font-bold">{roomCode}</span> with
                  others to start chatting across languages.
                </p>
              </div>
            )}

            {/* Message list */}
            {messages.map((msg) => {
              if (msg.type === 'system') {
                return (
                  <div key={msg.id} className="flex justify-center animate-fade-in">
                    <span className="text-[10px] text-gray-500 bg-[#1e1e1e] border border-[#2e2e2e]/60 px-3.5 py-1 rounded-full tracking-wider font-semibold">
                      {msg.text}
                    </span>
                  </div>
                );
              }
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  currentUserId={socket?.id}
                />
              );
            })}

            {/* Translating indicator */}
            {translating && (
              <div className="flex items-center gap-1.5 text-xs text-gray-500 pl-1.5 py-1 italic animate-pulse select-none">
                <span className="flex gap-0.5">
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" />
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                  <span className="w-1.5 h-1.5 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
                </span>
                <span>{translating} is translating...</span>
              </div>
            )}

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
