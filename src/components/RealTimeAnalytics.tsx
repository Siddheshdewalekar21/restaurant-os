'use client';

import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import axios from 'axios';

interface RealTimeMetric {
  id: string;
  label: string;
  value: number | string;
  change: number;
  changeLabel: string;
  icon: string;
  color: string;
}

interface RealTimeAnalyticsProps {
  refreshInterval?: number; // in milliseconds
  showLastUpdated?: boolean;
}

export default function RealTimeAnalytics({
  refreshInterval = 30000, // default to 30 seconds
  showLastUpdated = true,
}: RealTimeAnalyticsProps) {
  const [metrics, setMetrics] = useState<RealTimeMetric[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Function to fetch real-time data
  const fetchRealTimeData = async () => {
    try {
      setLoading(true);
      
      // Fetch data from the API
      const response = await axios.get('/api/analytics/real-time');
      const data = response.data;
      
      // Transform API data into metrics format
      const transformedMetrics: RealTimeMetric[] = [
        {
          id: 'active-orders',
          label: 'Active Orders',
          value: data.metrics.activeOrders.value,
          change: data.metrics.activeOrders.change,
          changeLabel: data.metrics.activeOrders.changeLabel,
          icon: '🍽️',
          color: 'bg-blue-500',
        },
        {
          id: 'kitchen-queue',
          label: 'Kitchen Queue',
          value: data.metrics.kitchenQueue.value,
          change: data.metrics.kitchenQueue.change,
          changeLabel: data.metrics.kitchenQueue.changeLabel,
          icon: '👨‍🍳',
          color: 'bg-yellow-500',
        },
        {
          id: 'avg-wait-time',
          label: 'Avg. Wait Time',
          value: data.metrics.averageWaitTime.value,
          change: data.metrics.averageWaitTime.change,
          changeLabel: data.metrics.averageWaitTime.changeLabel,
          icon: '⏱️',
          color: 'bg-red-500',
        },
        {
          id: 'tables-occupied',
          label: 'Tables Occupied',
          value: data.metrics.tablesOccupied.value,
          change: data.metrics.tablesOccupied.change,
          changeLabel: data.metrics.tablesOccupied.changeLabel,
          icon: '🪑',
          color: 'bg-green-500',
        },
        {
          id: 'sales-today',
          label: 'Sales Today',
          value: `$${Number(data.metrics.salesToday.value).toFixed(2)}`,
          change: data.metrics.salesToday.change,
          changeLabel: data.metrics.salesToday.changeLabel,
          icon: '💰',
          color: 'bg-purple-500',
        },
      ];
      
      setMetrics(transformedMetrics);
      setLastUpdated(new Date());
      setLoading(false);
      setError(null);
    } catch (err) {
      console.error('Error fetching real-time data:', err);
      setError('Failed to fetch real-time data');
      setLoading(false);
      
      // If API fails, use mock data as fallback
      const mockData: RealTimeMetric[] = [
        {
          id: 'active-orders',
          label: 'Active Orders',
          value: Math.floor(Math.random() * 15) + 5,
          change: Math.random() > 0.5 ? 2 : -1,
          changeLabel: 'vs 30m ago',
          icon: '🍽️',
          color: 'bg-blue-500',
        },
        {
          id: 'kitchen-queue',
          label: 'Kitchen Queue',
          value: Math.floor(Math.random() * 10) + 2,
          change: Math.random() > 0.5 ? 1 : -2,
          changeLabel: 'vs 30m ago',
          icon: '👨‍🍳',
          color: 'bg-yellow-500',
        },
        {
          id: 'avg-wait-time',
          label: 'Avg. Wait Time',
          value: `${Math.floor(Math.random() * 10) + 5}m`,
          change: Math.random() > 0.5 ? -2 : 3,
          changeLabel: 'vs 30m ago',
          icon: '⏱️',
          color: 'bg-red-500',
        },
        {
          id: 'tables-occupied',
          label: 'Tables Occupied',
          value: `${Math.floor(Math.random() * 20) + 10}/${Math.floor(Math.random() * 10) + 30}`,
          change: Math.random() > 0.5 ? 2 : -1,
          changeLabel: 'vs 30m ago',
          icon: '🪑',
          color: 'bg-green-500',
        },
        {
          id: 'sales-today',
          label: 'Sales Today',
          value: `$${(Math.random() * 1000 + 500).toFixed(2)}`,
          change: Math.random() > 0.7 ? 5 : 3,
          changeLabel: 'vs yesterday',
          icon: '💰',
          color: 'bg-purple-500',
        },
      ];
      
      setMetrics(mockData);
    }
  };

  // Initial fetch and setup interval
  useEffect(() => {
    fetchRealTimeData();
    
    const intervalId = setInterval(() => {
      fetchRealTimeData();
    }, refreshInterval);
    
    // Cleanup interval on component unmount
    return () => clearInterval(intervalId);
  }, [refreshInterval]);

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-800">Real-Time Analytics</h3>
          {showLastUpdated && (
            <div className="text-sm text-gray-500">
              Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
            </div>
          )}
        </div>
        
        <div className="p-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">
            <p>{error}</p>
            <p className="text-sm mt-1">Using fallback data instead.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mt-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-2">
                  <span className={`${metric.color} text-white p-2 rounded-full mr-2`}>
                    {metric.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`text-sm mt-1 ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% {metric.changeLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 bg-gray-50 border-t border-gray-100">
          <button 
            onClick={fetchRealTimeData}
            className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium transition-colors"
          >
            Refresh Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">Real-Time Analytics</h3>
        {showLastUpdated && (
          <div className="text-sm text-gray-500">
            Updated {formatDistanceToNow(lastUpdated, { addSuffix: true })}
          </div>
        )}
      </div>
      
      <div className="p-4">
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {metrics.map((metric) => (
              <div key={metric.id} className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                <div className="flex items-center mb-2">
                  <span className={`${metric.color} text-white p-2 rounded-full mr-2`}>
                    {metric.icon}
                  </span>
                  <span className="text-sm font-medium text-gray-600">{metric.label}</span>
                </div>
                <div className="text-2xl font-bold">{metric.value}</div>
                <div className={`text-sm mt-1 ${metric.change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {metric.change >= 0 ? '↑' : '↓'} {Math.abs(metric.change)}% {metric.changeLabel}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="p-4 bg-gray-50 border-t border-gray-100">
        <button 
          onClick={fetchRealTimeData}
          className="w-full py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-md text-sm font-medium transition-colors"
        >
          Refresh Now
        </button>
      </div>
    </div>
  );
} 