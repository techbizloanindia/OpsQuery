'use client';

import React from 'react';

interface LoadingStateProps {
  message?: string;
}

export default function LoadingState({ message = 'Loading...' }: LoadingStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="animate-pulse flex space-x-4">
        <div className="rounded-full bg-cyan-200 h-12 w-12 flex items-center justify-center">
          <svg className="animate-spin h-6 w-6 text-cyan-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
        <div className="flex-1 space-y-4 py-1">
          <div className="h-4 bg-cyan-200 rounded w-3/4"></div>
          <div className="space-y-2">
            <div className="h-4 bg-cyan-200 rounded"></div>
            <div className="h-4 bg-cyan-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm text-gray-500">{message}</p>
    </div>
  );
} 