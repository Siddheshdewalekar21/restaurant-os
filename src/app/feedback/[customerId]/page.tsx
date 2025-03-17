'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Customer } from '@/types';
import FeedbackForm from '@/components/FeedbackForm';

export default function CustomerFeedbackPage({ params }: { params: { customerId: string } }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/customers/${params.customerId}`);
        setCustomer(response.data.data);
        setError('');
      } catch (error: any) {
        console.error('Error fetching customer:', error);
        setError(error.response?.data?.error || 'Failed to load customer details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchCustomer();
  }, [params.customerId]);

  const handleFeedbackSuccess = () => {
    setSuccess(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-red-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Error</h2>
          <p className="text-gray-600 mb-4 text-center">{error}</p>
          <div className="text-center">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md w-full">
          <div className="text-yellow-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold mb-2 text-center">Customer Not Found</h2>
          <p className="text-gray-600 mb-4 text-center">We couldn't find the customer you're looking for.</p>
          <div className="text-center">
            <Link href="/" className="text-indigo-600 hover:text-indigo-800">
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <div className="text-green-500 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-semibold mb-2 text-center">Thank You!</h2>
          <p className="text-gray-600 mb-6 text-center">
            Thank you for your feedback, {customer.name}! We appreciate you taking the time to share your thoughts with us.
          </p>
          <p className="text-indigo-600 text-center mb-6">
            You've earned 5 loyalty points!
          </p>
          <div className="text-center">
            <Link 
              href="/" 
              className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 inline-block"
            >
              Return to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-indigo-600">RestaurantOS</h1>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">We Value Your Feedback</h2>
          <p className="mt-2 text-gray-600">
            Hello, {customer.name}! We'd love to hear about your experience with us.
          </p>
        </div>
        
        <FeedbackForm 
          customerId={customer.id} 
          onSuccess={handleFeedbackSuccess}
        />
      </div>
    </div>
  );
} 