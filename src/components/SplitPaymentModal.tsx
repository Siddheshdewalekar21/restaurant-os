import React, { useState } from 'react';
import { PaymentMethod } from '@prisma/client';
import axios from 'axios';
import { toast } from 'react-hot-toast';

interface SplitPaymentModalProps {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface SplitPaymentItem {
  id: string;
  amount: number;
  paymentMethod: PaymentMethod;
}

const SplitPaymentModal: React.FC<SplitPaymentModalProps> = ({
  orderId,
  orderNumber,
  totalAmount,
  onClose,
  onSuccess
}) => {
  const [splitPayments, setSplitPayments] = useState<SplitPaymentItem[]>([
    { id: '1', amount: totalAmount, paymentMethod: 'CASH' }
  ]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const addSplitPayment = () => {
    const currentTotal = splitPayments.reduce((sum, item) => sum + item.amount, 0);
    if (currentTotal >= totalAmount) {
      toast.error('Total amount already allocated');
      return;
    }
    
    const newId = (Math.max(...splitPayments.map(p => parseInt(p.id))) + 1).toString();
    setSplitPayments([
      ...splitPayments,
      { id: newId, amount: 0, paymentMethod: 'CASH' }
    ]);
  };
  
  const removeSplitPayment = (id: string) => {
    if (splitPayments.length <= 1) {
      toast.error('At least one payment method is required');
      return;
    }
    setSplitPayments(splitPayments.filter(p => p.id !== id));
  };
  
  const updateSplitPayment = (id: string, field: 'amount' | 'paymentMethod', value: any) => {
    setSplitPayments(splitPayments.map(p => {
      if (p.id === id) {
        return { ...p, [field]: field === 'amount' ? parseFloat(value) : value };
      }
      return p;
    }));
  };
  
  const handleSubmit = async () => {
    try {
      const currentTotal = splitPayments.reduce((sum, item) => sum + item.amount, 0);
      
      // Validate total amount
      if (Math.abs(currentTotal - totalAmount) > 0.01) {
        toast.error(`Total amount must equal ${totalAmount.toFixed(2)}`);
        return;
      }
      
      // Validate each payment has an amount
      if (splitPayments.some(p => p.amount <= 0)) {
        toast.error('All payment methods must have an amount greater than 0');
        return;
      }
      
      setIsProcessing(true);
      
      // Process the split payment
      const response = await axios.post('/api/payments/split', {
        orderId,
        payments: splitPayments.map(p => ({
          amount: p.amount,
          paymentMethod: p.paymentMethod
        }))
      });
      
      if (response.data.success) {
        toast.success('Payment processed successfully');
        onSuccess();
      } else {
        toast.error(response.data.error || 'Failed to process payment');
      }
    } catch (error: any) {
      console.error('Error processing split payment:', error);
      toast.error(error.response?.data?.error || 'Failed to process payment');
    } finally {
      setIsProcessing(false);
    }
  };
  
  const currentTotal = splitPayments.reduce((sum, item) => sum + item.amount, 0);
  const remaining = totalAmount - currentTotal;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">Split Payment</h2>
        <p className="text-gray-600 mb-4">
          Order #{orderNumber} - Total: ₹{totalAmount.toFixed(2)}
        </p>
        
        <div className="space-y-4 mb-6">
          {splitPayments.map((payment) => (
            <div key={payment.id} className="flex items-center space-x-2">
              <select
</rewritten_file> 