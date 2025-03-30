<<<<<<< HEAD
import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { verify } from 'jsonwebtoken';
import prisma from '../lib/prisma';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Create HTTP server
const httpServer = createServer((req, res) => {
  // Simple health check endpoint
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', uptime: process.uptime() }));
    return;
  }
  
  // Default response for other routes
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not found' }));
});

// Socket.io server instance
const io = new Server(httpServer, {
  cors: {
    origin: process.env.NEXTAUTH_URL || 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 10000,
  pingInterval: 5000,
  connectTimeout: 10000,
  transports: ['websocket', 'polling']
});

// JWT authentication middleware
interface JwtPayload {
  id: string;
  role: string;
  branchId?: string;
}

// Define socket type with user property
interface AuthenticatedSocket extends Socket {
  user: {
    id: string;
    role: string;
    branchId?: string;
    name?: string;
  };
}

io.use(async (socket: Socket, next: (err?: Error) => void) => {
  try {
    const token = socket.handshake.auth.token;
    
    if (!token) {
      return next(new Error('Authentication error: Token required'));
    }
    
    // Verify JWT token
    const jwtSecret = process.env.JWT_SECRET || process.env.NEXTAUTH_SECRET || 'your-super-secret-jwt-key-for-restaurant-os';
    const decoded = verify(token, jwtSecret) as JwtPayload;
    
    // Attach user data to socket
    (socket as AuthenticatedSocket).user = {
      id: decoded.id,
      role: decoded.role,
      branchId: decoded.branchId
    };
    
    next();
  } catch (error) {
    console.error('Socket authentication error:', error);
    next(new Error('Authentication error: Invalid token'));
  }
});

// Track connected clients
let connectedClients = 0;

// Connection handler
io.on('connection', (socket: Socket) => {
  const authSocket = socket as AuthenticatedSocket;
  connectedClients++;
  console.log(`Socket connected: ${authSocket.id} (User: ${authSocket.user.id}). Total clients: ${connectedClients}`);
  
  // Join rooms based on user role and branch
  if (authSocket.user.branchId) {
    authSocket.join(`branch:${authSocket.user.branchId}`);
  }
  
  // Join role-based rooms
  authSocket.join(`role:${authSocket.user.role}`);
  
  // Join user-specific room
  authSocket.join(`user:${authSocket.user.id}`);
  
  // Handle disconnection
  authSocket.on('disconnect', (reason: string) => {
    connectedClients--;
    console.log(`Socket disconnected: ${authSocket.id}. Reason: ${reason}. Total clients: ${connectedClients}`);
  });
  
  // Handle errors
  authSocket.on('error', (error: Error) => {
    console.error(`Socket error for ${authSocket.id}:`, error);
  });
  
  // Handle order status updates
  interface OrderStatusUpdateData {
    orderId: string;
    status: string;
  }

  interface CallbackResponse {
    success: boolean;
    error?: string;
  }
  
  authSocket.on('order:status:update', async (data: OrderStatusUpdateData, callback: (response: CallbackResponse) => void) => {
    try {
      const { orderId, status } = data;
      
      if (!orderId || !status) {
        const error = 'Invalid data: orderId and status are required';
        console.error(error);
        if (callback) callback({ success: false, error });
        return;
      }
      
      // Update order in database
      const updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: { status },
        include: {
          table: {
            select: {
              id: true,
              branchId: true,
              tableNumber: true
            }
          },
          items: {
            include: {
              menuItem: {
                select: {
                  id: true,
                  name: true
                }
              }
            }
          }
        }
      });
      
      // Broadcast to relevant rooms
      const eventData = {
        orderId: updatedOrder.id,
        orderNumber: updatedOrder.orderNumber,
        status: updatedOrder.status,
        updatedAt: new Date().toISOString(),
        updatedBy: {
          id: authSocket.user.id,
          name: authSocket.user.name || 'Staff'
        }
      };
      
      // Broadcast to branch room
      if (updatedOrder.branchId) {
        io.to(`branch:${updatedOrder.branchId}`).emit('order:status:updated', eventData);
      }
      
      // If status is changed to PREPARING, emit kitchen ticket event
      if (status === 'PREPARING') {
        const kitchenTicket = {
          orderId: updatedOrder.id,
          orderNumber: updatedOrder.orderNumber,
          status: 'NEW',
          items: updatedOrder.items.map(item => ({
            id: item.id,
            name: item.menuItem.name,
            quantity: item.quantity,
            notes: item.notes || undefined
          })),
          tableNumber: updatedOrder.table?.tableNumber,
          createdAt: new Date().toISOString()
        };
        
        if (updatedOrder.branchId) {
          io.to(`branch:${updatedOrder.branchId}`).emit('kitchen:ticket:new', kitchenTicket);
        }
      }
      
      console.log(`Order ${orderId} status updated to ${status}`);
      
      // Send acknowledgment if callback exists
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error updating order status:', error);
      authSocket.emit('error', { message: 'Failed to update order status' });
      
      // Send error if callback exists
      if (callback) callback({ success: false, error: 'Failed to update order status' });
    }
  });
  
  // Handle table status updates
  interface TableStatusUpdateData {
    tableId: string;
    status: string;
  }
  
  authSocket.on('table:status:update', async (data: TableStatusUpdateData, callback: (response: CallbackResponse) => void) => {
    try {
      const { tableId, status } = data;
      
      if (!tableId || !status) {
        const error = 'Invalid data: tableId and status are required';
        console.error(error);
        if (callback) callback({ success: false, error });
        return;
      }
      
      // Update table in database
      const updatedTable = await prisma.table.update({
        where: { id: tableId },
        data: { status }
      });
      
      // Broadcast to relevant rooms
      const eventData = {
        tableId: updatedTable.id,
        status: updatedTable.status,
        updatedAt: new Date().toISOString()
      };
      
      // Broadcast to branch room
      if (updatedTable.branchId) {
        io.to(`branch:${updatedTable.branchId}`).emit('table:status:updated', eventData);
      }
      
      console.log(`Table ${tableId} status updated to ${status}`);
      
      // Send acknowledgment if callback exists
      if (callback) callback({ success: true });
    } catch (error) {
      console.error('Error updating table status:', error);
      authSocket.emit('error', { message: 'Failed to update table status' });
      
      // Send error if callback exists
      if (callback) callback({ success: false, error: 'Failed to update table status' });
    }
  });
});

// Start the server
const PORT = process.env.SOCKET_PORT || 3001;
const server = httpServer.listen(PORT, () => {
  console.log(`Socket.io server running on port ${PORT}`);
});

// Graceful shutdown
function shutdown() {
  console.log('Shutting down socket server...');
  server.close(() => {
    console.log('Socket server closed');
    process.exit(0);
  });
  
  // Force close after 10s
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

module.exports = io; 
=======
const PORT = 3002; 
>>>>>>> master
