'use client';

import { RegistrationsTable } from '@/components/dashboard/RegistrationsTable';

export default function RegistrationsPage() {
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
        </div>

        {/* Registrations Table */}
        <div className="bg-white rounded-2xl p-8 shadow-sm">
          <RegistrationsTable limit={50} />
        </div>
      </div>
    </div>
  );
} 