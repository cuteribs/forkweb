import { defineStore } from 'pinia';
import { ref } from 'vue';
import { io, Socket } from 'socket.io-client';

export const useWebSocketStore = defineStore('websocket', () => {
  const socket = ref<Socket | null>(null);
  const connected = ref(false);

  function connect() {
    if (socket.value?.connected) return;

    // Use relative path to connect to the same host as the frontend
    // This allows the backend proxy to handle the connection
    socket.value = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socket.value.on('connect', () => {
      connected.value = true;
      console.log('WebSocket connected');
    });

    socket.value.on('disconnect', () => {
      connected.value = false;
      console.log('WebSocket disconnected');
    });

    socket.value.on('error', (error) => {
      console.error('WebSocket error:', error);
    });
  }

  function disconnect() {
    if (socket.value) {
      socket.value.disconnect();
      socket.value = null;
      connected.value = false;
    }
  }

  function on(event: string, handler: (...args: any[]) => void) {
    socket.value?.on(event, handler);
  }

  function off(event: string, handler?: (...args: any[]) => void) {
    socket.value?.off(event, handler);
  }

  function emit(event: string, ...args: any[]) {
    socket.value?.emit(event, ...args);
  }

  return {
    socket,
    connected,
    connect,
    disconnect,
    on,
    off,
    emit,
  };
});
