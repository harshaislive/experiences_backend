'use client';

import { useState, useEffect } from 'react';
import { RegistrationsTable } from '@/components/dashboard/RegistrationsTable';
import { RegistrationsService } from '@/services/RegistrationsService';
import toast from 'react-hot-toast';

export default function RegistrationsPage() {
  const [isDbConnected, setIsDbConnected] = useState<boolean | null>(null);
  const [isChecking, setIsChecking] = useState(true);

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
        <div className="text-center mb-10">
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

        {/* Registrations Section */}
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <RegistrationsTable limit={20} />
        </div>
      </div>
    </div>
  );
}