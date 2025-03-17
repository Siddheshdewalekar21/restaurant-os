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

/**
 * Initialize a socket connection with authentication token
 * @param token Authentication token
 * @returns Socket instance or null if connection fails
 */
export function initializeSocket(token: string): Socket | null {
  try {
    // If we already have a socket instance and it's connected, return it
    if (socket && socket.connected) {
      return socket;
    }

    // If we have a disconnected socket, try to reconnect it
    if (socket) {
      socket.connect();
      return socket;
    }

    // Get the socket server URL from environment variables or use default
    const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
    
    // Create a new socket instance
    socket = io(socketUrl, {
      auth: { token },
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 5000,
      transports: ['websocket', 'polling'],
    });

    // Add error handling
    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
      toast.error(`Connection error: ${err.message}`);
      
      // If we've reached max reconnection attempts, set socket to null
      if (socket && socket.io.reconnectionAttempts === 0) {
        console.log('Max reconnection attempts reached, giving up');
        socket.disconnect();
        socket = null;
      }
    });

    socket.on('error', (err) => {
      console.error('Socket error:', err);
      toast.error(`Socket error: ${err}`);
    });

    return socket;
  } catch (error) {
    console.error('Failed to initialize socket:', error);
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
 * Disconnect the socket
 */
export function disconnectSocket(): void {
  if (socket) {
    socket.disconnect();
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
  if (!socket) {
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
  if (!socket) {
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