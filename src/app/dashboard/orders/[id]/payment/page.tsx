'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import PaymentProcessor from '@/components/PaymentProcessor';
import { Order } from '@/types';

export default function OrderPaymentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/orders/${params.id}`);
        
        // Check if order already has a payment
        if (response.data.data.payment) {
          router.push(`/dashboard/orders/${params.id}`);
          return;
        }
        
        setOrder(response.data.data);
        setError('');
      } catch (error: any) {
        console.error('Error fetching order:', error);
        setError(error.response?.data?.error || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id, router]);

  const handlePaymentSuccess = () => {
    router.push(`/dashboard/orders/${params.id}`);
    router.refresh();
  };

  const handleCancel = () => {
    router.push(`/dashboard/orders/${params.id}`);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading order details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
        <p>{error}</p>
        <Link href="/dashboard/orders" className="text-blue-600 hover:underline mt-2 inline-block">
          Back to Orders
        </Link>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center p-8">
        <h2 className="text-xl font-semibold mb-4">Order Not Found</h2>
        <Link href="/dashboard/orders" className="text-blue-600 hover:underline">
          Back to Orders
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Process Payment</h1>
        <Link 
          href={`/dashboard/orders/${params.id}`} 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
        >
          Back to Order
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Order Number</p>
              <p className="font-medium">{order.orderNumber}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Order Type</p>
              <p className="font-medium">{order.type}</p>
            </div>
            
            {order.table && (
              <div className="mb-4">
                <p className="text-sm text-gray-500">Table</p>
                <p className="font-medium">Table {order.table.tableNumber}</p>
              </div>
            )}
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-medium">{order.status}</p>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-500">Date</p>
              <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            
            <div className="border-t pt-4">
              <div className="flex justify-between mb-2">
                <span>Subtotal</span>
                <span>${(Number(order.totalAmount) / 1.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between mb-2">
                <span>Tax (10%)</span>
                <span>${(Number(order.totalAmount) - Number(order.totalAmount) / 1.1).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>${Number(order.totalAmount).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
        
        {/* Payment Processor */}
        <div className="lg:col-span-2">
          <PaymentProcessor 
            orderId={order.id} 
            orderNumber={order.orderNumber} 
            amount={Number(order.totalAmount)}
            onSuccess={handlePaymentSuccess}
            onCancel={handleCancel}
          />
        </div>
      </div>
    </div>
  );
} 