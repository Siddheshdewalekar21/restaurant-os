'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import axios from 'axios';
import { Feedback, Customer } from '@/types';

interface FeedbackWithCustomer extends Feedback {
  customer: Customer;
}

export default function FeedbackPage() {
  const [feedback, setFeedback] = useState<FeedbackWithCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterRating, setFilterRating] = useState<number | null>(null);
  
  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/feedback');
        setFeedback(response.data.data);
        setError('');
      } catch (error: any) {
        console.error('Error fetching feedback:', error);
        setError(error.response?.data?.error || 'Failed to load feedback. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchFeedback();
  }, []);

  const handleDeleteFeedback = async (id: string) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return;
    
    try {
      await axios.delete(`/api/feedback/${id}`);
      setFeedback(feedback.filter(item => item.id !== id));
    } catch (error: any) {
      console.error('Error deleting feedback:', error);
      alert(error.response?.data?.error || 'Failed to delete feedback. Please try again.');
    }
  };

  const filteredFeedback = filterRating 
    ? feedback.filter(item => item.rating === filterRating)
    : feedback;

  const averageRating = feedback.length > 0
    ? (feedback.reduce((sum, item) => sum + item.rating, 0) / feedback.length).toFixed(1)
    : 'N/A';

  const ratingCounts = [1, 2, 3, 4, 5].map(rating => ({
    rating,
    count: feedback.filter(item => item.rating === rating).length,
    percentage: feedback.length > 0 
      ? Math.round((feedback.filter(item => item.rating === rating).length / feedback.length) * 100)
      : 0
  }));

  if (loading && feedback.length === 0) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Customer Feedback</h1>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}

      {/* Feedback Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Average Rating Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Average Rating</h2>
          <div className="flex items-center">
            <div className="text-5xl font-bold text-indigo-600 mr-4">{averageRating}</div>
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <svg 
                  key={star}
                  className={`h-6 w-6 ${star <= parseFloat(averageRating as string) ? 'text-yellow-400' : 'text-gray-300'}`}
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <div className="ml-2 text-gray-500">({feedback.length} reviews)</div>
          </div>
        </div>

        {/* Rating Distribution Card */}
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Rating Distribution</h2>
          <div className="space-y-2">
            {ratingCounts.reverse().map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center">
                <div className="w-12 text-sm font-medium">{rating} stars</div>
                <div className="flex-1 mx-4">
                  <div className="w-full bg-gray-200 rounded-full h-2.5">
                    <div 
                      className="bg-yellow-400 h-2.5 rounded-full" 
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
                <div className="w-12 text-sm text-gray-500">{count}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-md">
        <div className="flex items-center">
          <span className="mr-4 text-sm font-medium text-gray-700">Filter by rating:</span>
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterRating(null)}
              className={`px-3 py-1 rounded-md ${
                filterRating === null 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              All
            </button>
            {[5, 4, 3, 2, 1].map(rating => (
              <button
                key={rating}
                onClick={() => setFilterRating(rating === filterRating ? null : rating)}
                className={`px-3 py-1 rounded-md ${
                  filterRating === rating 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {rating} ★
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Feedback List */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {filteredFeedback.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {filteredFeedback.map((item) => (
              <div key={item.id} className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <div className="flex items-center mb-1">
                      <Link 
                        href={`/dashboard/customers/${item.customerId}`}
                        className="font-medium text-indigo-600 hover:text-indigo-900 mr-2"
                      >
                        {item.customer.name}
                      </Link>
                      <div className="flex">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <svg 
                            key={star}
                            className={`h-5 w-5 ${star <= item.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                        ))}
                      </div>
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(item.createdAt).toLocaleDateString()} at {new Date(item.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {item.orderId && (
                      <Link 
                        href={`/dashboard/orders/${item.orderId}`}
                        className="text-sm text-indigo-600 hover:text-indigo-900"
                      >
                        View Order
                      </Link>
                    )}
                    <button
                      onClick={() => handleDeleteFeedback(item.id)}
                      className="text-sm text-red-600 hover:text-red-900"
                    >
                      Delete
                    </button>
                  </div>
                </div>
                <p className="text-gray-700 mt-2">{item.comment}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center text-gray-500">
            {filterRating 
              ? `No ${filterRating}-star feedback found.` 
              : 'No feedback found. Encourage your customers to leave reviews!'}
          </div>
        )}
      </div>
    </div>
  );
} 