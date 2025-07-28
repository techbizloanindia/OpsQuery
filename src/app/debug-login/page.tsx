'use client';

import React, { useState } from 'react';

export default function DebugLoginPage() {
  const [result, setResult] = useState<string>('');

  const testLogin = async (employeeId: string, password: string) => {
    try {
      console.log('Testing login with:', employeeId);
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ employeeId, password }),
      });

      const data = await response.json();
      
      setResult(`Response: ${JSON.stringify(data, null, 2)}\nStatus: ${response.status}`);
    } catch (error) {
      setResult(`Error: ${error}`);
    }
  };

  const testUsers = [
    { id: 'CONS0130', pass: 'password123', role: 'operations' },
    { id: 'BL000599', pass: 'password123', role: 'sales' },
    { id: 'bl000669', pass: 'password123', role: 'credit' },
    { id: 'AashishSrivastava2025', pass: 'Bizloan@2025', role: 'admin' }
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Login Test</h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {testUsers.map((user) => (
            <button
              key={user.id}
              onClick={() => testLogin(user.id, user.pass)}
              className="p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Test {user.role}: {user.id}
            </button>
          ))}
        </div>

        <div className="bg-white p-4 rounded-lg">
          <h2 className="text-xl font-bold mb-4">Result:</h2>
          <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-4 rounded">
            {result || 'Click a button to test login'}
          </pre>
        </div>
      </div>
    </div>
  );
} 