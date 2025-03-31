'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { io, Socket } from 'socket.io-client';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import SocketDiagnostics from '@/components/SocketDiagnostics';
import useSocket from '@/hooks/useSocket';

export default function SocketTestPage() {
  const { data: session } = useSession();
  const { socket, isConnected, connectionError, reconnect, getDiagnostics } = useSocket();
  const [testResults, setTestResults] = useState<{[key: string]: boolean | string | null}>({
    canConnect: null,
    canReconnect: null,
    canSendMessage: null,
    canReceiveMessage: null,
    lastError: null
  });
  const [testMessage, setTestMessage] = useState<string | null>(null);
  const [testInProgress, setTestInProgress] = useState(false);

  // Test basic socket connection
  const testConnection = async () => {
    setTestInProgress(true);
    setTestResults(prev => ({ ...prev, canConnect: null, lastError: null }));

    try {
      // Get current diagnostics
      const diag = getDiagnostics();
      
      if (isConnected && socket) {
        setTestResults(prev => ({ ...prev, canConnect: true }));
        return true;
      } else {
        // Try to reconnect
        reconnect();
        
        // Wait for connection to establish
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        if (isConnected) {
          setTestResults(prev => ({ ...prev, canConnect: true }));
          return true;
        } else {
          setTestResults(prev => ({ 
            ...prev, 
            canConnect: false,
            lastError: connectionError || 'Could not establish connection'
          }));
          return false;
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown connection error';
      setTestResults(prev => ({ ...prev, canConnect: false, lastError: errorMessage }));
      return false;
    } finally {
      setTestInProgress(false);
    }
  };

  // Test message sending and receiving
  const testMessaging = async () => {
    setTestInProgress(true);
    setTestResults(prev => ({ 
      ...prev, 
      canSendMessage: null, 
      canReceiveMessage: null, 
      lastError: null 
    }));
    
    try {
      if (!socket || !isConnected) {
        const connected = await testConnection();
        if (!connected) return;
      }
      
      // Setup message listener
      const messagePromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);
        
        socket?.once('test:echo', (msg: string) => {
          clearTimeout(timeout);
          setTestMessage(msg);
          resolve(true);
        });
      });
      
      // Send test message
      const testMsg = `test-${Date.now()}`;
      socket?.emit('test:message', testMsg);
      setTestResults(prev => ({ ...prev, canSendMessage: true }));
      
      // Wait for response
      const received = await messagePromise;
      setTestResults(prev => ({ ...prev, canReceiveMessage: received }));
      
      if (!received) {
        setTestResults(prev => ({ 
          ...prev, 
          lastError: 'Message sent but no response received within timeout period'
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown messaging error';
      setTestResults(prev => ({ 
        ...prev,
        canSendMessage: false,
        canReceiveMessage: false,
        lastError: errorMessage
      }));
    } finally {
      setTestInProgress(false);
    }
  };

  // Test manual direct socket connection
  const testDirectConnection = async () => {
    setTestInProgress(true);
    setTestResults(prev => ({ ...prev, canConnect: null, lastError: null }));
    
    try {
      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001';
      const token = session?.accessToken;
      
      if (!token) {
        throw new Error('No authentication token available');
      }
      
      // Try direct connection with both transports
      const directSocket = io(socketUrl, {
        auth: { token },
        reconnectionAttempts: 3,
        reconnectionDelay: 1000,
        timeout: 5000,
        transports: ['polling', 'websocket'],
      });
      
      const connectPromise = new Promise<boolean>((resolve, reject) => {
        const timeout = setTimeout(() => {
          resolve(false);
        }, 5000);
        
        directSocket.on('connect', () => {
          clearTimeout(timeout);
          resolve(true);
        });
        
        directSocket.on('connect_error', (err) => {
          clearTimeout(timeout);
          setTestResults(prev => ({ ...prev, lastError: err.message }));
          resolve(false);
        });
      });
      
      const connected = await connectPromise;
      setTestResults(prev => ({ ...prev, canConnect: connected }));
      
      // Cleanup
      directSocket.disconnect();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown direct connection error';
      setTestResults(prev => ({ ...prev, canConnect: false, lastError: errorMessage }));
    } finally {
      setTestInProgress(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Socket Connection Test</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Socket Tests</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-500">Run tests to diagnose connection issues with the real-time server.</p>
              
              <div className="space-y-2">
                <button
                  onClick={testConnection}
                  disabled={testInProgress}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {testInProgress ? 'Testing...' : 'Test Socket Connection'}
                </button>
                
                <button
                  onClick={testMessaging}
                  disabled={testInProgress}
                  className="w-full px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50"
                >
                  {testInProgress ? 'Testing...' : 'Test Message Exchange'}
                </button>
                
                <button
                  onClick={testDirectConnection}
                  disabled={testInProgress}
                  className="w-full px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50"
                >
                  {testInProgress ? 'Testing...' : 'Test Direct Connection'}
                </button>
              </div>
              
              <div className="mt-4 border rounded-md p-4">
                <h3 className="font-medium mb-2">Test Results</h3>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Connection:</span>
                    <span>
                      {testResults.canConnect === null ? 'Not tested' :
                        testResults.canConnect ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Send Message:</span>
                    <span>
                      {testResults.canSendMessage === null ? 'Not tested' :
                        testResults.canSendMessage ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span>Receive Message:</span>
                    <span>
                      {testResults.canReceiveMessage === null ? 'Not tested' :
                        testResults.canReceiveMessage ? '✅ Success' : '❌ Failed'}
                    </span>
                  </div>
                  
                  {testResults.lastError && (
                    <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-700">
                      Error: {testResults.lastError}
                    </div>
                  )}
                  
                  {testMessage && (
                    <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded text-sm text-green-700">
                      Received message: {testMessage}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <SocketDiagnostics />
        </div>
      </div>
    </div>
  );
} 