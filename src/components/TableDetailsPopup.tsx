import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api-client';
import { Card } from '@/components/ui/card';

interface TableDetailsPopupProps {
  tableId: string;
  onClose: () => void;
}

interface TableDetails {
  id: string;
  tableNumber: number;
  capacity: number;
  status: string;
  currentOrder?: {
    id: string;
    orderNumber: string;
    status: string;
    customerName?: string;
    items: Array<{
      quantity: number;
      menuItem: {
        name: string;
        price: number;
      };
    }>;
    totalAmount: number;
    createdAt: string;
    paymentStatus: 'PAID' | 'PENDING';
  };
}

export default function TableDetailsPopup({ tableId, onClose }: TableDetailsPopupProps) {
  const router = useRouter();
  const [tableDetails, setTableDetails] = useState<TableDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTableDetails = async () => {
      try {
        setLoading(true);
        const response = await api.get(`/tables/${tableId}?includeCurrentOrder=true`);
        console.log('Table details response:', response);
        setTableDetails(response);
        setError('');
      } catch (error: any) {
        console.error('Error fetching table details:', error);
        setError(error.message || 'Failed to fetch table details');
      } finally {
        setLoading(false);
      }
    };

    fetchTableDetails();
  }, [tableId]);

  const handleProcessPayment = () => {
    router.push(`/dashboard/orders/${tableDetails?.currentOrder?.id}/payment`);
    onClose();
  };

  const handleViewOrder = () => {
    router.push(`/dashboard/orders/${tableDetails?.currentOrder?.id}`);
    onClose();
  };

  const getStatusBadgeClass = (status: string, paymentStatus?: 'PAID' | 'PENDING') => {
    if (status === 'COMPLETED' && paymentStatus === 'PENDING') {
      return 'bg-orange-100 text-orange-800';
    }
    
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'SERVED':
        return 'bg-purple-100 text-purple-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  if (loading) {
    return (
      <Card className="fixed inset-x-4 top-20 mx-auto max-w-lg bg-white p-6 shadow-lg rounded-lg z-50">
        <div className="text-center">Loading table details...</div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="fixed inset-x-4 top-20 mx-auto max-w-lg bg-white p-6 shadow-lg rounded-lg z-50">
        <div className="text-red-600 text-center">{error}</div>
        <button
          onClick={onClose}
          className="mt-4 w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
        >
          Close
        </button>
      </Card>
    );
  }

  if (!tableDetails) {
    return null;
  }

  return (
    <Card className="fixed inset-x-4 top-20 mx-auto max-w-lg bg-white p-6 shadow-lg rounded-lg z-50">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold">Table {tableDetails.tableNumber}</h3>
          <p className="text-sm text-gray-500">Capacity: {tableDetails.capacity} seats</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600"
        >
          <span className="sr-only">Close</span>
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {tableDetails.status === 'OCCUPIED' ? (
        tableDetails.currentOrder ? (
          <div>
            <div className="border-t pt-4">
              <h4 className="font-medium mb-2">Current Order</h4>
              <div className="flex justify-between items-start mb-2">
                <p className="text-sm text-gray-600">Order #{tableDetails.currentOrder.orderNumber}</p>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusBadgeClass(tableDetails.currentOrder.status, tableDetails.currentOrder.paymentStatus)}`}>
                    {tableDetails.currentOrder.status}
                  </span>
                  {tableDetails.currentOrder.status === 'COMPLETED' && tableDetails.currentOrder.paymentStatus === 'PENDING' && (
                    <span className="text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                      Payment Pending
                    </span>
                  )}
                </div>
              </div>

              {tableDetails.currentOrder.customerName && (
                <p className="text-sm text-gray-600 mb-2">
                  Customer: {tableDetails.currentOrder.customerName}
                </p>
              )}

              <div className="space-y-2 mt-4">
                {tableDetails.currentOrder.items.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span>
                      {item.quantity}x {item.menuItem.name}
                    </span>
                    <span className="text-gray-600">
                      ${(item.menuItem.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 mt-2 font-medium flex justify-between">
                  <span>Total</span>
                  <span>${tableDetails.currentOrder.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <button
                  onClick={handleViewOrder}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                >
                  View Order
                </button>
                {tableDetails.currentOrder.paymentStatus === 'PENDING' && (
                  <button
                    onClick={handleProcessPayment}
                    className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Process Payment
                  </button>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center text-gray-500 py-4">
            <p className="mb-2">Table is marked as occupied.</p>
            <p className="text-sm">No active order found. This might be due to a system sync issue.</p>
          </div>
        )
      ) : (
        <div className="text-center text-gray-500 py-4">
          Table is {tableDetails.status.toLowerCase()}
        </div>
      )}
    </Card>
  );
} 