'use client';

import { useState, useEffect } from 'react';
import { RegistrationsTable } from '@/components/dashboard/RegistrationsTable';
import { RegistrationsService } from '@/services/RegistrationsService';
import toast from 'react-hot-toast';

export default function RegistrationsPage() {
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    // Check database connection on page load
    const checkConnection = async () => {
      try {
        setIsChecking(true);
        console.log('Checking database connection...');
        // We'll use the getRegistrations method to check if we can connect to the database
        const data = await RegistrationsService.getRegistrations();
        // If we get here without an error, the connection is working
        setIsDbConnected(true);
        console.log('Database connection successful');
      } catch (error) {
        console.error('Database connection check failed:', error);
        setIsDbConnected(false);
        toast.error('Failed to connect to the database');
      } finally {
        setIsChecking(false);
      }
    };

    checkConnection();
  }, []);

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-[#342e29]">
            Registrations
          </h1>
          <p className="mt-4 text-lg text-[#51514d]">
            View and manage all experience registrations
          </p>
          
          {/* Database Connection Status */}
          {isChecking ? (
            <div className="mt-2 text-sm text-gray-500">
              Checking database connection...
            </div>
          ) : isDbConnected === false ? (
            <div className="mt-2 text-sm text-red-500">
              ⚠️ Database connection issue detected. Some features may not work properly.
            </div>
          ) : isDbConnected === true ? (
            <div className="mt-2 text-sm text-green-600">
              ✅ Database connected
            </div>
          ) : null}
        </div>

        {/* Search Bar */}
        <div className="mb-8">
          <div className="relative max-w-md mx-auto">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID..."
              className="w-full p-3 pl-10 pr-4 border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 hover:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <RegistrationsTable limit={50} initialSearchQuery={searchQuery} />
        </div>
      </div>
    </div>
  );
}