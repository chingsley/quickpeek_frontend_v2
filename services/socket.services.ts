// services / socket.services.ts

import { getSocketOrigin, getSocketTransports } from '@/config';
import { useAuthStore } from '@/store/auth.store';
import { io, Socket } from 'socket.io-client';

class SocketService {
  private socket: Socket | null = null;

  connect() {
    const { token, user } = useAuthStore.getState();
    if (!token || !user?.id) {
      return;
    }

    if (this.socket?.connected) {
      return;
    }

    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }

    const socketUrl = getSocketOrigin();
    const isSecure = socketUrl.startsWith('https://');

    this.socket = io(socketUrl, {
      auth: { token },
      query: { userId: user.id },
      transports: getSocketTransports(),
      secure: isSecure,
      timeout: 20000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('connect_error', (err: Error) => {
      console.log('Socket connection error:', err.message);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
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
