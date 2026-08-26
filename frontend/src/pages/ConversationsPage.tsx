import { useEffect, useState } from 'react';
import { conversationsService } from '../services/conversations.service';
import { Conversation } from '../types';
import { useChat } from '../context/ChatContext';
import CompanyAvatar from '../components/CompanyAvatar';
import EmptyState from '../components/EmptyState';
import { formatPostedAt } from '../utils/dateUtils';

const POLL_MS = 15_000;

function otherUserLabel(conversation: Conversation): string {
  const { otherUser } = conversation;
  return otherUser.companyName || `${otherUser.firstName} ${otherUser.lastName}`;
}

export default function ConversationsPage() {
  const { openConversation } = useChat();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    const fetchConversations = async () => {
      try {
        const res = await conversationsService.getAll();
        if (!cancelled) setConversations(res.data);
      } catch {
        if (!cancelled) setError('Nije moguće učitati razgovore.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    fetchConversations();
    const interval = setInterval(fetchConversations, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="page-container-narrow">
      <div className="page-header">
        <h1>Razgovori</h1>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading && <p className="loading">Učitavanje...</p>}

      {!loading && !error && conversations.length === 0 && (
        <EmptyState message="Još nemate razgovora. Kontaktirajte vlasnika oglasa da započnete." />
      )}

      {!loading && conversations.length > 0 && (
        <div className="conversations-list">
          {conversations.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`conversation-row${c.unreadCount > 0 ? ' unread' : ''}`}
              onClick={() => openConversation(c)}
            >
              <CompanyAvatar name={otherUserLabel(c)} />
              <div className="conversation-info">
                <div className="conversation-top-line">
                  <span className="conversation-name">{otherUserLabel(c)}</span>
                  {c.lastMessage && (
                    <span className="conversation-time">{formatPostedAt(c.lastMessage.createdAt)}</span>
                  )}
                </div>
                <p className="conversation-preview">
                  {c.lastMessage ? c.lastMessage.content : 'Nema poruka još.'}
                </p>
              </div>
              {c.unreadCount > 0 && <span className="conversation-unread-dot" aria-label={`${c.unreadCount} nepročitanih poruka`} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
