'use client';

import React, { useEffect, useRef, useState } from 'react';

interface DataVisualizationProps {
  title: string;
  description?: string;
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
  height?: number;
  showLegend?: boolean;
}

const DataVisualization: React.FC<DataVisualizationProps> = ({
  title,
  description,
  type,
  labels,
  datasets,
  height = 300,
  showLegend = true
}) => {
  const [isClient, setIsClient] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsClient(true);
    
    // In a real implementation, we would use a charting library like Chart.js
    // For this example, we'll just render a placeholder
    if (chartRef.current) {
      renderChart();
    }
  }, []);

  const renderPlaceholder = () => {
    return (
      <div 
        className="flex items-center justify-center bg-gray-100 rounded-lg"
        style={{ height: `${height}px` }}
      >
        <p className="text-gray-500">Chart visualization would appear here</p>
      </div>
    );
  };

  const renderBarChart = () => {
    // This is a simplified placeholder for a bar chart
    const maxValue = Math.max(...datasets.flatMap(dataset => dataset.data));
    
    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="flex h-full items-end">
          {labels.map((label, index) => {
            const dataPoints = datasets.map(dataset => dataset.data[index]);
            const maxDataPoint = Math.max(...dataPoints);
            const percentage = (maxDataPoint / maxValue) * 100;
            
            return (
              <div key={index} className="flex-1 flex flex-col items-center mx-1">
                <div className="w-full flex justify-center items-end h-[80%]">
                  {datasets.map((dataset, datasetIndex) => {
                    const value = dataset.data[index];
                    const barPercentage = (value / maxValue) * 100;
                    const backgroundColor = Array.isArray(dataset.backgroundColor) 
                      ? dataset.backgroundColor[index % dataset.backgroundColor.length]
                      : dataset.backgroundColor || '#4F46E5';
                    
                    return (
                      <div 
                        key={datasetIndex}
                        className="w-full mx-0.5 rounded-t"
                        style={{ 
                          height: `${barPercentage}%`,
                          backgroundColor,
                        }}
                        title={`${dataset.label}: ${value}`}
                      />
                    );
                  })}
                </div>
                <div className="text-xs mt-2 text-gray-600 truncate w-full text-center">
                  {label}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderLineChart = () => {
    // This is a simplified placeholder for a line chart
    const maxValue = Math.max(...datasets.flatMap(dataset => dataset.data));
    const points = labels.length;
    
    return (
      <div className="relative" style={{ height: `${height}px` }}>
        <div className="absolute inset-0 flex flex-col justify-between py-4">
          <div className="border-b border-gray-200 relative">
            <span className="absolute -top-3 -left-2 text-xs text-gray-500">{maxValue}</span>
          </div>
          <div className="border-b border-gray-200 relative">
            <span className="absolute -top-3 -left-2 text-xs text-gray-500">{Math.round(maxValue * 0.75)}</span>
          </div>
          <div className="border-b border-gray-200 relative">
            <span className="absolute -top-3 -left-2 text-xs text-gray-500">{Math.round(maxValue * 0.5)}</span>
          </div>
          <div className="border-b border-gray-200 relative">
            <span className="absolute -top-3 -left-2 text-xs text-gray-500">{Math.round(maxValue * 0.25)}</span>
          </div>
          <div className="border-b border-gray-200 relative">
            <span className="absolute -top-3 -left-2 text-xs text-gray-500">0</span>
          </div>
        </div>
        
        <div className="absolute inset-0 pt-4 pb-8">
          {datasets.map((dataset, datasetIndex) => {
            const linePoints = dataset.data.map((value, index) => {
              const x = (index / (points - 1)) * 100;
              const y = 100 - (value / maxValue) * 100;
              return `${x}% ${y}%`;
            }).join(', ');
            
            const backgroundColor = Array.isArray(dataset.backgroundColor) 
              ? dataset.backgroundColor[0]
              : dataset.backgroundColor || 'rgba(79, 70, 229, 0.1)';
            
            const borderColor = dataset.borderColor || '#4F46E5';
            
            return (
              <div key={datasetIndex} className="absolute inset-0">
                <svg className="w-full h-full" preserveAspectRatio="none">
                  <polyline
                    points={linePoints}
                    fill="none"
                    stroke={borderColor as string}
                    strokeWidth="2"
                    vectorEffect="non-scaling-stroke"
                  />
                </svg>
              </div>
            );
          })}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 flex justify-between px-2">
          {labels.map((label, index) => (
            <div key={index} className="text-xs text-gray-600 truncate" style={{ width: `${100 / points}%` }}>
              {label}
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderPieChart = () => {
    // This is a simplified placeholder for a pie chart
    const total = datasets[0].data.reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;
    
    return (
      <div className="flex justify-center items-center" style={{ height: `${height}px` }}>
        <div className="relative" style={{ width: `${height * 0.8}px`, height: `${height * 0.8}px` }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {datasets[0].data.map((value, index) => {
              const percentage = (value / total) * 100;
              const angle = (percentage / 100) * 360;
              
              // Calculate the SVG arc path
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;
              
              const startX = 50 + 50 * Math.cos((startAngle - 90) * (Math.PI / 180));
              const startY = 50 + 50 * Math.sin((startAngle - 90) * (Math.PI / 180));
              const endX = 50 + 50 * Math.cos((endAngle - 90) * (Math.PI / 180));
              const endY = 50 + 50 * Math.sin((endAngle - 90) * (Math.PI / 180));
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const backgroundColor = Array.isArray(datasets[0].backgroundColor) 
                ? datasets[0].backgroundColor[index % datasets[0].backgroundColor.length]
                : '#4F46E5';
              
              return (
                <path
                  key={index}
                  d={`M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  fill={backgroundColor as string}
                  stroke="#fff"
                  strokeWidth="1"
                  title={`${labels[index]}: ${value} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
          </svg>
        </div>
        
        {showLegend && (
          <div className="ml-4 flex flex-col">
            {labels.map((label, index) => {
              const backgroundColor = Array.isArray(datasets[0].backgroundColor) 
                ? datasets[0].backgroundColor[index % datasets[0].backgroundColor.length]
                : '#4F46E5';
              
              return (
                <div key={index} className="flex items-center mb-1">
                  <div 
                    className="w-3 h-3 mr-2"
                    style={{ backgroundColor: backgroundColor as string }}
                  />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderDoughnutChart = () => {
    // This is a simplified placeholder for a doughnut chart
    const total = datasets[0].data.reduce((sum, value) => sum + value, 0);
    let currentAngle = 0;
    
    return (
      <div className="flex justify-center items-center" style={{ height: `${height}px` }}>
        <div className="relative" style={{ width: `${height * 0.8}px`, height: `${height * 0.8}px` }}>
          <svg viewBox="0 0 100 100" className="w-full h-full">
            {/* Inner circle (hole) */}
            <circle cx="50" cy="50" r="30" fill="white" />
            
            {datasets[0].data.map((value, index) => {
              const percentage = (value / total) * 100;
              const angle = (percentage / 100) * 360;
              
              // Calculate the SVG arc path
              const startAngle = currentAngle;
              const endAngle = currentAngle + angle;
              currentAngle = endAngle;
              
              const startX = 50 + 50 * Math.cos((startAngle - 90) * (Math.PI / 180));
              const startY = 50 + 50 * Math.sin((startAngle - 90) * (Math.PI / 180));
              const endX = 50 + 50 * Math.cos((endAngle - 90) * (Math.PI / 180));
              const endY = 50 + 50 * Math.sin((endAngle - 90) * (Math.PI / 180));
              
              const largeArcFlag = angle > 180 ? 1 : 0;
              
              const backgroundColor = Array.isArray(datasets[0].backgroundColor) 
                ? datasets[0].backgroundColor[index % datasets[0].backgroundColor.length]
                : '#4F46E5';
              
              return (
                <path
                  key={index}
                  d={`M 50 50 L ${startX} ${startY} A 50 50 0 ${largeArcFlag} 1 ${endX} ${endY} Z`}
                  fill={backgroundColor as string}
                  stroke="#fff"
                  strokeWidth="1"
                  title={`${labels[index]}: ${value} (${percentage.toFixed(1)}%)`}
                />
              );
            })}
            
            {/* Inner circle (hole) - ensure it's on top */}
            <circle cx="50" cy="50" r="30" fill="white" />
          </svg>
        </div>
        
        {showLegend && (
          <div className="ml-4 flex flex-col">
            {labels.map((label, index) => {
              const backgroundColor = Array.isArray(datasets[0].backgroundColor) 
                ? datasets[0].backgroundColor[index % datasets[0].backgroundColor.length]
                : '#4F46E5';
              
              return (
                <div key={index} className="flex items-center mb-1">
                  <div 
                    className="w-3 h-3 mr-2"
                    style={{ backgroundColor: backgroundColor as string }}
                  />
                  <span className="text-xs text-gray-600">{label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'doughnut':
        return renderDoughnutChart();
      default:
        return renderPlaceholder();
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        {description && <p className="mt-1 text-sm text-gray-500">{description}</p>}
      </div>
      
      <div ref={chartRef} className="mt-4">
        {isClient ? renderChart() : renderPlaceholder()}
      </div>
    </div>
  );
};

export default DataVisualization; 