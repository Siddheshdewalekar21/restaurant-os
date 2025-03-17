import { NextRequest } from 'next/server';
import { successResponse } from '@/utils/api';

export async function GET(request: NextRequest) {
  return successResponse({ message: 'API is working correctly' });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    return successResponse({ 
      message: 'POST request received successfully', 
      receivedData: body 
    });
  } catch (error) {
    return successResponse({ 
      message: 'POST request received, but could not parse JSON body',
      error: String(error)
    });
  }
} 