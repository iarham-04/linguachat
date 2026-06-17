import { SocketProvider } from './contexts/SocketContext';
import { UserProvider, useUser } from './contexts/UserContext';
import { ThemeProvider } from './contexts/ThemeContext';
import LoginForm from './components/User/LoginForm';
import RoomLobby from './components/Room/RoomLobby';
import ChatRoom from './components/Chat/ChatRoom';

function AppRouter() {
  const { user, roomCode } = useUser();

  // Step 1: Login — enter name + choose language
  if (!user) {
    return <LoginForm />;
  }

  // Step 2: Room selection — create or join a room
  if (!roomCode) {
    return <RoomLobby />;
  }

  // Step 3: Chat
  return <ChatRoom />;
}

export default function App() {
  return (
    <ThemeProvider>
      <UserProvider>
        <SocketProvider>
          <AppRouter />
        </SocketProvider>
      </UserProvider>
    </ThemeProvider>
  );
}
