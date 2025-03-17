#!/usr/bin/env node

/**
 * Script to start the WebSocket server for real-time order tracking
 */

// Load environment variables
require('dotenv').config();

console.log('Starting WebSocket server for real-time order tracking...');

try {
  // Import the socket server
  const socketServer = require('../dist/server/socket-server');
  
  console.log(`WebSocket server running on port ${process.env.SOCKET_PORT || 3001}`);
  console.log('Press Ctrl+C to stop the server');
} catch (error) {
  console.error('Failed to start socket server:', error);
  process.exit(1);
} 