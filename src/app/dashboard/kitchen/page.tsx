'use client';

import { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import KitchenOrderTicket from '@/components/KitchenOrderTicket';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ResponsiveContainer from '@/components/ResponsiveContainer';

export default function KitchenDashboardPage() {
  const [activeTab, setActiveTab] = useState('active');

  return (
    <ResponsiveContainer>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <h1 className="text-2xl font-bold">Kitchen Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-500">
              Real-time kitchen order management
            </span>
          </div>
        </div>

        <Tabs defaultValue="active" onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="active">Active Orders</TabsTrigger>
            <TabsTrigger value="completed">Completed Orders</TabsTrigger>
            <TabsTrigger value="all">All Orders</TabsTrigger>
          </TabsList>
          
          <TabsContent value="active" className="mt-0">
            <KitchenOrderTicket showCompleted={false} />
          </TabsContent>
          
          <TabsContent value="completed" className="mt-0">
            <KitchenOrderTicket showCompleted={true} />
          </TabsContent>
          
          <TabsContent value="all" className="mt-0">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Kitchen Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Average Preparation Time</span>
                      <span className="font-medium">12 minutes</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Orders Completed Today</span>
                      <span className="font-medium">24</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Current Queue Length</span>
                      <span className="font-medium">5 orders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Efficiency Rating</span>
                      <span className="font-medium text-green-600">92%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Popular Items Today</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span>Chicken Burger</span>
                      <span className="font-medium">18 orders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>French Fries</span>
                      <span className="font-medium">15 orders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Vegetable Pizza</span>
                      <span className="font-medium">12 orders</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Chocolate Brownie</span>
                      <span className="font-medium">10 orders</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </ResponsiveContainer>
  );
} 