'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { subscribeToOrderUpdates } from '@/lib/socket';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';
import useSocket from '@/hooks/useSocket';

// Define order interface
interface Order {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  tableNumber?: string;
  customerName?: string;
  total: number;
}

export default function RealTimeOrderTracking() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { socket, isConnected, isSocketAvailable, reconnect } = useSocket();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to order updates when socket is connected
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    console.log('Subscribing to order updates');
    
    // Subscribe to order updates
    const unsubscribe = subscribeToOrderUpdates((updatedOrder) => {
      setOrders(prevOrders => {
        // Check if order already exists
        const orderExists = prevOrders.some(order => order.id === updatedOrder.orderId);
        
        if (orderExists) {
          // Update existing order
          return prevOrders.map(order => 
            order.id === updatedOrder.orderId 
              ? { 
                  ...order, 
                  status: updatedOrder.status,
                  updatedAt: updatedOrder.updatedAt
                } 
              : order
          );
        } else {
          // Add new order if it doesn't exist
          const newOrder: Order = {
            id: updatedOrder.orderId,
            orderNumber: updatedOrder.orderNumber,
            status: updatedOrder.status,
            createdAt: updatedOrder.updatedAt,
            updatedAt: updatedOrder.updatedAt,
            tableNumber: updatedOrder.tableNumber,
            total: updatedOrder.total || 0
          };
          
          return [...prevOrders, newOrder];
        }
      });
    });
    
    // Fetch initial orders
    fetchOrders();
    
    return () => {
      unsubscribe();
    };
  }, [socket, isConnected]);

  // Fallback: Poll for orders when socket is not available
  useEffect(() => {
    // Only start polling if socket is not available
    if (isSocketAvailable && isConnected) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }
    
    console.log('Starting polling for orders as fallback');
    
    // Initial fetch
    fetchOrders();
    
    // Set up polling interval (every 10 seconds)
    pollingIntervalRef.current = setInterval(fetchOrders, 10000);
    
    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isSocketAvailable, isConnected]);

  // Fetch orders from API
  const fetchOrders = async () => {
    try {
      const response = await fetch('/api/orders?limit=10');
      const data = await response.json();
      
      if (data.success && Array.isArray(data.data)) {
        setOrders(data.data);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-500';
      case 'PREPARING':
        return 'bg-blue-500';
      case 'READY':
        return 'bg-green-500';
      case 'DELIVERED':
        return 'bg-purple-500';
      case 'COMPLETED':
        return 'bg-green-700';
      case 'CANCELLED':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  // Format time ago
  const formatTimeAgo = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown time';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-xl flex items-center justify-between">
          <span>Live Orders</span>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "success" : "destructive"} className="ml-2">
              {isConnected ? 'Connected' : 'Disconnected'}
            </Badge>
            {!isConnected && (
              <button 
                onClick={reconnect}
                className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
              >
                Reconnect
              </button>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!isSocketAvailable && (
          <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
            Real-time updates unavailable. Using polling instead.
          </div>
        )}
        
        {orders.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            No active orders at the moment
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
            {orders.map(order => (
              <div 
                key={order.id} 
                className="p-3 border rounded-lg shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="font-medium">Order #{order.orderNumber}</div>
                    {order.tableNumber && (
                      <div className="text-sm text-gray-600">Table: {order.tableNumber}</div>
                    )}
                    <div className="text-sm text-gray-600">
                      {formatTimeAgo(order.updatedAt)}
                    </div>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {order.status}
                  </Badge>
                </div>
                <div className="mt-2 text-sm font-medium">
                  ${order.total.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 