import api from './api';
import { ChatMessage, Conversation } from '../types';

export const conversationsService = {
  getAll: () => api.get<Conversation[]>('/conversations'),

  getUnreadCount: () => api.get<{ count: number }>('/conversations/unread-count'),

  start: (payload: { recipientUserId: string; cargoPostId?: string; vehiclePostId?: string }) =>
    api.post<Conversation>('/conversations', payload),

  getMessages: (conversationId: string) =>
    api.get<ChatMessage[]>(`/conversations/${conversationId}/messages`),

  sendMessage: (conversationId: string, content: string) =>
    api.post<ChatMessage>(`/conversations/${conversationId}/messages`, { content }),
};
