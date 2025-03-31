import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { Socket } from 'socket.io-client';
import { initializeSocket, disconnectSocket, getSocketError } from '@/lib/socket';
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
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [connectionAttempts, setConnectionAttempts] = useState(0);

  // Initialize socket connection
  useEffect(() => {
    let mounted = true;
    let checkInterval: NodeJS.Timeout | null = null;

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
        setConnectionError('No authentication token available');
        return;
      }
      
      console.log('Initializing socket with token');
      setConnectionAttempts(prev => prev + 1);
      
      // Initialize socket connection
      const socketInstance = initializeSocket(token);
      
      if (!socketInstance) {
        console.log('Socket server not available, falling back to polling');
        setIsSocketAvailable(false);
        setIsConnected(false);
        setConnectionError(getSocketError() || 'Could not initialize socket connection');
        return;
      }
      
      if (mounted) {
        setSocket(socketInstance);
        setIsConnected(socketInstance.connected);
        setConnectionError(null);
      }
      
      // Check socket status periodically
      checkInterval = setInterval(() => {
        if (!mounted) return;
        
        // Update connection state
        if (socketInstance) {
          setIsConnected(socketInstance.connected);
          // Update error state
          const currentError = getSocketError();
          if (currentError !== connectionError) {
            setConnectionError(currentError);
          }
        }
      }, 5000);
      
      // Handle connect/disconnect events
      socketInstance.on('connect', () => {
        if (!mounted) return;
        console.log('Socket connected');
        setIsConnected(true);
        setConnectionError(null);
        toast.success('Connected to real-time updates');
      });
      
      socketInstance.on('disconnect', (reason) => {
        if (!mounted) return;
        console.log(`Socket disconnected: ${reason}`);
        setIsConnected(false);
        setConnectionError(`Disconnected: ${reason}`);
        
        if (reason !== 'io client disconnect') {
          // Only show toast for unexpected disconnections
          toast.error(`Disconnected from real-time updates: ${reason}`);
        }
      });
      
      // Clean up on unmount
      return () => {
        mounted = false;
        
        if (checkInterval) {
          clearInterval(checkInterval);
        }
        
        console.log('Cleaning up socket connection');
        if (socketInstance) {
          socketInstance.off('connect');
          socketInstance.off('disconnect');
          
          // Don't disconnect if component is just unmounting
          // disconnectSocket();
        }
      };
    } catch (error) {
      console.error('Error initializing socket:', error);
      setIsSocketAvailable(false);
      setIsConnected(false);
      setConnectionError(error instanceof Error ? error.message : 'Unknown socket error');
      
      return () => {
        mounted = false;
        if (checkInterval) {
          clearInterval(checkInterval);
        }
      };
    }
  }, [session, status]);

  // Reconnect function
  const reconnect = useCallback(() => {
    if (!session?.accessToken) {
      toast.error('No authentication token available');
      setConnectionError('No authentication token available');
      return;
    }
    
    try {
      disconnectSocket();
      setConnectionAttempts(prev => prev + 1);
      
      // Add a short delay before reconnecting
      setTimeout(() => {
        const socketInstance = initializeSocket(session.accessToken);
        
        if (socketInstance) {
          setSocket(socketInstance);
          setConnectionError(null);
          toast.success('Reconnecting...');
        } else {
          const errorMsg = getSocketError() || 'Failed to reconnect';
          setConnectionError(errorMsg);
          toast.error(errorMsg);
        }
      }, 1000);
    } catch (error) {
      console.error('Error reconnecting:', error);
      const errorMsg = error instanceof Error ? error.message : 'Failed to reconnect';
      setConnectionError(errorMsg);
      toast.error(errorMsg);
    }
  }, [session]);

  // Get socket diagnostics for troubleshooting
  const getDiagnostics = useCallback(() => {
    return {
      sessionStatus: status,
      hasToken: !!session?.accessToken,
      socketInitialized: !!socket,
      socketConnected: isConnected,
      socketAvailable: isSocketAvailable,
      connectionError,
      connectionAttempts,
      socketId: socket?.id || 'none'
    };
  }, [socket, isConnected, isSocketAvailable, connectionError, connectionAttempts, session, status]);

  return {
    socket,
    isConnected,
    isSocketAvailable,
    connectionError,
    connectionAttempts,
    reconnect,
    getDiagnostics
  };
}

export default useSocket; 