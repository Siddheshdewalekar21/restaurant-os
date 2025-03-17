import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket } from '@/lib/socket';
import { toast } from 'react-hot-toast';

/**
 * Custom hook for managing socket connections with authentication
 * @returns Socket connection state and socket instance
 */
export function useSocket() {
  const { data: session, status } = useSession();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSocketAvailable, setIsSocketAvailable] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    // Only try to connect if session is loaded and authenticated
    if (status !== 'authenticated' || !session) {
      return;
    }

    try {
      // Get JWT token from session
      const token = session.accessToken;
      
      if (!token) {
        console.warn('No access token available for socket authentication. This is expected during development or after a fresh login.');
        setIsSocketAvailable(false);
        setIsConnected(false);
        return;
      }
      
      console.log('Initializing socket with token');
      
      // Initialize socket connection
      const socketInstance = initializeSocket(token);
      
      if (!socketInstance) {
        console.log('Socket server not available, falling back to polling');
        setIsSocketAvailable(false);
        setIsConnected(false);
        return;
      }
      
      setSocket(socketInstance);
      setIsConnected(socketInstance.connected);
      
      // Handle connect/disconnect events
      socketInstance.on('connect', () => {
        console.log('Socket connected');
        setIsConnected(true);
        toast.success('Connected to real-time updates');
      });
      
      socketInstance.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
        toast.error('Disconnected from real-time updates');
      });
      
      // Clean up on unmount
      return () => {
        console.log('Cleaning up socket connection');
        if (socketInstance) {
          socketInstance.off('connect');
          socketInstance.off('disconnect');
          disconnectSocket();
        }
      };
    } catch (error) {
      console.error('Error initializing socket:', error);
      setIsSocketAvailable(false);
      setIsConnected(false);
    }
  }, [session, status]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!session?.accessToken) {
      toast.error('No authentication token available');
      return;
    }
    
    try {
      disconnectSocket();
      const socketInstance = initializeSocket(session.accessToken);
      
      if (socketInstance) {
        setSocket(socketInstance);
        toast.success('Reconnecting...');
      } else {
        toast.error('Failed to reconnect');
      }
    } catch (error) {
      console.error('Error reconnecting:', error);
      toast.error('Failed to reconnect');
    }
  }, [session]);

  return {
    socket,
    isConnected,
    isSocketAvailable,
    reconnect
  };
}

export default useSocket; 