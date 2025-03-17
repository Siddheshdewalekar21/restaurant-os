'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import { Order, Table, MenuItem, Inventory, Customer } from '@/types';
import DataVisualization from '@/components/DataVisualization';

interface DashboardStatsProps {
  initialData: {
    ordersCount: number;
    tablesCount: number;
    menuItemsCount: number;
    inventoryCount: number;
    customersCount: number;
    lowInventoryCount: number;
    recentOrders: any[];
    salesData: {
      labels: string[];
      data: number[];
    };
    orderTypeData: {
      labels: string[];
      data: number[];
    };
  };
  refreshInterval?: number;
}

export default function DashboardStats({ 
  initialData, 
  refreshInterval = 30000 
}: DashboardStatsProps) {
  const [stats, setStats] = useState(initialData);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Initial load is from server props
    setLastUpdated(new Date());

    // Set up interval for refreshing data
    const intervalId = setInterval(fetchDashboardData, refreshInterval);

    // Clean up interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/dashboard/stats');
      
      if (response.data.success) {
        setStats(response.data.data);
        setLastUpdated(new Date());
      } else {
        setError('Failed to fetch dashboard data');
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('An error occurred while fetching dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Format the last updated time
  const formatLastUpdated = () => {
    return lastUpdated.toLocaleTimeString();
  };

  return (
    <div>
      {/* Last updated indicator */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="text-sm text-gray-500 flex items-center">
          {loading && (
            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-indigo-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          )}
          <span>Last updated: {formatLastUpdated()}</span>
          <button 
            onClick={fetchDashboardData}
            className="ml-2 p-1 rounded-full hover:bg-gray-200 focus:outline-none"
            title="Refresh data"
          >
            <svg className="h-4 w-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
          {error}
        </div>
      )}
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        <StatCard title="Orders" value={stats.ordersCount} color="bg-blue-500" />
        <StatCard title="Tables" value={stats.tablesCount} color="bg-green-500" />
        <StatCard title="Menu Items" value={stats.menuItemsCount} color="bg-yellow-500" />
        <StatCard title="Inventory Items" value={stats.inventoryCount} color="bg-purple-500" />
        <StatCard title="Customers" value={stats.customersCount} color="bg-pink-500" />
        <StatCard title="Low Inventory" value={stats.lowInventoryCount} color="bg-red-500" />
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <DataVisualization
          title="Sales Trend (Last 7 Days)"
          type="line"
          labels={stats.salesData.labels}
          datasets={[{
            label: 'Sales',
            data: stats.salesData.data,
            backgroundColor: 'rgba(79, 70, 229, 0.2)',
            borderColor: 'rgba(79, 70, 229, 1)',
            borderWidth: 2
          }]}
          height={300}
        />
        
        <DataVisualization
          title="Order Types"
          type="doughnut"
          labels={stats.orderTypeData.labels}
          datasets={[{
            label: 'Order Types',
            data: stats.orderTypeData.data,
            backgroundColor: [
              'rgba(79, 70, 229, 0.8)',
              'rgba(16, 185, 129, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)'
            ],
            borderWidth: 1
          }]}
          height={300}
        />
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({ title, value, color }: { title: string; value: number; color: string }) {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className={`${color} h-2`}></div>
      <div className="p-6">
        <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
        <p className="text-3xl font-bold mt-2">{value}</p>
      </div>
    </div>
  );
} 