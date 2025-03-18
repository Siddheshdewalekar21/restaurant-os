'use client';

import { useState, useEffect } from 'react';
import axios from 'axios';
import FeedbackForm from '@/components/FeedbackForm';
import React from 'react';

export default function CustomerFeedbackPage({ params }: { params: { customerId: string } }) {
  // Unwrap params using React.use()
  const { customerId } = React.use(params);
  const [customer, setCustomer] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/customers/${customerId}`);
        setCustomer(response.data);
        setError('');
      } catch (error: any) {
        console.error('Error fetching customer:', error);
        setError(error.response?.data?.error || 'Failed to fetch customer details');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [customerId]);

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="px-6 py-8">
          <h1 className="text-2xl font-bold text-center text-gray-900 mb-6">
            Share Your Feedback
          </h1>
          
          {loading ? (
            <div className="text-center py-4">Loading...</div>
          ) : error ? (
            <div className="text-center text-red-600 py-4">{error}</div>
          ) : (
            <>
              <div className="mb-6 text-center">
                <p className="text-gray-600">
                  Hello, <span className="font-semibold">{customer?.name || 'Valued Customer'}</span>!
                </p>
                <p className="text-gray-600 mt-2">
                  We'd love to hear about your experience with us.
                </p>
              </div>
              
              <FeedbackForm customerId={customerId} />
            </>
          )}
        </div>
      </div>
    </div>
  );
} 