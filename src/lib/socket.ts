import { io, Socket } from 'socket.io-client';
import toast from 'react-hot-toast';

// Define event types for type safety
export interface OrderUpdateEvent {
  orderId: string;
  status: string;
  updatedAt: string;
  updatedBy?: {
    id: string;
    name: string;
  };
}

export interface KitchenTicketEvent {
  orderId: string;
  orderNumber: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    notes?: string;
  }>;
  tableNumber?: number;
  createdAt: string;
}

export interface TableStatusEvent {
  tableId: string;
  status: string;
  updatedAt: string;
}

// Keep a single socket instance
let socket: Socket | null = null;
let socketError: string | null = null;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;

/**
 * Initialize a socket connection with authentication token
 * @param token Authentication token
 * @returns Socket instance or null if connection fails
 */
export function initializeSocket(token: string): Socket | null {
  try {
    // If we already have a socket instance and it's connected, return it
    if (socket && socket.connected) {
      socketError = null;
      return socket;
    }

    // If we have a disconnected socket, try to reconnect it
    if (socket) {
      try {
        socket.connect();
        socketError = null;
        return socket;
      } catch (reconnectError) {
        console.error('Socket reconnection failed:', reconnectError);
        // Continue to create a new socket
      }
    }

    // Get the socket server URL from environment variables or use default
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    console.log(`Initializing socket connection to ${socketUrl}`);
    
    // Create a new socket instance with more resilient configuration
    socket = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 1000,
      timeout: 10000, // Increased timeout
      transports: ['polling', 'websocket'], // Try polling first, then websocket
      autoConnect: true,
      forceNew: true, // Force a new connection
    });

    // Add connection event handlers
    socket.on('connect', () => {
      console.log('Socket connected successfully');
      reconnectAttempts = 0;
      socketError = null;
    });

    // Add error handling
    socket.on('connect_error', (err) => {
      reconnectAttempts++;
      socketError = err.message;
      console.error(`Socket connection error (attempt ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS}):`, err.message);
      
      // Only show toast error on first attempt to avoid spam
      if (reconnectAttempts === 1) {
        toast.error(`Connection error: ${err.message}. Will retry...`);
      }
      
      // If we've reached max reconnection attempts, set socket to null
      if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.log('Max reconnection attempts reached, falling back to HTTP');
        if (socket) {
          socket.disconnect();
          socket = null;
        }
        toast.error('Could not establish real-time connection. Using fallback mode.');
      }
    });

    socket.on('error', (err) => {
      socketError = typeof err === 'string' ? err : 'Unknown socket error';
      console.error('Socket error:', err);
      
      if (typeof err === 'string') {
        toast.error(`Socket error: ${err}`);
      } else {
        toast.error('An error occurred with the real-time connection');
      }
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${reason}`);
      
      // If the server initiated the disconnect, attempt to reconnect
      if (reason === 'io server disconnect') {
        console.log('Server disconnected the socket, attempting to reconnect');
        socket?.connect();
      }
      
      // If client was forced to disconnect due to connection issues
      if (reason === 'transport close' || reason === 'transport error') {
        toast.error('Lost connection to server. Will try to reconnect...');
      }
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
    socketError = error instanceof Error ? error.message : 'Unknown error initializing socket';
    toast.error('Could not connect to real-time services');
    return null;
  }
}

/**
 * Get the current socket instance
 * @returns Current socket instance or null if not initialized
 */
export function getSocket(): Socket | null {
  return socket;
}

/**
 * Get the last socket error if any
 * @returns Last socket error message or null
 */
export function getSocketError(): string | null {
  return socketError;
}

/**
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    socketError = null;
    reconnectAttempts = 0;
  }
}

// Subscribe to order updates
export const subscribeToOrderUpdates = (callback: (data: OrderUpdateEvent) => void): () => void => {
  if (!socket) return () => {}; // Return a no-op function if socket is null
  
  socket.on('order:update', callback);
  
  // Return an unsubscribe function
  return () => {
    if (socket) {
      socket.off('order:update', callback);
    }
  };
};

// Subscribe to kitchen tickets
export const subscribeToKitchenTickets = (callback: (data: KitchenTicketEvent) => void): () => void => {
  if (!socket) return () => {}; // Return a no-op function if socket is null
  
  socket.on('kitchen:ticket', callback);
  
  // Return an unsubscribe function
  return () => {
    if (socket) {
      socket.off('kitchen:ticket', callback);
    }
  };
};

// Subscribe to table status updates
export const subscribeToTableUpdates = (callback: (data: TableStatusEvent) => void): () => void => {
  if (!socket) return () => {}; // Return a no-op function if socket is null
  
  socket.on('table:update', callback);
  
  // Return an unsubscribe function
  return () => {
    if (socket) {
      socket.off('table:update', callback);
    }
  };
};

// These functions are now deprecated since the subscribe functions return unsubscribe functions
export const unsubscribeFromOrderUpdates = (): void => {
  if (!socket) return;
  socket.off('order:update');
};

export const unsubscribeFromKitchenTickets = (): void => {
  if (!socket) return;
  socket.off('kitchen:ticket');
};

export const unsubscribeFromTableUpdates = (): void => {
  if (!socket) return;
  socket.off('table:update');
};

// Send order status update
export const sendOrderStatusUpdate = (orderId: string, status: string): void => {
  if (!socket || !socket.connected) {
    // Fallback: Make a direct API call to update order status
    fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(err => console.error('Error updating order status via API:', err));
    return;
  }
  socket.emit('order:status:update', { orderId, status });
};

// Send table status update
export const sendTableStatusUpdate = (tableId: string, status: string): void => {
  if (!socket || !socket.connected) {
    // Fallback: Make a direct API call to update table status
    fetch(`/api/tables/${tableId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status })
    }).catch(err => console.error('Error updating table status via API:', err));
    return;
  }
  socket.emit('table:status:update', { tableId, status });
};

export default {
  initializeSocket,
  getSocket,
  getSocketError,
  disconnectSocket,
  subscribeToOrderUpdates,
  subscribeToKitchenTickets,
  subscribeToTableUpdates,
  unsubscribeFromOrderUpdates,
  unsubscribeFromKitchenTickets,
  unsubscribeFromTableUpdates,
  sendOrderStatusUpdate,
  sendTableStatusUpdate
}; 