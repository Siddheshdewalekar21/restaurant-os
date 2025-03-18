'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string>('');
  const [errorDescription, setErrorDescription] = useState<string>('');

  useEffect(() => {
    const errorParam = searchParams?.get('error');
    
    if (errorParam) {
      switch (errorParam) {
        case 'CredentialsSignin':
          setError('Invalid credentials');
          setErrorDescription('The email or password you entered is incorrect. Please try again.');
          break;
        case 'AccessDenied':
          setError('Access denied');
          setErrorDescription('You do not have permission to access this resource.');
          break;
        case 'SessionRequired':
          setError('Session expired');
          setErrorDescription('Your session has expired. Please sign in again.');
          break;
        case 'OAuthSignin':
        case 'OAuthCallback':
        case 'OAuthCreateAccount':
          setError('Authentication error');
          setErrorDescription('There was a problem with the authentication service. Please try again.');
          break;
        default:
          setError('Authentication error');
          setErrorDescription('An unexpected error occurred during authentication. Please try again.');
      }
    } else {
      setError('Authentication error');
      setErrorDescription('An unknown error occurred. Please try signing in again.');
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white shadow-xl rounded-lg overflow-hidden">
        <div className="bg-red-600 h-2"></div>
        <div className="p-8">
          <div className="flex items-center justify-center mb-6">
            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">{error}</h1>
          <p className="text-gray-600 text-center mb-8">{errorDescription}</p>
          
          <div className="space-y-4">
            <button
              onClick={() => router.push('/auth/signin')}
              className="w-full bg-indigo-600 py-3 rounded-md text-white font-medium hover:bg-indigo-700 transition duration-200 flex items-center justify-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
              </svg>
              Return to Sign In
            </button>
            
            <div className="text-center">
              <Link 
                href="/"
                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
              >
                Go to Home Page
              </Link>
            </div>
          </div>
        </div>
        
        <div className="px-8 py-4 bg-gray-50 border-t">
          <div className="text-sm text-gray-500 text-center">
            <p>Need help? Contact <a href="mailto:support@restaurantos.com" className="text-indigo-600 hover:underline">support@restaurantos.com</a></p>
          </div>
        </div>
      </div>
    </div>
  );
} 