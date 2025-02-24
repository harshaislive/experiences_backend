'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import Image from 'next/image';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: process.env.NEXT_PUBLIC_ADMIN_EMAIL || '',
    password: process.env.NEXT_PUBLIC_ADMIN_PASSWORD || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await login(formData.email, formData.password);
      if (error) throw error;
      
      toast.success('Logged in successfully');
      router.push('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to login. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="/logo.png"
              alt="Beforest Logo"
              width={120}
              height={120}
              className="w-auto h-auto"
            />
          </div>
          <h2 className="text-3xl font-semibold text-[#342e29] mb-2">
            Sign in to your account
          </h2>
          <p className="text-[#51514d]">
            Welcome to Beforest Admin
          </p>
        </div>

        <form className="mt-12 space-y-8" onSubmit={handleSubmit}>
          <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(52,46,41,0.04)] p-8 border border-[#e7e4df] space-y-6">
            <Input
              label="Email Address"
              type="email"
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              required
              placeholder="Enter your email"
              className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
            />

            <Input
              label="Password"
              type="password"
              value={formData.password}
              onChange={(e) =>
                setFormData({ ...formData, password: e.target.value })
              }
              required
              placeholder="Enter your password"
              className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
            />

            <Button
              type="submit"
              isLoading={isLoading}
              className="w-full bg-[#344736] hover:bg-[#415c43] text-white px-8 py-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md"
            >
              {isLoading ? <LoadingSpinner size="sm" text="" /> : 'Sign in'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
