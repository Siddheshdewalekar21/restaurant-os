'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'react-hot-toast';
import api from '@/lib/api-client';
import useSocket from '@/hooks/useSocket';

export default function SettingsPage() {
  const { data: session } = useSession();
  const { isConnected, reconnect } = useSocket();
  const [loading, setLoading] = useState(false);
  const [userSettings, setUserSettings] = useState({
    notifications: true,
    darkMode: false,
    language: 'en',
    autoRefresh: true,
    refreshInterval: 30,
  });

  // Handle settings change
  const handleSettingChange = (setting: string, value: any) => {
    setUserSettings(prev => ({
      ...prev,
      [setting]: value
    }));

    // In a real app, you would save this to the database
    toast.success(`${setting} updated successfully`);
  };

  // Handle socket reconnection
  const handleReconnect = () => {
    toast.loading('Reconnecting to real-time services...');
    reconnect();
  };

  // Handle cache clearing
  const handleClearCache = () => {
    toast.loading('Clearing application cache...');
    
    // Simulate clearing cache
    setTimeout(() => {
      toast.dismiss();
      toast.success('Application cache cleared successfully');
    }, 1500);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* User Settings */}
        <Card>
          <CardHeader>
            <CardTitle>User Preferences</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Notifications</h3>
                <p className="text-sm text-gray-500">Enable notifications for new orders and updates</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={userSettings.notifications}
                  onChange={(e) => handleSettingChange('notifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Dark Mode</h3>
                <p className="text-sm text-gray-500">Switch between light and dark theme</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={userSettings.darkMode}
                  onChange={(e) => handleSettingChange('darkMode', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Language</h3>
                <p className="text-sm text-gray-500">Select your preferred language</p>
              </div>
              <select 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                value={userSettings.language}
                onChange={(e) => handleSettingChange('language', e.target.value)}
              >
                <option value="en">English</option>
                <option value="hi">Hindi</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
              </select>
            </div>

            <div className="flex justify-between items-center">
              <div>
                <h3 className="font-medium">Auto Refresh</h3>
                <p className="text-sm text-gray-500">Automatically refresh data</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={userSettings.autoRefresh}
                  onChange={(e) => handleSettingChange('autoRefresh', e.target.checked)}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {userSettings.autoRefresh && (
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="font-medium">Refresh Interval (seconds)</h3>
                  <p className="text-sm text-gray-500">How often to refresh data</p>
                </div>
                <select 
                  className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                  value={userSettings.refreshInterval}
                  onChange={(e) => handleSettingChange('refreshInterval', parseInt(e.target.value))}
                >
                  <option value="10">10 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="60">1 minute</option>
                  <option value="300">5 minutes</option>
                </select>
              </div>
            )}
          </CardContent>
        </Card>

        {/* System Settings */}
        <Card>
          <CardHeader>
            <CardTitle>System Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="font-medium">Real-time Connection Status</h3>
              <div className="flex items-center mt-2">
                <span className={`inline-block w-3 h-3 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
                <span className="text-sm">{isConnected ? 'Connected' : 'Disconnected'}</span>
                {!isConnected && (
                  <button 
                    onClick={handleReconnect}
                    className="ml-4 px-3 py-1 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Reconnect
                  </button>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium">User Information</h3>
              <div className="mt-2 p-3 bg-gray-50 rounded-md">
                <p className="text-sm"><span className="font-medium">Name:</span> {session?.user?.name}</p>
                <p className="text-sm"><span className="font-medium">Email:</span> {session?.user?.email}</p>
                <p className="text-sm"><span className="font-medium">Role:</span> {session?.user?.role}</p>
                {session?.user?.branchId && (
                  <p className="text-sm"><span className="font-medium">Branch:</span> {session.user.branchId}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium">Application Cache</h3>
              <p className="text-sm text-gray-500 mt-1">Clear application cache to resolve display issues</p>
              <button 
                onClick={handleClearCache}
                className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Clear Cache
              </button>
            </div>

            <div>
              <h3 className="font-medium">Application Version</h3>
              <p className="text-sm text-gray-500 mt-1">Current version: 1.0.0</p>
              <p className="text-sm text-gray-500">Build date: {new Date().toLocaleDateString()}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restaurant Settings (Admin Only) */}
      {session?.user?.role === 'ADMIN' && (
        <Card>
          <CardHeader>
            <CardTitle>Restaurant Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium">Tax Rate</h3>
                <p className="text-sm text-gray-500 mt-1">Set the default tax rate for orders</p>
                <div className="flex items-center mt-2">
                  <input 
                    type="number" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 w-24"
                    defaultValue="10"
                    min="0"
                    max="30"
                    step="0.5"
                  />
                  <span className="ml-2">%</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium">Service Charge</h3>
                <p className="text-sm text-gray-500 mt-1">Set the default service charge</p>
                <div className="flex items-center mt-2">
                  <input 
                    type="number" 
                    className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5 w-24"
                    defaultValue="5"
                    min="0"
                    max="20"
                    step="0.5"
                  />
                  <span className="ml-2">%</span>
                </div>
              </div>

              <div>
                <h3 className="font-medium">Currency</h3>
                <p className="text-sm text-gray-500 mt-1">Set the default currency</p>
                <select 
                  className="mt-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                  defaultValue="INR"
                >
                  <option value="INR">Indian Rupee (₹)</option>
                  <option value="USD">US Dollar ($)</option>
                  <option value="EUR">Euro (€)</option>
                  <option value="GBP">British Pound (£)</option>
                </select>
              </div>

              <div>
                <h3 className="font-medium">Default Order Type</h3>
                <p className="text-sm text-gray-500 mt-1">Set the default order type</p>
                <select 
                  className="mt-2 bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-indigo-500 focus:border-indigo-500 block p-2.5"
                  defaultValue="DINE_IN"
                >
                  <option value="DINE_IN">Dine In</option>
                  <option value="TAKEAWAY">Takeaway</option>
                  <option value="DELIVERY">Delivery</option>
                </select>
              </div>
            </div>

            <div className="mt-6">
              <button 
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                onClick={() => toast.success('Restaurant settings saved successfully')}
              >
                Save Restaurant Settings
              </button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 