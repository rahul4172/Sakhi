import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_BASE_URL } from '../api/client';

let socket: Socket | null = null;

export const useSocket = (userId?: string | null) => {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!socket) {
      socket = io(API_BASE_URL);
    }

    const onConnect = () => {
      setIsConnected(true);
      if (userId) {
        socket?.emit('join', userId);
      }
    };

    const onDisconnect = () => setIsConnected(false);

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);

    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket?.off('connect', onConnect);
      socket?.off('disconnect', onDisconnect);
    };
  }, [userId]);

  return { socket, isConnected };
};
