'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Order, OrderStatus, PaymentMethod, PaymentStatus } from '@/types';
import FeedbackForm from '@/components/FeedbackForm';

interface OrderWithDetails extends Order {
  items: {
    id: string;
    quantity: number;
    notes?: string;
    menuItem: {
      id: string;
      name: string;
      price: number;
    };
  }[];
  table?: {
    id: string;
    tableNumber: number;
  };
  user?: {
    id: string;
    name: string;
  };
  customer?: {
    id: string;
    name: string;
    phone: string;
  };
  payment?: {
    id: string;
    paymentMethod: PaymentMethod;
    paymentStatus: PaymentStatus;
    paymentReference?: string;
    amount: number;
  };
  feedback?: {
    id: string;
    rating: number;
    comment?: string;
  };
}

export default function OrderDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [order, setOrder] = useState<OrderWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updating, setUpdating] = useState(false);
  const [statusUpdateError, setStatusUpdateError] = useState('');
  const [paymentUpdateError, setPaymentUpdateError] = useState('');
  
  // Payment form state
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('PENDING');
  const [paymentReference, setPaymentReference] = useState('');
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showFeedbackForm, setShowFeedbackForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/orders/${params.id}`);
        setOrder(response.data.data);
        
        // Initialize payment form if payment exists
        if (response.data.data.payment) {
          setPaymentMethod(response.data.data.payment.paymentMethod);
          setPaymentStatus(response.data.data.payment.paymentStatus);
          setPaymentReference(response.data.data.payment.paymentReference || '');
        }
        
        setError('');
      } catch (error: any) {
        console.error('Error fetching order:', error);
        setError(error.response?.data?.error || 'Failed to fetch order details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [params.id]);

  const handleStatusUpdate = async (newStatus: OrderStatus) => {
    try {
      setSubmitting(true);
      setStatusUpdateError('');
      
      await axios.patch(`/api/orders/${params.id}`, { status: newStatus });
      
      // Update local state
      setOrder(prev => prev ? { ...prev, status: newStatus } : null);
      
      // Refresh the page to get updated data
      router.refresh();
    } catch (error: any) {
      console.error('Error updating order status:', error);
      setStatusUpdateError(error.response?.data?.error || 'Failed to update order status');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUpdating(true);
      setPaymentUpdateError('');
      
      const paymentData = {
        paymentMethod,
        paymentStatus,
        paymentReference: paymentReference || undefined,
      };
      
      const response = await axios.patch(`/api/orders/${params.id}`, paymentData);
      
      // Update local state
      setOrder(prev => prev ? { ...prev, payment: response.data.data } : null);
      setShowPaymentForm(false);
      
      // Refresh the page to get updated data
      router.refresh();
    } catch (error: any) {
      console.error('Error updating payment:', error);
      setPaymentUpdateError(error.response?.data?.error || 'Failed to update payment information');
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteOrder = async () => {
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }
    
    try {
      setSubmitting(true);
      await axios.delete(`/api/orders/${params.id}`);
      router.push('/dashboard/orders');
    } catch (error: any) {
      console.error('Error deleting order:', error);
      setError(error.response?.data?.error || 'Failed to delete order');
      setShowDeleteConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackSuccess = () => {
    // Refresh order data to show the new feedback
    const fetchUpdatedOrder = async () => {
      try {
        const response = await axios.get(`/api/orders/${params.id}`);
        setOrder(response.data.data);
        setShowFeedbackForm(false);
      } catch (error) {
        console.error('Error fetching updated order:', error);
      }
    };
    
    fetchUpdatedOrder();
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

  const getStatusBadgeClass = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'PREPARING':
        return 'bg-blue-100 text-blue-800';
      case 'READY':
        return 'bg-green-100 text-green-800';
      case 'COMPLETED':
        return 'bg-gray-100 text-gray-800';
      case 'CANCELLED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusBadgeClass = (status: PaymentStatus) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'COMPLETED':
        return 'bg-green-100 text-green-800';
      case 'FAILED':
        return 'bg-red-100 text-red-800';
      case 'REFUNDED':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div>
      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete order #{order.orderNumber}? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteOrder}
                disabled={submitting}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link 
            href="/dashboard/orders" 
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Order #{order.orderNumber}</h1>
          <span className={`ml-4 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusBadgeClass(order.status)}`}>
            {order.status}
          </span>
        </div>
        <div className="flex space-x-2">
          {!order.payment && (
            <Link 
              href={`/dashboard/orders/${order.id}/payment`}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Process Payment
            </Link>
          )}
          <button 
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Delete
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Order Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Order Information</h2>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 text-sm">Order Type:</span>
              <p className="font-medium">{order.type}</p>
            </div>
            {order.table && (
              <div>
                <span className="text-gray-500 text-sm">Table:</span>
                <p className="font-medium">Table {order.table.tableNumber}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500 text-sm">Date:</span>
              <p className="font-medium">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            {order.user && (
              <div>
                <span className="text-gray-500 text-sm">Staff:</span>
                <p className="font-medium">{order.user.name}</p>
              </div>
            )}
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
          {order.customer ? (
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">Name:</span>
                <p className="font-medium">{order.customer.name}</p>
              </div>
              {order.customer.phone && (
                <div>
                  <span className="text-gray-500 text-sm">Phone:</span>
                  <p className="font-medium">{order.customer.phone}</p>
                </div>
              )}
              <div className="pt-2">
                <Link 
                  href={`/dashboard/customers/${order.customer.id}`}
                  className="text-indigo-600 hover:text-indigo-900 text-sm"
                >
                  View Customer Profile
                </Link>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 italic">No customer information</p>
          )}
        </div>

        {/* Status Management */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Status Management</h2>
          <div className="space-y-3">
            <button
              onClick={() => handleStatusUpdate('PENDING')}
              disabled={order.status === 'PENDING' || order.status === 'COMPLETED' || order.status === 'CANCELLED' || submitting}
              className={`w-full py-2 rounded-md ${
                order.status === 'PENDING' 
                  ? 'bg-yellow-100 text-yellow-800 font-medium' 
                  : 'bg-gray-100 hover:bg-yellow-50 text-gray-700 hover:text-yellow-700'
              } disabled:opacity-50`}
            >
              Pending
            </button>
            <button
              onClick={() => handleStatusUpdate('PREPARING')}
              disabled={order.status === 'PREPARING' || order.status === 'COMPLETED' || order.status === 'CANCELLED' || submitting}
              className={`w-full py-2 rounded-md ${
                order.status === 'PREPARING' 
                  ? 'bg-blue-100 text-blue-800 font-medium' 
                  : 'bg-gray-100 hover:bg-blue-50 text-gray-700 hover:text-blue-700'
              } disabled:opacity-50`}
            >
              Preparing
            </button>
            <button
              onClick={() => handleStatusUpdate('READY')}
              disabled={order.status === 'READY' || order.status === 'COMPLETED' || order.status === 'CANCELLED' || submitting}
              className={`w-full py-2 rounded-md ${
                order.status === 'READY' 
                  ? 'bg-indigo-100 text-indigo-800 font-medium' 
                  : 'bg-gray-100 hover:bg-indigo-50 text-gray-700 hover:text-indigo-700'
              } disabled:opacity-50`}
            >
              Ready
            </button>
            <button
              onClick={() => handleStatusUpdate('COMPLETED')}
              disabled={order.status === 'COMPLETED' || order.status === 'CANCELLED' || submitting}
              className={`w-full py-2 rounded-md ${
                order.status === 'COMPLETED' 
                  ? 'bg-green-100 text-green-800 font-medium' 
                  : 'bg-gray-100 hover:bg-green-50 text-gray-700 hover:text-green-700'
              } disabled:opacity-50`}
            >
              Completed
            </button>
            <button
              onClick={() => handleStatusUpdate('CANCELLED')}
              disabled={order.status === 'CANCELLED' || order.status === 'COMPLETED' || submitting}
              className={`w-full py-2 rounded-md ${
                order.status === 'CANCELLED' 
                  ? 'bg-red-100 text-red-800 font-medium' 
                  : 'bg-gray-100 hover:bg-red-50 text-gray-700 hover:text-red-700'
              } disabled:opacity-50`}
            >
              Cancelled
            </button>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="p-6 border-b">
          <h2 className="text-xl font-semibold">Order Items</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {order.items.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="font-medium text-gray-900">{item.menuItem.name}</div>
                  {item.notes && <div className="text-sm text-gray-500">Note: {item.notes}</div>}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {item.quantity}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{Number(item.menuItem.price).toFixed(2)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  ₹{(Number(item.menuItem.price) * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="bg-gray-50">
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right font-medium">Subtotal</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{(Number(order.totalAmount) / 1.1).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right font-medium">Tax (10%)</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                ₹{(Number(order.totalAmount) - Number(order.totalAmount) / 1.1).toFixed(2)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="px-6 py-4 text-right font-medium">Total</td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                ₹{Number(order.totalAmount).toFixed(2)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Payment Information */}
      {order.payment ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <span className="text-gray-500 text-sm">Payment Method:</span>
              <p className="font-medium">{order.payment.paymentMethod}</p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Status:</span>
              <p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPaymentStatusBadgeClass(order.payment.paymentStatus)}`}>
                  {order.payment.paymentStatus}
                </span>
              </p>
            </div>
            <div>
              <span className="text-gray-500 text-sm">Amount:</span>
              <p className="font-medium">₹{Number(order.payment.amount).toFixed(2)}</p>
            </div>
            {order.payment.paymentReference && (
              <div>
                <span className="text-gray-500 text-sm">Reference:</span>
                <p className="font-medium">{order.payment.paymentReference}</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Payment Information</h2>
            <Link 
              href={`/dashboard/orders/${order.id}/payment`}
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Process Payment
            </Link>
          </div>
          <p className="mt-4 text-gray-500 italic">No payment information available</p>
        </div>
      )}

      {/* Feedback Section */}
      {order.customer && order.status === 'COMPLETED' && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Customer Feedback</h2>
          
          {order.feedback ? (
            <div>
              <div className="flex items-center mb-2">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg 
                      key={star}
                      className={`h-5 w-5 ${star <= order.feedback!.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <span className="ml-2 text-sm text-gray-500">
                  {order.feedback.rating} star{order.feedback.rating !== 1 ? 's' : ''}
                </span>
              </div>
              {order.feedback.comment && (
                <p className="text-gray-700 mt-2">{order.feedback.comment}</p>
              )}
            </div>
          ) : (
            <div>
              {showFeedbackForm ? (
                <FeedbackForm 
                  customerId={order.customer.id}
                  orderId={order.id}
                  onSuccess={handleFeedbackSuccess}
                  onCancel={() => setShowFeedbackForm(false)}
                />
              ) : (
                <div className="text-center py-4">
                  <p className="text-gray-500 mb-4">No feedback has been provided for this order yet.</p>
                  <button
                    onClick={() => setShowFeedbackForm(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  >
                    Add Feedback
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
} 