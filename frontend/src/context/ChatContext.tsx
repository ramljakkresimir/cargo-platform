import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { conversationsService } from '../services/conversations.service';
import { Conversation } from '../types';
import ChatDrawer from '../components/chat/ChatDrawer';

const UNREAD_POLL_MS = 25_000;

interface StartChatParams {
  recipientUserId: string;
  recipientName: string;
  cargoPostId?: string;
  vehiclePostId?: string;
}

interface ChatContextType {
  unreadCount: number;
  isOpen: boolean;
  activeConversation: Conversation | null;
  openChatWithUser: (params: StartChatParams) => void;
  openConversation: (conversation: Conversation) => void;
  closeChat: () => void;
  refreshUnreadCount: () => void;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { token, user } = useAuth();
  const navigate = useNavigate();

  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
  const [pendingRecipientName, setPendingRecipientName] = useState('');
  const [error, setError] = useState('');

  const refreshUnreadCount = useCallback(() => {
    if (!token) return;
    conversationsService
      .getUnreadCount()
      .then((res) => setUnreadCount(res.data.count))
      .catch(() => {
        // Non-essential enhancement (navbar badge) — fail silently, same pattern as
        // useCityDistances.
      });
  }, [token]);

  // Clearing the badge on logout is derived state, not a data fetch — adjusted at
  // render time (same pattern as Navbar's route-change reset) rather than in an effect.
  const [prevToken, setPrevToken] = useState(token);
  if (token !== prevToken) {
    setPrevToken(token);
    if (!token) setUnreadCount(0);
  }

  useEffect(() => {
    if (!token) return;
    refreshUnreadCount();
    const interval = setInterval(refreshUnreadCount, UNREAD_POLL_MS);
    return () => clearInterval(interval);
  }, [token, refreshUnreadCount]);

  const closeChat = useCallback(() => {
    setIsOpen(false);
    setActiveConversation(null);
    setError('');
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const openChatWithUser = useCallback(
    ({ recipientUserId, recipientName, cargoPostId, vehiclePostId }: StartChatParams) => {
      if (!token) {
        navigate('/login');
        return;
      }
      if (user && recipientUserId === user.id) {
        // Defense in depth — the "Kontakt" action is already hidden for your own
        // listings, this only guards against it being reached some other way.
        return;
      }
      setPendingRecipientName(recipientName);
      setActiveConversation(null);
      setError('');
      setIsOpen(true);
      conversationsService
        .start({ recipientUserId, cargoPostId, vehiclePostId })
        .then((res) => {
          setActiveConversation(res.data);
          refreshUnreadCount();
        })
        .catch(() => setError('Razgovor se nije uspio pokrenuti. Pokušajte ponovno.'));
    },
    [token, user, navigate, refreshUnreadCount],
  );

  const openConversation = useCallback(
    (conversation: Conversation) => {
      if (!token) {
        navigate('/login');
        return;
      }
      setPendingRecipientName(
        conversation.otherUser.companyName || `${conversation.otherUser.firstName} ${conversation.otherUser.lastName}`,
      );
      setActiveConversation(conversation);
      setError('');
      setIsOpen(true);
    },
    [token, navigate],
  );

  return (
    <ChatContext.Provider
      value={{ unreadCount, isOpen, activeConversation, openChatWithUser, openConversation, closeChat, refreshUnreadCount }}
    >
      {children}
      {isOpen && (
        <ChatDrawer
          conversation={activeConversation}
          recipientName={pendingRecipientName}
          error={error}
          onClose={closeChat}
          onMessageSent={refreshUnreadCount}
        />
      )}
    </ChatContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export const useChat = () => useContext(ChatContext);
