'use client';

import { useEffect, useState } from 'react';
import { MapPinIcon, CalendarIcon, UserGroupIcon, CurrencyDollarIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { ExperiencesService } from '@/services/experiences';
import { LocationsService } from '@/services/locations';
import { RegistrationsService, Registration } from '@/services/RegistrationsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Experience } from '@/types';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState({
    totalLocations: 0,
    totalExperiences: 0,
    capacityUtilization: 0,
    totalRevenue: 0,
    pendingRegistrations: 0,
    completedRegistrations: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if device is mobile
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const [locations, experiences, registrationsResult] = await Promise.all([
          LocationsService.getAll(),
          ExperiencesService.getAll(),
          RegistrationsService.getRegistrations(undefined, 1, 100), // Get the first 100 registrations for dashboard stats
        ]);

        // Extract registrations from the paginated result
        const registrations = registrationsResult.data || [];

        // Calculate metrics
        const totalLocations = locations?.length || 0;
        const totalExperiences = experiences?.length || 0;
        
        // Calculate capacity utilization
        let totalCapacity = 0;
        let totalParticipants = 0;
        experiences?.forEach((exp: Experience) => {
          totalCapacity += exp.total_capacity;
          totalParticipants += exp.current_participants;
        });
        const capacityUtilization = totalCapacity > 0 
          ? Math.round((totalParticipants / totalCapacity) * 100) 
          : 0;

        // Calculate registration metrics
        const completedRegistrations = registrations.filter((reg: Registration) => reg.payment_status === 'completed').length;
        const pendingRegistrations = registrations.filter((reg: Registration) => reg.payment_status === 'pending').length;
        const totalRevenue = registrations
          .filter((reg: Registration) => reg.payment_status === 'completed')
          .reduce((sum: number, reg: Registration) => sum + Number(reg.total_amount), 0);

        setMetrics({
          totalLocations,
          totalExperiences,
          capacityUtilization,
          totalRevenue,
          pendingRegistrations,
          completedRegistrations,
        });
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#fdfbf7] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      {/* Mobile Warning Banner */}
      {isMobile && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 sticky top-0 z-50">
          <div className="flex items-start">
            <ExclamationTriangleIcon className="h-6 w-6 text-amber-500 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-amber-800">Desktop Recommended</h3>
              <div className="mt-1 text-sm text-amber-700">
                <p>For the best experience, please access the dashboard from a desktop device.</p>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Welcome Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-[#342e29]">
            Welcome to Your Dashboard
          </h1>
          <p className="mt-4 text-lg text-[#51514d]">
            Here&apos;s an overview of your business performance
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Total Revenue */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#f5efe6] rounded-xl">
                <CurrencyDollarIcon className="h-6 w-6 text-[#342e29]" />
              </div>
              <h3 className="text-lg font-medium text-[#342e29]">Total Revenue</h3>
            </div>
            <p className="text-3xl font-semibold text-[#342e29]">₹{metrics.totalRevenue.toLocaleString()}</p>
          </div>

          {/* Completed Registrations */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#f5efe6] rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-[#342e29]" />
              </div>
              <h3 className="text-lg font-medium text-[#342e29]">Completed Registrations</h3>
            </div>
            <p className="text-3xl font-semibold text-[#342e29]">{metrics.completedRegistrations}</p>
          </div>

          {/* Pending Registrations */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#f5efe6] rounded-xl">
                <ClockIcon className="h-6 w-6 text-[#342e29]" />
              </div>
              <h3 className="text-lg font-medium text-[#342e29]">Pending Registrations</h3>
            </div>
            <p className="text-3xl font-semibold text-[#342e29]">{metrics.pendingRegistrations}</p>
          </div>

          {/* Total Locations */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#f5efe6] rounded-xl">
                <MapPinIcon className="h-6 w-6 text-[#342e29]" />
              </div>
              <h3 className="text-lg font-medium text-[#342e29]">Total Locations</h3>
            </div>
            <p className="text-3xl font-semibold text-[#342e29]">{metrics.totalLocations}</p>
          </div>

          {/* Total Experiences */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#f5efe6] rounded-xl">
                <CalendarIcon className="h-6 w-6 text-[#342e29]" />
              </div>
              <h3 className="text-lg font-medium text-[#342e29]">Total Experiences</h3>
            </div>
            <p className="text-3xl font-semibold text-[#342e29]">{metrics.totalExperiences}</p>
          </div>

          {/* Capacity Utilization */}
          <div className="bg-white rounded-2xl p-8 shadow-sm">
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-[#f5efe6] rounded-xl">
                <UserGroupIcon className="h-6 w-6 text-[#342e29]" />
              </div>
              <h3 className="text-lg font-medium text-[#342e29]">Capacity Utilization</h3>
            </div>
            <p className="text-3xl font-semibold text-[#342e29]">{metrics.capacityUtilization}%</p>
          </div>
        </div>
      </div>
    </div>
  );
}
