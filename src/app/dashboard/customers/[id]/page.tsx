'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import axios from 'axios';
import { Customer, Order, Feedback } from '@/types';
import QRCodeGenerator from '@/components/QRCodeGenerator';

interface CustomerWithDetails extends Customer {
  orders: Order[];
  feedback: Feedback[];
  totalSpent: number;
  averageRating: number;
}

export default function CustomerDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [customer, setCustomer] = useState<CustomerWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showEditForm, setShowEditForm] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showQRCode, setShowQRCode] = useState(false);
  
  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/customers/${params.id}`);
        setCustomer(response.data.data);
        
        // Initialize form state
        setName(response.data.data.name);
        setEmail(response.data.data.email || '');
        setPhone(response.data.data.phone || '');
        setAddress(response.data.data.address || '');
        
        setError('');
      } catch (error: any) {
        console.error('Error fetching customer:', error);
        setError(error.response?.data?.error || 'Failed to load customer details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [params.id]);

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      setFormError('');
      
      const response = await axios.patch(`/api/customers/${params.id}`, {
        name,
        email: email || undefined,
        phone: phone || undefined,
        address: address || undefined,
      });
      
      // Update customer state
      setCustomer({
        ...customer!,
        name: response.data.data.name,
        email: response.data.data.email,
        phone: response.data.data.phone,
        address: response.data.data.address,
      });
      
      setShowEditForm(false);
    } catch (error: any) {
      console.error('Error updating customer:', error);
      setFormError(error.response?.data?.error || 'Failed to update customer. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCustomer = async () => {
    try {
      setSubmitting(true);
      await axios.delete(`/api/customers/${params.id}`);
      router.push('/dashboard/customers');
    } catch (error: any) {
      console.error('Error deleting customer:', error);
      setError(error.response?.data?.error || 'Failed to delete customer. Please try again.');
      setShowDeleteConfirm(false);
    } finally {
      setSubmitting(false);
    }
  };

  const getFeedbackUrl = () => {
    // Get the base URL of the application
    const baseUrl = window.location.origin;
    return `${baseUrl}/feedback/${customer?.id}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading customer details...</div>
      </div>
    );
  }

  if (error && !customer) {
    return (
      <div className="bg-red-100 p-4 rounded-md text-red-700 mb-4">
        <p>{error}</p>
        <Link href="/dashboard/customers" className="text-indigo-600 hover:text-indigo-900 mt-2 inline-block">
          Back to Customers
        </Link>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="bg-yellow-100 p-4 rounded-md text-yellow-700 mb-4">
        <p>Customer not found.</p>
        <Link href="/dashboard/customers" className="text-indigo-600 hover:text-indigo-900 mt-2 inline-block">
          Back to Customers
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <Link 
            href="/dashboard/customers" 
            className="mr-4 text-gray-500 hover:text-gray-700"
          >
            ← Back
          </Link>
          <h1 className="text-2xl font-bold">Customer Details</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={() => setShowEditForm(!showEditForm)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showEditForm ? 'Cancel' : 'Edit Customer'}
          </button>
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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Confirm Deletion</h2>
            <p className="mb-6">
              Are you sure you want to delete {customer.name}? This action cannot be undone.
              {customer.orders.length > 0 && (
                <span className="block mt-2 text-red-600 font-semibold">
                  Warning: This customer has {customer.orders.length} orders. Deletion is only possible if they have no orders.
                </span>
              )}
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteCustomer}
                disabled={submitting || customer.orders.length > 0}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {submitting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Customer Form */}
      {showEditForm ? (
        <div className="mb-6 bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Edit Customer</h2>
          
          {formError && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {formError}
            </div>
          )}
          
          <form onSubmit={handleUpdateCustomer}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  id="phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                  Address
                </label>
                <input
                  type="text"
                  id="address"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setShowEditForm(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 mr-2"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting || !name}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {submitting ? 'Updating...' : 'Update Customer'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* Customer Info Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Customer Information</h2>
            <div className="space-y-3">
              <div>
                <span className="text-gray-500 text-sm">Name:</span>
                <p className="font-medium">{customer.name}</p>
              </div>
              {customer.email && (
                <div>
                  <span className="text-gray-500 text-sm">Email:</span>
                  <p className="font-medium">{customer.email}</p>
                </div>
              )}
              {customer.phone && (
                <div>
                  <span className="text-gray-500 text-sm">Phone:</span>
                  <p className="font-medium">{customer.phone}</p>
                </div>
              )}
              {customer.address && (
                <div>
                  <span className="text-gray-500 text-sm">Address:</span>
                  <p className="font-medium">{customer.address}</p>
                </div>
              )}
              <div>
                <span className="text-gray-500 text-sm">Created:</span>
                <p className="font-medium">{new Date(customer.createdAt).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          {/* Loyalty Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Loyalty Program</h2>
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-4xl font-bold text-indigo-600 mb-2">{customer.loyaltyPoints}</div>
              <div className="text-gray-500">Loyalty Points</div>
              
              <div className="mt-4 text-center">
                <div className="text-sm text-gray-500 mb-1">Total Spent</div>
                <div className="font-semibold text-xl">₹{customer.totalSpent.toFixed(2)}</div>
              </div>
            </div>
          </div>

          {/* Stats Card */}
          <div className="bg-white p-6 rounded-lg shadow-md">
            <h2 className="text-xl font-semibold mb-4">Customer Stats</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{customer.orders.length}</div>
                <div className="text-sm text-gray-500">Orders</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{customer.feedback.length}</div>
                <div className="text-sm text-gray-500">Reviews</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {customer.averageRating ? customer.averageRating.toFixed(1) : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Avg. Rating</div>
              </div>
              <div className="text-center p-3 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {customer.orders.length > 0 
                    ? `₹${(customer.totalSpent / customer.orders.length).toFixed(0)}` 
                    : 'N/A'}
                </div>
                <div className="text-sm text-gray-500">Avg. Order</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Feedback QR Code Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Feedback QR Code</h2>
          <button
            onClick={() => setShowQRCode(!showQRCode)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
          >
            {showQRCode ? 'Hide QR Code' : 'Generate QR Code'}
          </button>
        </div>
        
        {showQRCode && (
          <div className="bg-white p-6 rounded-lg shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-medium mb-2">Instructions</h3>
                <p className="text-gray-600 mb-4">
                  Share this QR code with {customer.name} to collect feedback about their experience.
                </p>
                <p className="text-gray-600 mb-4">
                  When scanned, this QR code will take them to a feedback form where they can rate their experience and provide comments.
                </p>
                <p className="text-gray-600">
                  Customers will earn 5 loyalty points for each feedback submission.
                </p>
              </div>
              <div>
                <QRCodeGenerator 
                  url={getFeedbackUrl()}
                  title="Feedback QR Code"
                  description={`For ${customer.name}`}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Orders Section */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {customer.orders.length > 0 ? (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Order #</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customer.orders.map((order) => (
                  <tr key={order.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{order.orderNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">{order.type}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'PREPARING' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium">₹{order.totalAmount.toFixed(2)}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <Link 
                        href={`/dashboard/orders/${order.id}`}
                        className="text-indigo-600 hover:text-indigo-900"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No orders found for this customer.
            </div>
          )}
        </div>
      </div>

      {/* Feedback Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Customer Feedback</h2>
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          {customer.feedback.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {customer.feedback.map((feedback) => (
                <div key={feedback.id} className="p-6">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center">
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star}
                            className={`h-5 w-5 ${star <= feedback.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                      <span className="ml-2 text-sm text-gray-500">
                        {new Date(feedback.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    {feedback.orderId && (
                      <Link 
                        href={`/dashboard/orders/${feedback.orderId}`}
                        className="text-xs text-indigo-600 hover:text-indigo-900"
                      >
                        View Order
                      </Link>
                    )}
                  </div>
                  <p className="text-gray-700">{feedback.comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              No feedback found for this customer.
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 