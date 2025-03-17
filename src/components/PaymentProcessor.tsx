'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { PaymentMethod, PaymentStatus } from '@/types';

interface PaymentProcessorProps {
  orderId: string;
  orderNumber: string;
  amount: number;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function PaymentProcessor({
  orderId,
  orderNumber,
  amount,
  onSuccess,
  onCancel
}: PaymentProcessorProps) {
  const router = useRouter();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('CASH');
  const [paymentReference, setPaymentReference] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState('');
  const [showQRCode, setShowQRCode] = useState(false);
  const [showCardForm, setShowCardForm] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCVV, setCardCVV] = useState('');
  const [cardName, setCardName] = useState('');

  const handlePaymentMethodChange = (method: PaymentMethod) => {
    setPaymentMethod(method);
    setShowQRCode(method === 'UPI');
    setShowCardForm(method === 'CARD');
    setError('');
  };

  const handleProcessPayment = async () => {
    try {
      setIsProcessing(true);
      setError('');

      // Validate card details if card payment
      if (paymentMethod === 'CARD') {
        if (!cardNumber || !cardExpiry || !cardCVV || !cardName) {
          setError('Please fill in all card details');
          setIsProcessing(false);
          return;
        }
        
        if (cardNumber.length < 16) {
          setError('Invalid card number');
          setIsProcessing(false);
          return;
        }
      }

      // Process payment
      const response = await axios.post('/api/payments', {
        orderId,
        amount,
        paymentMethod,
        paymentStatus: 'COMPLETED',
        paymentReference: paymentReference || undefined
      });

      // Handle success
      if (response.data.success) {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push(`/dashboard/orders/${orderId}`);
          router.refresh();
        }
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      setError(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      onCancel();
    }
  };

  // Format card number with spaces
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  // Format card expiry date
  const formatExpiryDate = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    
    return v;
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold mb-4">Process Payment for Order #{orderNumber}</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Amount to Pay:</p>
        <p className="text-2xl font-bold">${amount.toFixed(2)}</p>
      </div>
      
      <div className="mb-6">
        <p className="text-gray-700 mb-2">Select Payment Method:</p>
        <div className="grid grid-cols-2 gap-4">
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('CASH')}
            className={`p-4 border rounded-md flex flex-col items-center justify-center ${
              paymentMethod === 'CASH' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
          >
            <span className="text-xl mb-2">💵</span>
            <span className="font-medium">Cash</span>
          </button>
          
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('CARD')}
            className={`p-4 border rounded-md flex flex-col items-center justify-center ${
              paymentMethod === 'CARD' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
          >
            <span className="text-xl mb-2">💳</span>
            <span className="font-medium">Card</span>
          </button>
          
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('UPI')}
            className={`p-4 border rounded-md flex flex-col items-center justify-center ${
              paymentMethod === 'UPI' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
          >
            <span className="text-xl mb-2">📱</span>
            <span className="font-medium">UPI</span>
          </button>
          
          <button
            type="button"
            onClick={() => handlePaymentMethodChange('ONLINE')}
            className={`p-4 border rounded-md flex flex-col items-center justify-center ${
              paymentMethod === 'ONLINE' ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300'
            }`}
          >
            <span className="text-xl mb-2">🌐</span>
            <span className="font-medium">Online</span>
          </button>
        </div>
      </div>
      
      {/* Card Payment Form */}
      {showCardForm && (
        <div className="mb-6 border p-4 rounded-md">
          <h3 className="font-medium mb-3">Card Details</h3>
          
          <div className="mb-3">
            <label htmlFor="cardNumber" className="block text-sm font-medium text-gray-700 mb-1">
              Card Number
            </label>
            <input
              type="text"
              id="cardNumber"
              value={cardNumber}
              onChange={(e) => setCardNumber(formatCardNumber(e.target.value))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <label htmlFor="cardExpiry" className="block text-sm font-medium text-gray-700 mb-1">
                Expiry Date
              </label>
              <input
                type="text"
                id="cardExpiry"
                value={cardExpiry}
                onChange={(e) => setCardExpiry(formatExpiryDate(e.target.value))}
                placeholder="MM/YY"
                maxLength={5}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="cardCVV" className="block text-sm font-medium text-gray-700 mb-1">
                CVV
              </label>
              <input
                type="text"
                id="cardCVV"
                value={cardCVV}
                onChange={(e) => setCardCVV(e.target.value.replace(/\D/g, '').slice(0, 3))}
                placeholder="123"
                maxLength={3}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
          </div>
          
          <div className="mb-3">
            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
              Name on Card
            </label>
            <input
              type="text"
              id="cardName"
              value={cardName}
              onChange={(e) => setCardName(e.target.value)}
              placeholder="John Doe"
              className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>
      )}
      
      {/* UPI QR Code */}
      {showQRCode && (
        <div className="mb-6 border p-4 rounded-md flex flex-col items-center">
          <h3 className="font-medium mb-3">Scan QR Code to Pay</h3>
          <div className="bg-gray-200 w-48 h-48 flex items-center justify-center mb-3">
            <p className="text-gray-500 text-center">QR Code Placeholder</p>
          </div>
          <p className="text-sm text-gray-500">Scan with any UPI app to pay</p>
        </div>
      )}
      
      {/* Reference Number */}
      <div className="mb-6">
        <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
          Reference Number (Optional)
        </label>
        <input
          type="text"
          id="reference"
          value={paymentReference}
          onChange={(e) => setPaymentReference(e.target.value)}
          placeholder="Transaction ID, Receipt Number, etc."
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>
      
      <div className="flex space-x-3">
        <button
          type="button"
          onClick={handleProcessPayment}
          disabled={isProcessing}
          className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Complete Payment'}
        </button>
        
        <button
          type="button"
          onClick={handleCancel}
          disabled={isProcessing}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  );
} 