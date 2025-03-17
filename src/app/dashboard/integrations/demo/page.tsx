'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GoogleMapsIntegration from '@/components/GoogleMapsIntegration';
import DeliveryServiceIntegration from '@/components/DeliveryServiceIntegration';
import { toast, Toaster } from 'react-hot-toast';

export default function IntegrationsDemo() {
  const [activeTab, setActiveTab] = useState('maps');
  const [integrations, setIntegrations] = useState<any>({
    googleMaps: {
      apiKey: 'GOOGLE_MAPS_API_KEY_PLACEHOLDER',
      status: 'ACTIVE'
    },
    swiggy: {
      apiKey: 'SWIGGY_API_KEY_PLACEHOLDER',
      merchantId: 'SWIGGY123456',
      status: 'ACTIVE'
    },
    zomato: {
      apiKey: 'ZOMATO_API_KEY_PLACEHOLDER',
      merchantId: 'ZOMATO789012',
      status: 'ACTIVE'
    },
    whatsapp: {
      apiKey: 'WHATSAPP_API_KEY_PLACEHOLDER',
      secretKey: 'WHATSAPP_SECRET_KEY_PLACEHOLDER',
      status: 'ACTIVE'
    }
  });
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [showDeliveryTracking, setShowDeliveryTracking] = useState(false);

  // Handle order acceptance
  const handleOrderAccept = (order: any) => {
    toast.success(`Order #${order.externalId} accepted`);
    
    // Show delivery tracking for this order
    setSelectedOrderId(order.id);
    setShowDeliveryTracking(true);
    setActiveTab('maps');
  };
  
  // Handle order rejection
  const handleOrderReject = (order: any) => {
    toast.error(`Order #${order.externalId} rejected`);
  };

  return (
    <div>
      <Toaster position="top-right" />
      
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Integrations Demo</h1>
        <p className="text-gray-500 mt-1">
          This page demonstrates how the different third-party integrations work together.
        </p>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="maps">Google Maps</TabsTrigger>
          <TabsTrigger value="swiggy">Swiggy</TabsTrigger>
          <TabsTrigger value="zomato">Zomato</TabsTrigger>
          <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        </TabsList>
        
        <TabsContent value="maps" className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4 mb-4">
            <h2 className="text-lg font-semibold mb-2">Google Maps Integration</h2>
            <p className="text-gray-600 mb-4">
              Displays restaurant locations and delivery tracking in real-time.
            </p>
            
            {showDeliveryTracking && selectedOrderId && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-3 mb-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 mt-0.5">
                    <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-blue-800">Tracking Delivery</h3>
                    <p className="text-sm text-blue-700 mt-1">
                      Currently tracking delivery for Order #{selectedOrderId}. The map shows the current location of the delivery agent.
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <GoogleMapsIntegration 
              apiKey={integrations.googleMaps.apiKey}
              height="500px"
              showDeliveryTracking={showDeliveryTracking}
              orderId={selectedOrderId || undefined}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="swiggy" className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-2">Swiggy Integration</h2>
            <p className="text-gray-600 mb-4">
              Manage Swiggy orders directly from RestaurantOS. Accept or reject orders, update status, and track deliveries.
            </p>
            
            <DeliveryServiceIntegration 
              platform="SWIGGY"
              apiKey={integrations.swiggy.apiKey}
              merchantId={integrations.swiggy.merchantId}
              onAccept={handleOrderAccept}
              onReject={handleOrderReject}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="zomato" className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-2">Zomato Integration</h2>
            <p className="text-gray-600 mb-4">
              Manage Zomato orders directly from RestaurantOS. Accept or reject orders, update status, and track deliveries.
            </p>
            
            <DeliveryServiceIntegration 
              platform="ZOMATO"
              apiKey={integrations.zomato.apiKey}
              merchantId={integrations.zomato.merchantId}
              onAccept={handleOrderAccept}
              onReject={handleOrderReject}
            />
          </div>
        </TabsContent>
        
        <TabsContent value="whatsapp" className="space-y-6">
          <div className="bg-white rounded-lg shadow-md p-4">
            <h2 className="text-lg font-semibold mb-2">WhatsApp Business Integration</h2>
            <p className="text-gray-600 mb-4">
              Send automated notifications to customers about their orders, promotions, and more.
            </p>
            
            <div className="border border-gray-200 rounded-lg p-4">
              <h3 className="font-medium text-gray-800 mb-3">WhatsApp Notification Templates</h3>
              
              <div className="space-y-4">
                {/* Order Confirmation Template */}
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-700">Order Confirmation</h4>
                    <button 
                      className="text-indigo-600 text-sm hover:text-indigo-800"
                      onClick={() => toast.success('Test message sent!')}
                    >
                      Send Test
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Sent when a customer places an order.
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p>Hello {{customer_name}},</p>
                    <p className="mt-2">Your order #{{order_id}} has been confirmed and is being prepared. Estimated delivery time: {{delivery_time}}.</p>
                    <p className="mt-2">Thank you for choosing RestaurantOS!</p>
                  </div>
                </div>
                
                {/* Order Status Update Template */}
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-700">Order Status Update</h4>
                    <button 
                      className="text-indigo-600 text-sm hover:text-indigo-800"
                      onClick={() => toast.success('Test message sent!')}
                    >
                      Send Test
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Sent when an order status changes.
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p>Hello {{customer_name}},</p>
                    <p className="mt-2">Your order #{{order_id}} status has been updated to: {{order_status}}.</p>
                    <p className="mt-2">Track your order here: {{tracking_link}}</p>
                  </div>
                </div>
                
                {/* Delivery Notification Template */}
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-700">Delivery Notification</h4>
                    <button 
                      className="text-indigo-600 text-sm hover:text-indigo-800"
                      onClick={() => toast.success('Test message sent!')}
                    >
                      Send Test
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Sent when an order is out for delivery.
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p>Hello {{customer_name}},</p>
                    <p className="mt-2">Your order #{{order_id}} is on the way! Estimated arrival: {{delivery_time}}.</p>
                    <p className="mt-2">Your delivery agent {{delivery_agent_name}} is on the way. Contact: {{delivery_agent_phone}}</p>
                  </div>
                </div>
                
                {/* Promotional Message Template */}
                <div className="border border-gray-200 rounded-md p-3">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-medium text-gray-700">Promotional Message</h4>
                    <button 
                      className="text-indigo-600 text-sm hover:text-indigo-800"
                      onClick={() => toast.success('Test message sent!')}
                    >
                      Send Test
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    Sent for marketing campaigns.
                  </p>
                  <div className="bg-gray-50 p-3 rounded-md text-sm">
                    <p>Hello {{customer_name}},</p>
                    <p className="mt-2">We miss you! It's been a while since your last order. Use code {{promo_code}} for {{discount}}% off on your next order.</p>
                    <p className="mt-2">Valid until {{expiry_date}}. Order now: {{order_link}}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
} 