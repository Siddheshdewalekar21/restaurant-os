'use client';

import { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  subscribeToKitchenTickets, 
  KitchenTicketEvent,
  sendOrderStatusUpdate
} from '@/lib/socket';
import { toast } from 'react-hot-toast';
import useSocket from '@/hooks/useSocket';

interface KitchenTicket {
  orderId: string;
  orderNumber: string;
  items: Array<{
    id: string;
    name: string;
    quantity: number;
    notes?: string;
  }>;
  tableNumber?: number;
  createdAt: string;
  status: 'NEW' | 'IN_PROGRESS' | 'COMPLETED';
}

interface KitchenOrderTicketProps {
  initialTickets?: KitchenTicket[];
  showCompleted?: boolean;
}

export default function KitchenOrderTicket({
  initialTickets = [],
  showCompleted = false
}: KitchenOrderTicketProps) {
  const [tickets, setTickets] = useState<KitchenTicket[]>(initialTickets);
  const { socket, isConnected, isSocketAvailable, reconnect } = useSocket();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Subscribe to kitchen tickets when socket is connected
  useEffect(() => {
    if (!socket || !isConnected) return;
    
    console.log('Subscribing to kitchen tickets');
    
    const handleKitchenTicket = (data: KitchenTicketEvent) => {
      setTickets(prevTickets => {
        // Check if ticket already exists
        const existingTicketIndex = prevTickets.findIndex(ticket => ticket.orderId === data.orderId);
        
        if (existingTicketIndex >= 0) {
          // Don't duplicate tickets
          return prevTickets;
        }
        
        // Add new ticket
        const newTicket: KitchenTicket = {
          ...data,
          status: 'NEW'
        };
        
        // Add to beginning of array
        return [newTicket, ...prevTickets];
      });
      
      // Play notification sound
      const audio = new Audio('/sounds/new-order.mp3');
      audio.play().catch(err => console.error('Error playing sound:', err));
      
      // Show toast notification
      toast.success(`New order: ${data.orderNumber}`, {
        icon: '🔔',
        duration: 5000
      });
    };
    
    // Subscribe to kitchen tickets and get the unsubscribe function
    const unsubscribe = subscribeToKitchenTickets(handleKitchenTicket);
    
    // Cleanup subscription
    return () => {
      unsubscribe();
    };
  }, [socket, isConnected]);

  // Fallback: Poll for kitchen tickets when socket is not available
  useEffect(() => {
    // Only start polling if socket is not available
    if (isSocketAvailable && isConnected) {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      return;
    }
    
    console.log('Starting polling for kitchen tickets as fallback');
    
    // Function to fetch orders that need kitchen attention
    const fetchKitchenTickets = async () => {
      try {
        // Fetch orders that are in PENDING or PREPARING status
        const response = await fetch('/api/orders?status=PENDING,PREPARING');
        const data = await response.json();
        
        if (data.success && Array.isArray(data.data)) {
          // Format orders to match the kitchen ticket structure
          const formattedTickets = data.data.map((order: any) => ({
            orderId: order.id,
            orderNumber: order.orderNumber,
            status: order.status === 'PENDING' ? 'NEW' : 
                   order.status === 'PREPARING' ? 'IN_PROGRESS' : 'COMPLETED',
            items: (order.items || []).map((item: any) => ({
              id: item.id,
              name: item.menuItem?.name || 'Unknown Item',
              quantity: item.quantity,
              notes: item.notes
            })),
            tableNumber: order.table?.tableNumber,
            createdAt: order.createdAt
          }));
          
          setTickets(formattedTickets);
        }
      } catch (error) {
        console.error('Error polling for kitchen tickets:', error);
      }
    };
    
    // Initial fetch
    fetchKitchenTickets();
    
    // Set up polling interval (every 10 seconds)
    pollingIntervalRef.current = setInterval(fetchKitchenTickets, 10000);
    
    // Clean up interval on unmount
    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [isSocketAvailable, isConnected, showCompleted]);

  // Filter tickets based on showCompleted prop
  const filteredTickets = showCompleted 
    ? tickets 
    : tickets.filter(ticket => ticket.status !== 'COMPLETED');

  // Handle start cooking
  const handleStartCooking = (orderId: string) => {
    // Update local state
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.orderId === orderId 
          ? { ...ticket, status: 'IN_PROGRESS' as const } 
          : ticket
      )
    );
    
    // Send update to server
    sendOrderStatusUpdate(orderId, 'PREPARING');
    
    toast.success('Started preparing order');
  };

  // Handle complete cooking
  const handleCompleteCooking = (orderId: string) => {
    // Update local state
    setTickets(prevTickets => 
      prevTickets.map(ticket => 
        ticket.orderId === orderId 
          ? { ...ticket, status: 'COMPLETED' as const } 
          : ticket
      )
    );
    
    // Send update to server
    sendOrderStatusUpdate(orderId, 'READY');
    
    toast.success('Order ready for pickup/delivery');
  };

  // Format time
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Get elapsed time
  const getElapsedTime = (dateString: string) => {
    const created = new Date(dateString).getTime();
    const now = new Date().getTime();
    const elapsed = Math.floor((now - created) / 60000); // minutes
    
    if (elapsed < 1) return 'Just now';
    if (elapsed === 1) return '1 minute ago';
    return `${elapsed} minutes ago`;
  };

  // Get status badge class
  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'NEW':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2 border-b">
        <CardTitle className="text-lg font-medium">
          Kitchen Order Tickets
        </CardTitle>
        <div className="flex items-center">
          <span className={`inline-block w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></span>
          <span className="text-sm text-gray-500">{isConnected ? 'Connected' : 'Disconnected'}</span>
          {!isConnected && (
            <button 
              onClick={reconnect}
              className="ml-2 text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded hover:bg-indigo-200"
            >
              Reconnect
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {filteredTickets.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No active kitchen tickets
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {filteredTickets.map(ticket => (
              <div 
                key={ticket.orderId}
                className={`border rounded-md overflow-hidden ${
                  ticket.status === 'NEW' 
                    ? 'border-yellow-300 bg-yellow-50' 
                    : ticket.status === 'IN_PROGRESS' 
                      ? 'border-blue-300 bg-blue-50' 
                      : 'border-green-300 bg-green-50'
                }`}
              >
                <div className="bg-white border-b p-3 flex justify-between items-center">
                  <div>
                    <span className="font-bold">{ticket.orderNumber}</span>
                    {ticket.tableNumber && (
                      <span className="ml-2 text-sm">Table {ticket.tableNumber}</span>
                    )}
                  </div>
                  <span className={`px-2 py-1 rounded text-xs ${getStatusBadgeClass(ticket.status)}`}>
                    {ticket.status}
                  </span>
                </div>
                
                <div className="p-3">
                  <div className="text-sm text-gray-700 mb-4">
                    {ticket.items.map(item => (
                      <div key={item.id} className="mb-2">
                        <div className="font-medium">
                          {item.quantity}x {item.name}
                        </div>
                        {item.notes && (
                          <div className="text-xs text-gray-500 ml-4 mt-1">
                            Note: {item.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  <div className="text-xs text-gray-500 mb-3">
                    Received: {formatTime(ticket.createdAt)} ({getElapsedTime(ticket.createdAt)})
                  </div>
                  
                  <div className="flex space-x-2">
                    {ticket.status === 'NEW' && (
                      <button
                        onClick={() => handleStartCooking(ticket.orderId)}
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 rounded text-sm"
                      >
                        Start Cooking
                      </button>
                    )}
                    
                    {ticket.status === 'IN_PROGRESS' && (
                      <button
                        onClick={() => handleCompleteCooking(ticket.orderId)}
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 px-3 rounded text-sm"
                      >
                        Mark as Ready
                      </button>
                    )}
                    
                    {ticket.status === 'COMPLETED' && (
                      <div className="flex-1 bg-gray-100 text-gray-800 py-2 px-3 rounded text-sm text-center">
                        Ready for Pickup
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
} 