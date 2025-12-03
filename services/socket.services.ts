// services / socket.services.ts

import { API_URL } from '@/config';
import { useAuthStore } from '@/store/auth.store';
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  /**
   * Connect to the Socket.IO server.
   * We retrieve the token and user ID directly from the Zustand store,
   * The Zustand store handles the AsyncStorage hydration.
   */
  connect() {
    // Get the current state from the store (synchronously)
    const { token, user } = useAuthStore.getState();
    if (!token || !user?.id || this.socket?.connected) {
      return;
    }
    // console.log('socket connection', { API_URL });
    // Initialize connection
    this.socket = io(API_URL, {
      auth: { token },      // Send JWT in auth object
      query: { userId: user.id }, // Send userId in query params
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket Connect.ed:', this.socket?.id);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.log('Socket connection error:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket Disconnected');
    });
  }

  getSocket() {
    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export default new SocketService();