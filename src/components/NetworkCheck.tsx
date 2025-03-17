'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface NetworkCheckProps {
  onStatusChange?: (isOnline: boolean) => void;
}

interface ServerStatus {
  status: string;
  environment: string;
  serverTime: string;
  responseTime: string;
  services: {
    database: {
      status: string;
      error: string | null;
    };
    redis: {
      status: string;
      error: string | null;
    };
  };
  version: string;
}

export default function NetworkCheck({ onStatusChange }: NetworkCheckProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [apiStatus, setApiStatus] = useState<'checking' | 'ok' | 'error'>('checking');
  const [serverStatus, setServerStatus] = useState<ServerStatus | null>(null);
  const [serverStatusLoading, setServerStatusLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  // Check browser online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      if (onStatusChange) onStatusChange(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      if (onStatusChange) onStatusChange(false);
    };

    // Set initial status
    setIsOnline(navigator.onLine);

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Clean up
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onStatusChange]);

  // Check API connectivity
  const checkApiConnection = async () => {
    try {
      setApiStatus('checking');
      const response = await fetch('/api/test', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        setApiStatus('ok');
      } else {
        setApiStatus('error');
      }
    } catch (error) {
      console.error('API connection check failed:', error);
      setApiStatus('error');
    }
    
    setLastChecked(new Date());
  };

  // Check server status
  const checkServerStatus = async () => {
    try {
      setServerStatusLoading(true);
      const response = await fetch('/api/status', {
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setServerStatus(data.data);
      } else {
        console.error('Server status check failed with status:', response.status);
        setServerStatus(null);
      }
    } catch (error) {
      console.error('Server status check failed:', error);
      setServerStatus(null);
    } finally {
      setServerStatusLoading(false);
    }
  };

  // Run checks on component mount
  useEffect(() => {
    checkApiConnection();
    checkServerStatus();
    
    // Check API connection every 30 seconds
    const interval = setInterval(() => {
      checkApiConnection();
      // Check server status less frequently
      if (Math.random() < 0.3) { // ~30% chance to check server status on each interval
        checkServerStatus();
      }
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  // Run full check
  const runFullCheck = () => {
    checkApiConnection();
    checkServerStatus();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Network Status</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span>Browser Connection:</span>
            <span className={`px-2 py-1 rounded text-sm ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <span>API Connection:</span>
            <span className={`px-2 py-1 rounded text-sm ${
              apiStatus === 'checking' ? 'bg-yellow-100 text-yellow-800' : 
              apiStatus === 'ok' ? 'bg-green-100 text-green-800' : 
              'bg-red-100 text-red-800'
            }`}>
              {apiStatus === 'checking' ? 'Checking...' : 
               apiStatus === 'ok' ? 'Connected' : 
               'Disconnected'}
            </span>
          </div>
          
          {lastChecked && (
            <div className="text-xs text-gray-500">
              Last checked: {lastChecked.toLocaleTimeString()}
            </div>
          )}
          
          <button
            onClick={runFullCheck}
            className="w-full mt-2 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
            disabled={serverStatusLoading}
          >
            {serverStatusLoading ? 'Checking...' : 'Check Connection'}
          </button>
          
          {serverStatus && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-md text-sm">
              <h4 className="font-medium text-gray-800">Server Status:</h4>
              <div className="mt-2 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className={`font-medium ${serverStatus.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                    {serverStatus.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Environment:</span>
                  <span className="font-medium">{serverStatus.environment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Response Time:</span>
                  <span className="font-medium">{serverStatus.responseTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Database:</span>
                  <span className={`font-medium ${serverStatus.services.database.status === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                    {serverStatus.services.database.status}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Redis:</span>
                  <span className={`font-medium ${
                    serverStatus.services.redis.status === 'ok' ? 'text-green-600' : 
                    serverStatus.services.redis.status === 'not_configured' ? 'text-yellow-600' : 
                    'text-red-600'
                  }`}>
                    {serverStatus.services.redis.status}
                  </span>
                </div>
              </div>
            </div>
          )}
          
          {apiStatus === 'error' && (
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md text-sm">
              <h4 className="font-medium text-yellow-800">Troubleshooting Tips:</h4>
              <ul className="mt-2 list-disc list-inside text-yellow-700 space-y-1">
                <li>Check if the server is running</li>
                <li>Verify your network connection</li>
                <li>Check for any firewall or proxy issues</li>
                <li>Try refreshing the page</li>
                <li>Clear browser cache and cookies</li>
                <li>Check if the API URL is correct (currently: {window.location.origin})</li>
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 