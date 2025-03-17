'use client';

import { useState, useEffect } from 'react';

interface QRCodeGeneratorProps {
  url: string;
  size?: number;
  title?: string;
  description?: string;
}

export default function QRCodeGenerator({
  url,
  size = 200,
  title,
  description
}: QRCodeGeneratorProps) {
  const [qrCodeSrc, setQrCodeSrc] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Generate QR code using Google Charts API
    const encodedUrl = encodeURIComponent(url);
    const qrCodeUrl = `https://chart.googleapis.com/chart?cht=qr&chl=${encodedUrl}&chs=${size}x${size}&choe=UTF-8&chld=L|0`;
    setQrCodeSrc(qrCodeUrl);
    setIsLoading(false);
  }, [url, size]);

  const handleDownload = () => {
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = qrCodeSrc;
    link.download = `qrcode-${new Date().getTime()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <div className="text-gray-500">Loading QR code...</div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {title && <h3 className="text-lg font-semibold mb-2">{title}</h3>}
      {description && <p className="text-gray-600 mb-4">{description}</p>}
      
      <div className="flex flex-col items-center">
        <div className="border p-3 bg-white rounded-md mb-4">
          <img 
            src={qrCodeSrc} 
            alt="QR Code" 
            width={size} 
            height={size} 
            className="mx-auto"
          />
        </div>
        
        <div className="text-xs text-gray-500 mb-4 text-center">
          Scan this QR code to provide feedback
        </div>
        
        <button
          onClick={handleDownload}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 text-sm"
        >
          Download QR Code
        </button>
      </div>
    </div>
  );
} 