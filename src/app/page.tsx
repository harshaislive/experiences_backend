'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    } else if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center">
          {isLoading ? (
            <LoadingSpinner size="lg" />
          ) : (
            <div className="text-center animate-fade-in">
              <h1 className="text-4xl font-bold text-gray-900 sm:text-6xl">
                Wilderness Wellness Admin
              </h1>
              <p className="mt-4 text-xl text-gray-500">
                Experience management platform for our wilderness wellness programs.
              </p>
              <div className="relative mt-8">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-gray-500">
                    Redirecting you...
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Footer */}
      <footer className="absolute bottom-0 w-full py-6">
        <div className="text-center text-gray-500 text-sm">
          © {new Date().getFullYear()} Wilderness Wellness. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
