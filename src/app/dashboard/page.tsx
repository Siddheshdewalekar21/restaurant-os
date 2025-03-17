'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import Link from 'next/link';
import api from '@/lib/api-client';
import { toast } from 'react-hot-toast';

// Type definitions for our dashboard data
interface DashboardStats {
  stats: {
    totalSales: number;
    salesChange: number;
    totalOrders: number;
    ordersChange: number;
    activeOrders: number;
    customers: number;
    customersChange: number;
  };
  recentOrders: {
    id: string;
    orderNumber: string;
    customer: string;
    status: string;
    amount: number;
  }[];
  popularItems: {
    id: string;
    name: string;
    category: string;
    price: number;
    quantity: number;
  }[];
}

export default function DashboardPage() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds by default

  // Fetch dashboard data function (memoized with useCallback)
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get('/dashboard/stats');
      console.log('Dashboard data:', response);
      setDashboardData(response);
      setLastUpdated(new Date());
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Failed to load dashboard data');
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Set up polling for real-time updates
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    
    if (autoRefresh) {
      intervalId = setInterval(() => {
        console.log('Auto-refreshing dashboard data...');
        fetchDashboardData();
      }, refreshInterval);
    }
    
    // Clean up interval on component unmount or when autoRefresh changes
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [autoRefresh, refreshInterval, fetchDashboardData]);

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  // Helper function to get status badge color
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'DELIVERED':
        return 'bg-indigo-100 text-indigo-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Helper function to get change badge color
  const getChangeBadgeClass = (change: number) => {
    if (change > 0) return 'text-green-600 bg-green-100';
    if (change < 0) return 'text-red-600 bg-red-100';
    return 'text-yellow-600 bg-yellow-100';
  };

  // Helper function to format change text
  const formatChange = (change: number) => {
    if (change > 0) return `+${change}% from last week`;
    if (change < 0) return `${change}% from last week`;
    return 'Same as last week';
  };

  // Format the last updated time
  const formatLastUpdated = () => {
    if (!lastUpdated) return '';
    return lastUpdated.toLocaleTimeString();
  };

  // Toggle auto-refresh
  const toggleAutoRefresh = () => {
    setAutoRefresh(!autoRefresh);
    toast.success(autoRefresh ? 'Auto-refresh disabled' : 'Auto-refresh enabled');
  };

  // Manual refresh
  const handleManualRefresh = () => {
    toast.success('Refreshing dashboard data...');
    fetchDashboardData();
  };

  if (loading && !dashboardData) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (error && !dashboardData) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <p className="font-bold">Error</p>
        <p>{error}</p>
        <button 
          onClick={handleManualRefresh}
          className="mt-2 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-6">
        <p>No dashboard data available. Please try again later.</p>
        <button 
          onClick={handleManualRefresh}
          className="mt-2 px-4 py-2 bg-yellow-600 text-white rounded-md hover:bg-yellow-700"
        >
          Try Again
        </button>
      </div>
    );
  }

  const { stats, recentOrders, popularItems } = dashboardData;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome to your restaurant management dashboard</p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="text-sm text-gray-500">
            {lastUpdated && (
              <span>Last updated: {formatLastUpdated()}</span>
            )}
          </div>
          <button
            onClick={toggleAutoRefresh}
            className={`p-2 rounded-md ${autoRefresh ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
            title={autoRefresh ? 'Auto-refresh is on' : 'Auto-refresh is off'}
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            onClick={handleManualRefresh}
            className="p-2 bg-indigo-100 text-indigo-800 rounded-md"
            title="Refresh data"
            disabled={loading}
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Sales</h3>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalSales)}</p>
          <span className={`text-xs ${getChangeBadgeClass(stats.salesChange)} px-2 py-1 rounded-full`}>
            {formatChange(stats.salesChange)}
          </span>
        </Card>
        
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Total Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
          <span className={`text-xs ${getChangeBadgeClass(stats.ordersChange)} px-2 py-1 rounded-full`}>
            {formatChange(stats.ordersChange)}
          </span>
        </Card>
        
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Active Orders</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.activeOrders}</p>
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-indigo-600 h-2 rounded-full" 
                style={{ width: `${Math.min((stats.activeOrders / 20) * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </Card>
        
        <Card className="p-6 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-500">Customers Today</h3>
          <p className="text-2xl font-bold text-gray-900">{stats.customers}</p>
          <span className={`text-xs ${getChangeBadgeClass(stats.customersChange)} px-2 py-1 rounded-full`}>
            {stats.customersChange === 0 
              ? 'Same as yesterday' 
              : `${stats.customersChange > 0 ? '+' : ''}${stats.customersChange}% from yesterday`}
          </span>
        </Card>
      </div>

      {/* Recent Orders and Popular Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Orders</h3>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order ID</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Customer</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{order.orderNumber}</td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{order.customer}</td>
                      <td className="px-3 py-2 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${getStatusBadgeClass(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">{formatCurrency(order.amount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 text-center">
              <Link href="/dashboard/orders" className="text-sm text-indigo-600 hover:text-indigo-800">
                View all orders →
              </Link>
            </div>
          </div>
        </Card>
        
        <Card className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Popular Items</h3>
          </div>
          <div className="p-6">
            <ul className="divide-y divide-gray-200">
              {popularItems.map((item) => (
                <li key={item.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded bg-gray-200 flex-shrink-0"></div>
                    <div className="ml-3">
                      <p className="text-sm font-medium text-gray-900">{item.name}</p>
                      <p className="text-xs text-gray-500">{item.category}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">{formatCurrency(Number(item.price))}</p>
                    <p className="text-xs text-gray-500">{item.quantity} orders</p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-center">
              <Link href="/dashboard/menu" className="text-sm text-indigo-600 hover:text-indigo-800">
                View all items →
              </Link>
            </div>
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="mb-8">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <Link href="/dashboard/orders/new" className="p-4 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-indigo-50 transition-colors">
            <svg className="h-6 w-6 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span className="text-xs font-medium text-gray-700">New Order</span>
          </Link>
          <Link href="/dashboard/customers" className="p-4 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-indigo-50 transition-colors">
            <svg className="h-6 w-6 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Add Customer</span>
          </Link>
          <Link href="/dashboard/menu" className="p-4 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-indigo-50 transition-colors">
            <svg className="h-6 w-6 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Update Menu</span>
          </Link>
          <Link href="/dashboard/analytics" className="p-4 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-indigo-50 transition-colors">
            <svg className="h-6 w-6 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">View Reports</span>
          </Link>
          <Link href="/dashboard/inventory" className="p-4 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-indigo-50 transition-colors">
            <svg className="h-6 w-6 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Inventory</span>
          </Link>
          <Link href="/dashboard/settings" className="p-4 bg-white rounded-lg shadow-sm flex flex-col items-center justify-center hover:bg-indigo-50 transition-colors">
            <svg className="h-6 w-6 text-indigo-600 mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-xs font-medium text-gray-700">Settings</span>
          </Link>
        </div>
      </div>

      {/* Refresh Interval Settings */}
      {autoRefresh && (
        <div className="mb-8 p-4 bg-white rounded-lg shadow-sm">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Auto-Refresh Interval</h3>
          <div className="flex items-center space-x-4">
            <button 
              onClick={() => setRefreshInterval(10000)} 
              className={`px-3 py-1 rounded-md ${refreshInterval === 10000 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              10s
            </button>
            <button 
              onClick={() => setRefreshInterval(30000)} 
              className={`px-3 py-1 rounded-md ${refreshInterval === 30000 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              30s
            </button>
            <button 
              onClick={() => setRefreshInterval(60000)} 
              className={`px-3 py-1 rounded-md ${refreshInterval === 60000 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              1m
            </button>
            <button 
              onClick={() => setRefreshInterval(300000)} 
              className={`px-3 py-1 rounded-md ${refreshInterval === 300000 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-800'}`}
            >
              5m
            </button>
          </div>
        </div>
      )}
    </div>
  );
} 