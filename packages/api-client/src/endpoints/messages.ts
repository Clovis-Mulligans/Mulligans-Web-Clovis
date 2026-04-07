import { apiClient } from '../client';
import type {
  Conversation,
  ConversationDetail,
  Message,
  MessageCounts,
} from '../types/message';

// --- Response Types ---

export interface GetMessagesResponse {
  messages: Message[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// --- Endpoint Functions ---

/** GET /api/messages/conversations — all conversations for current user */
export function getConversations() {
  return apiClient.get<{ conversations: Conversation[] }>('/api/messages/conversations');
}

/** GET /api/messages/conversations/:id — single conversation detail */
export function getConversation(id: string) {
  return apiClient.get<ConversationDetail>(`/api/messages/conversations/${id}`);
}

/** GET /api/messages/conversations/:id/messages — messages in conversation */
export function getMessages(id: string, params?: { page?: number; limit?: number }) {
  return apiClient.get<GetMessagesResponse>(`/api/messages/conversations/${id}/messages`, {
    params: params as Record<string, string | number | boolean | undefined>,
  });
}

/** POST /api/messages/ — send a message via HTTP (fallback if Socket.IO unavailable) */
export function sendMessage(conversationId: string, content: string) {
  return apiClient.post<Message>('/api/messages/', {
    conversation_id: conversationId,
    content,
  });
}

/** PATCH /api/messages/conversations/:id/read — mark conversation as read */
export function markConversationRead(id: string) {
  return apiClient.patch<{ success: boolean; marked_count: number }>(
    `/api/messages/conversations/${id}/read`
  );
}

/** PATCH /api/messages/read-all — mark all messages as read */
export function markAllRead() {
  return apiClient.patch<{ success: boolean; marked_count: number }>(
    '/api/messages/read-all'
  );
}

/** GET /api/messages/unread-count — unread message count for badge */
export function getMessageCounts() {
  return apiClient.get<MessageCounts>('/api/messages/unread-count');
}

/** POST /api/messages/conversations — create or get existing conversation */
export function createConversation(data: { listing_id: string; seller_id: string }) {
  return apiClient.post<{ conversation: ConversationDetail }>('/api/messages/conversations', data);
}