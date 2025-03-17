'use client';

import { useState } from 'react';
import Link from 'next/link';
import PerformanceMetrics from '@/components/PerformanceMetrics';

export default function PerformanceOptimizationPage() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Mock recommendations based on time range
  const getRecommendations = () => {
    switch (timeRange) {
      case 'day':
        return [
          { id: 1, category: 'Staffing', title: 'Adjust staff schedule for lunch rush', impact: 'high', description: 'Current lunch rush (12-2pm) is understaffed by approximately 2 servers based on order volume.' },
          { id: 2, category: 'Menu', title: 'Promote daily specials more prominently', impact: 'medium', description: 'Daily specials have 15% higher profit margins but account for only 8% of today\'s orders.' },
          { id: 3, category: 'Operations', title: 'Reduce preparation time for pasta dishes', impact: 'medium', description: 'Pasta dishes are taking 4 minutes longer than average to prepare during peak hours.' }
        ];
      case 'week':
        return [
          { id: 1, category: 'Inventory', title: 'Optimize vegetable ordering', impact: 'high', description: 'Vegetable waste is 12% higher than target. Consider reducing order quantities or finding alternative suppliers.' },
          { id: 2, category: 'Staffing', title: 'Adjust weekend staffing levels', impact: 'high', description: 'Saturday evening is consistently understaffed based on table turnover rates and customer wait times.' },
          { id: 3, category: 'Menu', title: 'Review pricing for appetizers', impact: 'medium', description: 'Appetizer orders have decreased by 8% this week, potentially due to recent price increases.' },
          { id: 4, category: 'Marketing', title: 'Promote weekday lunch specials', impact: 'medium', description: 'Tuesday and Wednesday lunch periods are showing 15% lower occupancy than other weekdays.' }
        ];
      case 'year':
        return [
          { id: 1, category: 'Strategy', title: 'Evaluate seasonal menu changes', impact: 'high', description: 'Seasonal menu items outperform standard menu items by 22% in profit margin.' },
          { id: 2, category: 'Operations', title: 'Review kitchen layout efficiency', impact: 'high', description: 'Kitchen efficiency metrics suggest potential for 15% improvement with optimized station layout.' },
          { id: 3, category: 'Marketing', title: 'Develop annual marketing calendar', impact: 'medium', description: 'Sales show predictable seasonal patterns that could be leveraged with targeted promotions.' },
          { id: 4, category: 'Staffing', title: 'Implement improved staff training program', impact: 'high', description: 'Staff turnover is 25% higher than industry average, suggesting need for improved onboarding and training.' },
          { id: 5, category: 'Technology', title: 'Upgrade POS system capabilities', impact: 'medium', description: 'Current POS system lacks features that could reduce order processing time by up to 30%.' }
        ];
      case 'month':
      default:
        return [
          { id: 1, category: 'Menu', title: 'Optimize menu item mix', impact: 'high', description: 'Bottom 5 selling items account for 20% of inventory costs but only 3% of sales.' },
          { id: 2, category: 'Operations', title: 'Improve table turnover rate', impact: 'high', description: 'Average table occupancy time is 15 minutes longer than optimal during peak hours.' },
          { id: 3, category: 'Marketing', title: 'Enhance loyalty program engagement', impact: 'medium', description: 'Only 35% of repeat customers are enrolled in the loyalty program.' },
          { id: 4, category: 'Inventory', title: 'Reduce beverage stockouts', impact: 'medium', description: 'Popular beverages experienced stockouts on 6 occasions this month, affecting approximately 45 orders.' }
        ];
    }
  };
  
  const recommendations = getRecommendations();
  
  // Impact badge color
  const getImpactColor = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Category badge color
  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'menu':
        return 'bg-green-100 text-green-800';
      case 'operations':
        return 'bg-blue-100 text-blue-800';
      case 'staffing':
        return 'bg-purple-100 text-purple-800';
      case 'inventory':
        return 'bg-yellow-100 text-yellow-800';
      case 'marketing':
        return 'bg-pink-100 text-pink-800';
      case 'strategy':
        return 'bg-indigo-100 text-indigo-800';
      case 'technology':
        return 'bg-cyan-100 text-cyan-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Performance Optimization</h1>
        <Link 
          href="/dashboard/analytics" 
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
        >
          Back to Analytics
        </Link>
      </div>
      
      {/* Time Range Selector */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Time Range</h2>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => setTimeRange('day')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'day' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Today
          </button>
          <button
            onClick={() => setTimeRange('week')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'week' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
          <button
            onClick={() => setTimeRange('month')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'month' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setTimeRange('year')}
            className={`px-4 py-2 rounded-md ${
              timeRange === 'year' 
                ? 'bg-indigo-600 text-white' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            This Year
          </button>
        </div>
      </div>
      
      {/* Performance Metrics */}
      <PerformanceMetrics timeRange={timeRange} />
      
      {/* Optimization Recommendations */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Optimization Recommendations</h2>
        <div className="space-y-4">
          {recommendations.map((recommendation) => (
            <div key={recommendation.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex flex-wrap gap-2 mb-2">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(recommendation.category)}`}>
                  {recommendation.category}
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getImpactColor(recommendation.impact)}`}>
                  {recommendation.impact.charAt(0).toUpperCase() + recommendation.impact.slice(1)} Impact
                </span>
              </div>
              <h3 className="text-lg font-medium text-gray-900">{recommendation.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{recommendation.description}</p>
              <div className="mt-4 flex justify-end">
                <button className="text-sm text-indigo-600 hover:text-indigo-800">
                  View Details
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Performance Insights */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Performance Insights</h2>
        
        {/* Peak Hours Analysis */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Peak Hours Analysis</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-4">
              The chart below shows customer traffic patterns throughout the day, helping identify peak hours and staffing needs.
            </p>
            <div className="h-64 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">Peak Hours Chart Placeholder</p>
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700">Key Findings:</h4>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Lunch peak occurs between 12:00 PM and 1:30 PM</li>
                <li>Dinner peak occurs between 6:30 PM and 8:30 PM</li>
                <li>Weekend patterns differ significantly from weekdays</li>
                <li>Average wait time increases by 35% during peak hours</li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Staff Efficiency */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Staff Efficiency</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-4">
              Analysis of staff performance metrics to identify training opportunities and optimize scheduling.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500">Average Orders Per Server</h4>
                <p className="text-xl font-bold">24.5</p>
                <p className="text-xs text-green-600">+5.2% vs. last period</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500">Average Order Processing Time</h4>
                <p className="text-xl font-bold">3.2 min</p>
                <p className="text-xs text-red-600">+0.4 min vs. target</p>
              </div>
              <div className="bg-white p-3 rounded border border-gray-200">
                <h4 className="text-xs font-medium text-gray-500">Kitchen Ticket Completion Rate</h4>
                <p className="text-xl font-bold">92.8%</p>
                <p className="text-xs text-green-600">+1.5% vs. last period</p>
              </div>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-700">Recommendations:</h4>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-600 space-y-1">
                <li>Provide additional training for new staff on POS system usage</li>
                <li>Adjust kitchen staffing during Thursday dinner service</li>
                <li>Review server section assignments to balance workload</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 