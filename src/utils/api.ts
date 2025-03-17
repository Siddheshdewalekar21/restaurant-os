import { NextResponse } from 'next/server';

// Standard API response format
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Success response
export function successResponse(data: any, message: string = 'Success') {
  return NextResponse.json({
    success: true,
    message,
    data
  });
}

// Error response
export function errorResponse(message: string, status: number = 400) {
  return NextResponse.json(
    {
      success: false,
      error: message
    },
    { status }
  );
}

// Not found response
export function notFoundResponse(message: string = 'Resource not found'): NextResponse<ApiResponse> {
  return errorResponse(message, 404);
}

// Unauthorized response
export function unauthorizedResponse(message: string = 'Unauthorized') {
  return errorResponse(message, 401);
}

// Forbidden response
export function forbiddenResponse(message: string = 'Forbidden access'): NextResponse<ApiResponse> {
  return errorResponse(message, 403);
}

// Server error response
export function serverErrorResponse(message: string = 'Internal server error'): NextResponse<ApiResponse> {
  return errorResponse(message, 500);
}

// Validation error response
export function validationErrorResponse(errors: any) {
  // Format the errors to be more user-friendly
  const formattedErrors = typeof errors === 'object' 
    ? errors 
    : { general: [String(errors)] };
  
  return NextResponse.json(
    {
      success: false,
      error: 'Validation error',
      errors: formattedErrors
    },
    { status: 422 }
  );
} 