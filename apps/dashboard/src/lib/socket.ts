'use client';

import { io, Socket } from 'socket.io-client';
import { fetchAuthSession } from 'aws-amplify/auth';

let socket: Socket | null = null;

/**
 * Get or create a Socket.IO connection.
 * Uses Cognito ACCESS token (not ID token) — the backend Socket.IO
 * middleware validates with tokenUse: 'access'.
 */
export async function getSocket(): Promise<Socket> {
  if (socket?.connected) return socket;

  // Get the access token from Cognito session
  const session = await fetchAuthSession();
  const token = session.tokens?.accessToken?.toString();

  if (!token) {
    throw new Error('No access token available for Socket.IO connection');
  }

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://api.mulligans.uk.com';

  socket = io(apiUrl, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
  });

  return socket;
}

/** Disconnect and clean up the socket */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

/** Check if socket is currently connected */
export function isSocketConnected(): boolean {
  return socket?.connected ?? false;
}
