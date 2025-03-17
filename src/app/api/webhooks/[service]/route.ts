import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { successResponse, errorResponse } from '@/utils/api';

export async function POST(
  request: NextRequest,
  { params }: { params: { service: string } }
) {
  const service = params.service;
  
  try {
    // Verify the webhook signature if needed
    // This would be different for each service
    
    const body = await request.json();
    
    // Log the webhook
    const integration = await prisma.integration.findFirst({
      where: {
        name: {
          equals: service.toUpperCase(),
          mode: 'insensitive'
        }
      }
    });
    
    if (!integration) {
      return errorResponse(`Integration for ${service} not found`, 404);
    }
    
    // Store the webhook in the database
    const webhook = await prisma.webhook.create({
      data: {
        event: body.event || 'unknown',
        payload: JSON.stringify(body),
        status: 'PENDING',
        integrationId: integration.id
      }
    });
    
    // Process the webhook based on the service and event
    switch (service.toLowerCase()) {
      case 'swiggy':
        await handleSwiggyWebhook(body, webhook.id);
        break;
      case 'zomato':
        await handleZomatoWebhook(body, webhook.id);
        break;
      default:
        return errorResponse(`Unsupported service: ${service}`, 400);
    }
    
    // Update webhook status
    await prisma.webhook.update({
      where: { id: webhook.id },
      data: {
        status: 'PROCESSED',
        processedAt: new Date()
      }
    });
    
    return successResponse({ received: true });
  } catch (error) {
    console.error(`Error processing ${service} webhook:`, error);
    return errorResponse('Failed to process webhook', 500);
  }
}

async function handleSwiggyWebhook(payload: any, webhookId: string) {
  // Extract the event type
  const eventType = payload.event;
  
  switch (eventType) {
    case 'order.placed':
      await handleSwiggyOrderPlaced(payload.data);
      break;
    case 'order.status_updated':
      await handleSwiggyOrderStatusUpdated(payload.data);
      break;
    case 'order.cancelled':
      await handleSwiggyOrderCancelled(payload.data);
      break;
    default:
      console.log(`Unhandled Swiggy event: ${eventType}`);
  }
}

async function handleZomatoWebhook(payload: any, webhookId: string) {
  // Extract the event type
  const eventType = payload.event;
  
  switch (eventType) {
    case 'order_placed':
      await handleZomatoOrderPlaced(payload.data);
      break;
    case 'order_status_update':
      await handleZomatoOrderStatusUpdated(payload.data);
      break;
    case 'order_cancelled':
      await handleZomatoOrderCancelled(payload.data);
      break;
    default:
      console.log(`Unhandled Zomato event: ${eventType}`);
  }
}

// Swiggy webhook handlers
async function handleSwiggyOrderPlaced(data: any) {
  // Check if order already exists
  const existingOrder = await prisma.order.findFirst({
    where: {
      externalOrderId: data.order_id,
      externalPlatform: 'SWIGGY'
    }
  });
  
  if (existingOrder) {
    console.log(`Swiggy order ${data.order_id} already exists`);
    return;
  }
  
  // Find the default branch and user
  const branch = await prisma.branch.findFirst({
    where: { name: 'Main Branch' }
  });
  
  const adminUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' }
  });
  
  if (!branch || !adminUser) {
    throw new Error('Branch or admin user not found');
  }
  
  // Create the order
  const order = await prisma.order.create({
    data: {
      orderNumber: `SW-${data.order_id}`,
      status: 'PENDING',
      type: 'DELIVERY',
      totalAmount: data.order_total,
      tax: data.tax_amount || 0,
      discount: data.discount || 0,
      grandTotal: data.order_total,
      paymentStatus: data.payment_status === 'PAID' ? 'COMPLETED' : 'PENDING',
      paymentMethod: 'ONLINE',
      notes: data.special_instructions || '',
      userId: adminUser.id,
      branchId: branch.id,
      externalOrderId: data.order_id,
      externalPlatform: 'SWIGGY',
      items: {
        create: data.items.map((item: any) => ({
          quantity: item.quantity,
          price: item.price,
          notes: item.special_instructions || '',
          menuItemId: item.item_id // Assuming item_id matches your menuItemId
        }))
      },
      deliveryInfo: {
        create: {
          customerName: data.customer_name,
          customerPhone: data.customer_phone,
          customerEmail: data.customer_email || '',
          address: data.delivery_address,
          deliveryNotes: data.delivery_instructions || '',
          deliveryStatus: 'PENDING',
          estimatedTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
          deliveryFee: data.delivery_fee || 0
        }
      }
    }
  });
  
  console.log(`Created Swiggy order: ${order.id}`);
}

async function handleSwiggyOrderStatusUpdated(data: any) {
  // Find the order
  const order = await prisma.order.findFirst({
    where: {
      externalOrderId: data.order_id,
      externalPlatform: 'SWIGGY'
    },
    include: {
      deliveryInfo: true
    }
  });
  
  if (!order) {
    console.log(`Swiggy order ${data.order_id} not found`);
    return;
  }
  
  // Map Swiggy status to our status
  let orderStatus: any;
  let deliveryStatus: any;
  
  switch (data.status) {
    case 'ACCEPTED':
      orderStatus = 'CONFIRMED';
      deliveryStatus = 'PENDING';
      break;
    case 'PREPARING':
      orderStatus = 'PREPARING';
      deliveryStatus = 'PENDING';
      break;
    case 'READY_FOR_PICKUP':
      orderStatus = 'READY';
      deliveryStatus = 'PENDING';
      break;
    case 'PICKED_UP':
      orderStatus = 'READY';
      deliveryStatus = 'PICKED_UP';
      break;
    case 'DELIVERED':
      orderStatus = 'COMPLETED';
      deliveryStatus = 'DELIVERED';
      break;
    case 'CANCELLED':
      orderStatus = 'CANCELLED';
      deliveryStatus = 'FAILED';
      break;
    default:
      orderStatus = order.status;
      deliveryStatus = order.deliveryInfo?.deliveryStatus || 'PENDING';
  }
  
  // Update the order
  await prisma.order.update({
    where: { id: order.id },
    data: { status: orderStatus }
  });
  
  // Update delivery info if it exists
  if (order.deliveryInfo) {
    await prisma.deliveryInfo.update({
      where: { id: order.deliveryInfo.id },
      data: { 
        deliveryStatus,
        estimatedTime: data.estimated_delivery_time ? new Date(data.estimated_delivery_time) : undefined,
        actualTime: deliveryStatus === 'DELIVERED' ? new Date() : undefined
      }
    });
  }
  
  console.log(`Updated Swiggy order ${order.id} status to ${orderStatus}`);
}

async function handleSwiggyOrderCancelled(data: any) {
  // Find the order
  const order = await prisma.order.findFirst({
    where: {
      externalOrderId: data.order_id,
      externalPlatform: 'SWIGGY'
    },
    include: {
      deliveryInfo: true
    }
  });
  
  if (!order) {
    console.log(`Swiggy order ${data.order_id} not found`);
    return;
  }
  
  // Update the order
  await prisma.order.update({
    where: { id: order.id },
    data: { status: 'CANCELLED' }
  });
  
  // Update delivery info if it exists
  if (order.deliveryInfo) {
    await prisma.deliveryInfo.update({
      where: { id: order.deliveryInfo.id },
      data: { deliveryStatus: 'FAILED' }
    });
  }
  
  console.log(`Cancelled Swiggy order ${order.id}`);
}

// Zomato webhook handlers
async function handleZomatoOrderPlaced(data: any) {
  // Implementation similar to Swiggy but with Zomato's data structure
  console.log('Handling Zomato order placed');
}

async function handleZomatoOrderStatusUpdated(data: any) {
  // Implementation similar to Swiggy but with Zomato's data structure
  console.log('Handling Zomato order status update');
}

async function handleZomatoOrderCancelled(data: any) {
  // Implementation similar to Swiggy but with Zomato's data structure
  console.log('Handling Zomato order cancelled');
} 