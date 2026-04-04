/** Conversation as returned by GET /api/messages/conversations */
export interface Conversation {
  id: string;
  listing_id: string | null;
  listing_title: string | null;
  listing_price: number | null;
  listing_image: string | null;
  other_user_id: string;
  other_user_name: string;
  other_user_avatar: string | null;
  other_user_is_verified: boolean;
  last_message: string;
  last_message_time: string;
  last_message_timestamp: string;
  unread_count: number;
  created_at: string;
}

/** Message as returned by GET /api/messages/conversations/:id/messages */
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  message_type: string;
  offer_amount: number | null;
  is_read: boolean;
  created_at: string;
  users_messages_sender_idTousers?: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}

/** Conversation detail as returned by GET /api/messages/conversations/:id */
export interface ConversationDetail {
  id: string;
  listing_id: string | null;
  buyer_id: string;
  seller_id: string;
  last_message_at: string;
  is_archived: boolean;
  listing?: {
    id: string;
    title: string;
    price: number;
    status: string;
    images: { image_url: string }[];
  } | null;
  other_user: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
    is_verified_seller: boolean;
  };
}

/** Unread count as returned by GET /api/messages/unread-count */
export interface MessageCounts {
  unread_count: number;
}

/** Socket.IO send_message payload */
export interface SendMessagePayload {
  conversationId: string;
  content: string;
  messageType?: string;
  offerAmount?: number;
}

/** Socket.IO new_message event payload */
export interface SocketMessage extends Message {
  users_messages_sender_idTousers: {
    id: string;
    display_name: string | null;
    avatar_url: string | null;
  };
}
