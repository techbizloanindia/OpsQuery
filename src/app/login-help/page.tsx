'use client';

import React from 'react';
import Link from 'next/link';

export default function LoginHelpPage() {
  const testCredentials = [
    {
      role: 'Operations Team',
      employeeId: 'CONS0130',
      password: 'password123',
      description: 'Access to operations dashboard, query management'
    },
    {
      role: 'Sales Team',
      employeeId: 'BL000599',
      password: 'password123',
      description: 'Access to sales dashboard, sales queries'
    },
    {
      role: 'Credit Team',
      employeeId: 'bl000669',
      password: 'password123',
      description: 'Access to credit dashboard, credit queries'
    },
    {
      role: 'Administrator',
      employeeId: 'AashishSrivastava2025',
      password: 'Bizloan@2025',
      description: 'Full system access, admin dashboard'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Login Help & Test Credentials</h1>
          <p className="text-gray-600">Use these credentials to test the system</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {testCredentials.map((cred, index) => (
            <div key={index} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center mb-4">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <h3 className="text-lg font-semibold text-gray-900">{cred.role}</h3>
              </div>
              
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee ID:</label>
                  <code className="block bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                    {cred.employeeId}
                  </code>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password:</label>
                  <code className="block bg-gray-100 px-3 py-2 rounded text-sm font-mono">
                    {cred.password}
                  </code>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Access:</label>
                  <p className="text-sm text-gray-600">{cred.description}</p>
                </div>
                
                <Link 
                  href="/login"
                  className="inline-block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors mt-4"
                >
                  Go to Login
                </Link>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-3">Troubleshooting Tips:</h3>
          <ul className="space-y-2 text-yellow-700">
            <li>• Make sure the development server is running on http://localhost:3000</li>
            <li>• Check browser console for any JavaScript errors</li>
            <li>• Verify database connection is working</li>
            <li>• Clear browser cache and localStorage if needed</li>
            <li>• Ensure all environment variables are properly set</li>
          </ul>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-blue-600 hover:text-blue-800">
            ← Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
} 