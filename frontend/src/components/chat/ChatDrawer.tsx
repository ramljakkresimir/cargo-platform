import { FormEvent, useEffect, useRef, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { conversationsService } from '../../services/conversations.service';
import { ChatMessage, Conversation } from '../../types';
import { XIcon } from '../Icons';

const POLL_MS = 4_000;

interface Props {
  conversation: Conversation | null;
  recipientName: string;
  error: string;
  onClose: () => void;
  onMessageSent: () => void;
}

function formatMessageTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('hr-HR', { hour: '2-digit', minute: '2-digit', hour12: false });
}

// Right-side slide-in panel — reused for both the "Kontakt" flow (conversation starts
// out null while POST /conversations resolves) and for opening an existing thread from
// the Razgovori list (conversation is already known). Polls for new messages while open
// since the project has no websocket infrastructure — see CLAUDE.md.
export default function ChatDrawer({ conversation, recipientName, error, onClose, onMessageSent }: Props) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState('');
  const listRef = useRef<HTMLDivElement>(null);

  // Resetting to a loading state for the newly-opened conversation is derived state,
  // not a data fetch — adjusted at render time (same pattern the list pages use for
  // their "filters changed" loading reset) rather than inside the effect below.
  const [prevConversationId, setPrevConversationId] = useState(conversation?.id);
  if (conversation?.id !== prevConversationId) {
    setPrevConversationId(conversation?.id);
    setLoading(true);
    setMessages([]);
  }

  useEffect(() => {
    if (!conversation) return;
    let cancelled = false;

    const fetchMessages = async () => {
      try {
        const res = await conversationsService.getMessages(conversation.id);
        if (cancelled) return;
        setMessages(res.data);
        onMessageSent();
      } catch {
        // Keep showing whatever we already have — a transient poll failure
        // shouldn't clear the visible history.
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchMessages();
    const interval = setInterval(fetchMessages, POLL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    const content = draft.trim();
    if (!content || !conversation || sending) return;

    setSending(true);
    setSendError('');
    try {
      const res = await conversationsService.sendMessage(conversation.id, content);
      setMessages((prev) => [...prev, res.data]);
      setDraft('');
    } catch {
      setSendError('Poruka nije poslana. Pokušajte ponovno.');
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  return (
    <div className="chat-backdrop" onClick={onClose}>
      <div className="chat-drawer" onClick={(e) => e.stopPropagation()} role="dialog" aria-label={`Razgovor s ${recipientName}`}>
        <div className="chat-drawer-header">
          <span className="chat-drawer-title">{recipientName}</span>
          <button type="button" className="chat-drawer-close" aria-label="Zatvori razgovor" onClick={onClose}>
            <XIcon size={18} />
          </button>
        </div>

        <div className="chat-drawer-body" ref={listRef}>
          {error && <div className="alert alert-error">{error}</div>}
          {!error && !conversation && <p className="loading">Pokretanje razgovora...</p>}
          {!error && conversation && loading && <p className="loading">Učitavanje poruka...</p>}
          {!error && conversation && !loading && messages.length === 0 && (
            <p className="chat-empty">Još nema poruka. Pošaljite prvu poruku ispod.</p>
          )}
          {!error &&
            conversation &&
            messages.map((m) => (
              <div key={m.id} className={`chat-bubble-row${m.senderId === user?.id ? ' own' : ''}`}>
                <div className="chat-bubble">
                  <p>{m.content}</p>
                  <span className="chat-bubble-time">{formatMessageTime(m.createdAt)}</span>
                </div>
              </div>
            ))}
        </div>

        <form className="chat-drawer-footer" onSubmit={handleSend}>
          {sendError && <div className="chat-send-error">{sendError}</div>}
          <div className="chat-input-row">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Napišite poruku..."
              rows={1}
              disabled={!conversation || Boolean(error)}
              aria-label="Nova poruka"
            />
            <button type="submit" className="chat-send-btn" disabled={!conversation || Boolean(error) || !draft.trim() || sending}>
              Pošalji
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
