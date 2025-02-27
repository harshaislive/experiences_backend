'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Registration, RegistrationsService } from '@/services/RegistrationsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/Button';
import { format } from 'date-fns';
import { ShareIcon, ArrowLeftIcon, ClipboardIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function RegistrationDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  
  const [registration, setRegistration] = useState<Registration | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [confirmationUrl, setConfirmationUrl] = useState('');
  
  useEffect(() => {
    const loadRegistration = async () => {
      try {
        setIsLoading(true);
        const data = await RegistrationsService.getRegistrationById(id);
        setRegistration(data);
        if (data) {
          setConfirmationUrl(RegistrationsService.getConfirmationPageUrl(data.id));
        }
      } catch (error) {
        console.error('Failed to load registration:', error);
        toast.error('Failed to load registration details');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadRegistration();
  }, [id]);
  
  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };
  
  const shareViaWhatsApp = () => {
    if (!registration) return;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(
      `Your booking for ${registration.experience?.title} is confirmed! View details here: ${confirmationUrl}`
    )}`;
    window.open(whatsappUrl, '_blank');
  };
  
  const shareViaEmail = () => {
    if (!registration) return;
    
    const emailSubject = `Your Booking Confirmation for ${registration.experience?.title}`;
    const emailBody = `Hello ${registration.user?.full_name},\n\nYour booking for ${registration.experience?.title} is confirmed!\n\nView your booking details here: ${confirmationUrl}\n\nThank you,\nBeforest Team`;
    const mailtoUrl = `mailto:${registration.user?.email}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(mailtoUrl, '_blank');
  };
  
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfbf7]">
        <LoadingSpinner size="lg" text="Loading registration details..." />
      </div>
    );
  }
  
  if (!registration) {
    return (
      <div className="min-h-screen p-8 bg-[#fdfbf7]">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-8">
            <button
              onClick={() => router.back()}
              className="mr-4 p-2 rounded-full hover:bg-gray-100"
            >
              <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
            </button>
            <h1 className="text-3xl font-bold text-[#342e29]">Registration Not Found</h1>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <p className="text-gray-600 mb-4">The registration you are looking for could not be found.</p>
            <Button onClick={() => router.push('/dashboard/registrations')}>
              Back to Registrations
            </Button>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen p-8 bg-[#fdfbf7]">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-8">
          <button
            onClick={() => router.back()}
            className="mr-4 p-2 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-3xl font-bold text-[#342e29]">Registration Details</h1>
        </div>
        
        {/* Confirmation URL and Sharing */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#342e29] mb-4">Confirmation Link</h2>
          <div className="flex items-center mb-4">
            <input
              type="text"
              readOnly
              value={confirmationUrl}
              className="flex-grow p-2 border rounded-l-md text-sm bg-gray-50"
            />
            <button
              onClick={() => copyToClipboard(confirmationUrl)}
              className="p-2 bg-indigo-600 text-white rounded-r-md hover:bg-indigo-700"
              title="Copy to clipboard"
            >
              <ClipboardIcon className="h-5 w-5" />
            </button>
          </div>
          
          <div className="flex space-x-3">
            <Button
              onClick={shareViaWhatsApp}
              variant="secondary"
              className="flex-1 flex items-center justify-center"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share via WhatsApp
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="secondary"
              className="flex-1 flex items-center justify-center"
            >
              <ShareIcon className="h-4 w-4 mr-2" />
              Share via Email
            </Button>
          </div>
        </div>
        
        {/* Experience Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#342e29] mb-4">Experience Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Title</p>
              <p className="text-lg text-[#342e29]">{registration.experience?.title}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Dates</p>
              <p className="text-lg text-[#342e29]">
                {registration.experience?.start_date && 
                 format(new Date(registration.experience.start_date), 'MMM d, yyyy')} - 
                {registration.experience?.end_date && 
                 format(new Date(registration.experience.end_date), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
        </div>
        
        {/* Customer Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#342e29] mb-4">Customer Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Name</p>
              <p className="text-lg text-[#342e29]">{registration.user?.full_name}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Email</p>
              <p className="text-lg text-[#342e29]">{registration.user?.email}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Phone</p>
              <p className="text-lg text-[#342e29]">{registration.user?.phone || 'Not provided'}</p>
            </div>
          </div>
        </div>
        
        {/* Booking Details */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#342e29] mb-4">Booking Details</h2>
          {registration.booking_details ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500">Participants</p>
                <p className="text-lg text-[#342e29]">{registration.booking_details.participants}</p>
              </div>
              {registration.booking_details.arrival_time && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Arrival Time</p>
                  <p className="text-lg text-[#342e29]">{registration.booking_details.arrival_time}</p>
                </div>
              )}
              {registration.booking_details.accommodation_preference && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Accommodation</p>
                  <p className="text-lg text-[#342e29]">{registration.booking_details.accommodation_preference}</p>
                </div>
              )}
              {registration.booking_details.dietary_restrictions && registration.booking_details.dietary_restrictions.length > 0 && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Dietary Restrictions</p>
                  <p className="text-lg text-[#342e29]">{registration.booking_details.dietary_restrictions.join(', ')}</p>
                </div>
              )}
              {registration.booking_details.special_requests && (
                <div className="col-span-2">
                  <p className="text-sm font-medium text-gray-500">Special Requests</p>
                  <p className="text-lg text-[#342e29]">{registration.booking_details.special_requests}</p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-gray-500">No detailed booking information available</p>
          )}
        </div>
        
        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#342e29] mb-4">Payment Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Amount</p>
              <p className="text-lg text-[#342e29]">₹{registration.total_amount}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Status</p>
              <p className={`text-lg font-medium
                ${registration.payment_status === 'completed' ? 'text-green-600' : 
                  registration.payment_status === 'pending' ? 'text-yellow-600' : 
                  'text-red-600'}`}>
                {registration.payment_status}
              </p>
            </div>
            {registration.transaction_id && (
              <div>
                <p className="text-sm font-medium text-gray-500">Transaction ID</p>
                <p className="text-lg text-[#342e29]">{registration.transaction_id}</p>
              </div>
            )}
            {registration.payment_date && (
              <div>
                <p className="text-sm font-medium text-gray-500">Payment Date</p>
                <p className="text-lg text-[#342e29]">
                  {format(new Date(registration.payment_date), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
            )}
          </div>
        </div>
        
        {/* Registration Metadata */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="text-xl font-semibold text-[#342e29] mb-4">Registration Metadata</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm font-medium text-gray-500">Registration ID</p>
              <p className="text-sm text-[#342e29] font-mono">{registration.id}</p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Created At</p>
              <p className="text-sm text-[#342e29]">
                {format(new Date(registration.created_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Last Updated</p>
              <p className="text-sm text-[#342e29]">
                {format(new Date(registration.updated_at), 'MMM d, yyyy h:mm a')}
              </p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-between">
          <Button
            onClick={() => router.push('/dashboard/registrations')}
            variant="secondary"
          >
            Back to Registrations
          </Button>
        </div>
      </div>
    </div>
  );
}
