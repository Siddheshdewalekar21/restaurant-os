import React from 'react';
import useSocket from '@/hooks/useSocket';
import { Button } from './ui/Button';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from './ui/Card';

export default function SocketDiagnostics() {
  const {
    isConnected,
    isSocketAvailable,
    connectionError,
    connectionAttempts,
    reconnect,
    getDiagnostics
  } = useSocket();

  const diagnostics = getDiagnostics();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Real-Time Connection Diagnostics</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <span className="font-medium">Connection Status:</span>
          <span className={`px-2 py-1 rounded text-white ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}>
            {isConnected ? 'Connected' : 'Disconnected'}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="font-medium">Socket Available:</span>
          <span className={`px-2 py-1 rounded text-white ${isSocketAvailable ? 'bg-green-500' : 'bg-yellow-500'}`}>
            {isSocketAvailable ? 'Yes' : 'No'}
          </span>
        </div>

        {connectionError && (
          <div className="p-3 bg-red-50 border border-red-200 rounded">
            <h4 className="font-medium text-red-800">Connection Error:</h4>
            <p className="text-red-700 text-sm">{connectionError}</p>
          </div>
        )}

        <div className="border rounded p-3">
          <h4 className="font-medium mb-2">Connection Details:</h4>
          <ul className="space-y-1 text-sm">
            <li><span className="font-medium">Session Status:</span> {diagnostics.sessionStatus}</li>
            <li><span className="font-medium">Auth Token:</span> {diagnostics.hasToken ? 'Available' : 'Not Available'}</li>
            <li><span className="font-medium">Socket ID:</span> {diagnostics.socketId}</li>
            <li><span className="font-medium">Connection Attempts:</span> {connectionAttempts}</li>
          </ul>
        </div>

        <div className="border rounded p-3">
          <h4 className="font-medium mb-2">Troubleshooting:</h4>
          <ul className="list-disc ml-5 text-sm space-y-1">
            <li>Make sure your socket server is running</li>
            <li>Check that your authentication token is valid</li>
            <li>Verify the NEXT_PUBLIC_SOCKET_URL environment variable is set correctly</li>
            <li>Ensure your browser supports WebSockets</li>
            <li>Check if any browser extensions or firewalls are blocking connections</li>
          </ul>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          onClick={reconnect}
          variant="primary"
          className="bg-indigo-600 hover:bg-indigo-700 text-white"
        >
          Reconnect
        </Button>
        
        <Button
          onClick={() => window.location.reload()}
          variant="outline"
          className="border-gray-300"
        >
          Refresh Page
        </Button>
      </CardFooter>
    </Card>
  );
} 