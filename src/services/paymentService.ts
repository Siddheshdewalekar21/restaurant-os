import Razorpay from 'razorpay';
import Stripe from 'stripe';
import { PaymentMethod, PaymentStatus } from '@prisma/client';
import prisma from '@/lib/prisma';

// Initialize payment gateways
const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID || '',
  key_secret: process.env.RAZORPAY_KEY_SECRET || '',
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2023-10-16',
});

export type PaymentGateway = 'RAZORPAY' | 'STRIPE' | 'INTERNAL';

export interface PaymentRequest {
  orderId: string;
  amount: number;
  currency?: string;
  paymentMethod: PaymentMethod;
  gateway: PaymentGateway;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  description?: string;
}

export interface PaymentResponse {
  success: boolean;
  paymentId?: string;
  orderId?: string;
  gatewayOrderId?: string;
  gatewayPaymentId?: string;
  paymentUrl?: string;
  error?: string;
}

export const createPaymentIntent = async (paymentRequest: PaymentRequest): Promise<PaymentResponse> => {
  try {
    const { orderId, amount, currency = 'INR', paymentMethod, gateway, customerEmail, customerName, description } = paymentRequest;
    
    // Get order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { customer: true }
    });
    
    if (!order) {
      return { success: false, error: 'Order not found' };
    }
    
    // Create payment record in database
    const payment = await prisma.payment.create({
      data: {
        amount,
        paymentMethod,
        paymentStatus: 'PENDING',
        order: { connect: { id: orderId } },
      },
    });
    
    // Process based on selected gateway
    if (gateway === 'RAZORPAY') {
      const razorpayOrder = await razorpay.orders.create({
        amount: amount * 100, // Razorpay expects amount in paise
        currency,
        receipt: order.orderNumber,
        notes: {
          orderId: orderId,
          paymentId: payment.id,
          description: description || `Payment for order ${order.orderNumber}`
        }
      });
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          gatewayOrderId: razorpayOrder.id,
          gatewayName: 'RAZORPAY'
        }
      });
      
      return {
        success: true,
        paymentId: payment.id,
        orderId,
        gatewayOrderId: razorpayOrder.id,
        paymentUrl: `https://api.razorpay.com/v1/checkout/embedded/${razorpayOrder.id}`
      };
    } 
    else if (gateway === 'STRIPE') {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: amount * 100, // Stripe expects amount in cents
        currency: currency.toLowerCase(),
        description: description || `Payment for order ${order.orderNumber}`,
        metadata: {
          orderId,
          paymentId: payment.id,
          orderNumber: order.orderNumber
        },
        receipt_email: customerEmail || order.customer?.email,
      });
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          gatewayOrderId: paymentIntent.id,
          gatewayName: 'STRIPE'
        }
      });
      
      return {
        success: true,
        paymentId: payment.id,
        orderId,
        gatewayOrderId: paymentIntent.id,
        gatewayPaymentId: paymentIntent.client_secret
      };
    }
    else {
      // Internal payment processing (Cash, UPI direct, etc.)
      return {
        success: true,
        paymentId: payment.id,
        orderId
      };
    }
  } catch (error) {
    console.error('Payment creation error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown payment error' 
    };
  }
};

export const verifyPayment = async (
  gatewayName: PaymentGateway,
  paymentId: string,
  gatewayPaymentId: string,
  gatewayOrderId: string,
  gatewaySignature?: string
): Promise<PaymentResponse> => {
  try {
    // Find the payment in our database
    const payment = await prisma.payment.findFirst({
      where: { 
        gatewayOrderId,
        gatewayName
      },
      include: { order: true }
    });
    
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }
    
    if (gatewayName === 'RAZORPAY' && gatewaySignature) {
      // Verify Razorpay signature
      const generated_signature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(gatewayOrderId + "|" + gatewayPaymentId)
        .digest('hex');
        
      if (generated_signature !== gatewaySignature) {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            paymentStatus: 'FAILED',
            gatewayPaymentId,
            paymentReference: 'Signature verification failed'
          }
        });
        return { success: false, error: 'Invalid payment signature' };
      }
    } 
    else if (gatewayName === 'STRIPE') {
      // Verify Stripe payment
      const paymentIntent = await stripe.paymentIntents.retrieve(gatewayOrderId);
      if (paymentIntent.status !== 'succeeded') {
        await prisma.payment.update({
          where: { id: payment.id },
          data: { 
            paymentStatus: 'FAILED',
            gatewayPaymentId,
            paymentReference: `Stripe payment status: ${paymentIntent.status}`
          }
        });
        return { success: false, error: `Payment not successful: ${paymentIntent.status}` };
      }
    }
    
    // Update payment status to completed
    await prisma.payment.update({
      where: { id: payment.id },
      data: { 
        paymentStatus: 'COMPLETED',
        gatewayPaymentId,
        paymentReference: `${gatewayName} payment successful`
      }
    });
    
    // Update order status to COMPLETED
    await prisma.order.update({
      where: { id: payment.order.id },
      data: { status: 'COMPLETED' }
    });
    
    // If it's a dine-in order, update table status to CLEANING
    if (payment.order.type === 'DINE_IN' && payment.order.tableId) {
      await prisma.table.update({
        where: { id: payment.order.tableId },
        data: { status: 'CLEANING' }
      });
    }
    
    return { 
      success: true, 
      paymentId: payment.id,
      orderId: payment.order.id,
      gatewayPaymentId
    };
  } catch (error) {
    console.error('Payment verification error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown verification error' 
    };
  }
};

export const processRefund = async (
  paymentId: string,
  amount?: number,
  reason?: string
): Promise<PaymentResponse> => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { order: true }
    });
    
    if (!payment) {
      return { success: false, error: 'Payment not found' };
    }
    
    if (payment.paymentStatus !== 'COMPLETED') {
      return { success: false, error: 'Only completed payments can be refunded' };
    }
    
    const refundAmount = amount || Number(payment.amount);
    
    if (payment.gatewayName === 'RAZORPAY' && payment.gatewayPaymentId) {
      const refund = await razorpay.payments.refund(payment.gatewayPaymentId, {
        amount: refundAmount * 100,
        notes: {
          reason: reason || 'Customer requested refund',
          orderId: payment.order.id,
          orderNumber: payment.order.orderNumber
        }
      });
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          paymentStatus: 'REFUNDED',
          paymentReference: `Refunded: ${refund.id}`
        }
      });
      
      return { 
        success: true, 
        paymentId: payment.id,
        orderId: payment.order.id,
        gatewayPaymentId: refund.id
      };
    } 
    else if (payment.gatewayName === 'STRIPE' && payment.gatewayPaymentId) {
      const refund = await stripe.refunds.create({
        payment_intent: payment.gatewayOrderId || '',
        amount: refundAmount * 100,
        reason: 'requested_by_customer'
      });
      
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          paymentStatus: 'REFUNDED',
          paymentReference: `Refunded: ${refund.id}`
        }
      });
      
      return { 
        success: true, 
        paymentId: payment.id,
        orderId: payment.order.id,
        gatewayPaymentId: refund.id
      };
    }
    else {
      // Manual refund process for cash or other methods
      await prisma.payment.update({
        where: { id: payment.id },
        data: { 
          paymentStatus: 'REFUNDED',
          paymentReference: reason || 'Manual refund processed'
        }
      });
      
      return { 
        success: true, 
        paymentId: payment.id,
        orderId: payment.order.id
      };
    }
  } catch (error) {
    console.error('Refund processing error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown refund error' 
    };
  }
}; 