import { Registration, RegistrationsService } from '@/services/RegistrationsService';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EyeIcon, ShareIcon, ClipboardIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface RegistrationsTableProps {
  limit?: number;
  initialSearchQuery?: string;
}

export function RegistrationsTable({ 
  limit = 10,
  initialSearchQuery = ''
}: RegistrationsTableProps) {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRegistration, setSelectedRegistration] = useState<Registration | null>(null);
  const [detailsModalOpen, setDetailsModalOpen] = useState(false);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [confirmationUrl, setConfirmationUrl] = useState('');
  const [searchQuery, setSearchQuery] = useState(initialSearchQuery);
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<string | null>(null);

  useEffect(() => {
    loadRegistrations(initialSearchQuery);
  }, []);

  useEffect(() => {
    if (initialSearchQuery !== searchQuery) {
      setSearchQuery(initialSearchQuery);
      loadRegistrations(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  const loadRegistrations = async (query?: string) => {
    try {
      setIsLoading(true);
      setError(null);
      console.log('Fetching registrations...');
      const data = await RegistrationsService.getRegistrations(query);
      console.log(`Received ${data.length} registrations`);
      
      if (data.length === 0 && query) {
        console.log('No registrations found for search query:', query);
        toast.info(`No registrations found matching "${query}"`);
      } else if (data.length === 0) {
        console.log('No registrations found or error occurred');
      }
      
      setRegistrations(data.slice(0, limit));
    } catch (err) {
      console.error('Error loading registrations:', err);
      setError('Failed to load registrations. Please try again.');
      toast.error('Failed to load registrations');
      
      // Clear search if it caused an error
      if (query) {
        toast.error('Search failed. Please try a different search term.');
      }
    } finally {
      setIsLoading(false);
      setIsSearching(false);
    }
  };

  const handleViewDetails = async (registration: Registration) => {
    try {
      // If we already have complete details, use them
      if (registration.booking_details) {
        setSelectedRegistration(registration);
        setDetailsModalOpen(true);
        return;
      }
      
      // Otherwise fetch full details
      const fullDetails = await RegistrationsService.getRegistrationById(registration.id);
      if (fullDetails) {
        setSelectedRegistration(fullDetails);
        setDetailsModalOpen(true);
      } else {
        toast.error('Could not load registration details');
      }
    } catch (error) {
      console.error('Error loading registration details:', error);
      toast.error('Failed to load registration details');
    }
  };

  const handleShare = (registration: Registration) => {
    setSelectedRegistration(registration);
    const url = RegistrationsService.getConfirmationPageUrl(registration.id);
    setConfirmationUrl(url);
    setShareModalOpen(true);
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success('Copied to clipboard!');
    } catch (err) {
      console.error('Failed to copy:', err);
      toast.error('Failed to copy to clipboard');
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    loadRegistrations(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(true);
    loadRegistrations();
  };

  const downloadRegistrationsCSV = () => {
    try {
      // Define the CSV headers
      const headers = [
        'Registration ID',
        'Experience',
        'User Name',
        'Email',
        'Phone',
        'Total Amount',
        'Transaction ID',
        'Payment Status',
        'Payment Date',
        'Registration Date',
        'Participants',
        'Arrival Time',
        'Accommodation Preference',
        'Dietary Restrictions',
        'Special Requests'
      ];

      // Map registrations to CSV rows
      const csvRows = registrations.map(reg => {
        // Format the dietary restrictions
        const dietaryRestrictions = reg.booking_details?.dietary_restrictions
          ? Array.isArray(reg.booking_details.dietary_restrictions)
            ? reg.booking_details.dietary_restrictions.join(', ')
            : reg.booking_details.dietary_restrictions
          : '';

        // Create a row with all data
        return [
          reg.id,
          reg.experience?.title || '',
          reg.user?.full_name || '',
          reg.user?.email || '',
          reg.user?.phone || '',
          reg.total_amount,
          reg.transaction_id || '',
          reg.payment_status,
          reg.payment_date ? format(new Date(reg.payment_date), 'yyyy-MM-dd') : '',
          format(new Date(reg.created_at), 'yyyy-MM-dd'),
          reg.booking_details?.participants || '',
          reg.booking_details?.arrival_time || '',
          reg.booking_details?.accommodation_preference || '',
          dietaryRestrictions,
          reg.booking_details?.special_requests || ''
        ];
      });

      // Combine headers and rows
      const csvContent = [
        headers.join(','),
        ...csvRows.map(row => 
          row.map(cell => 
            // Handle commas and quotes in cell values
            typeof cell === 'string' && (cell.includes(',') || cell.includes('"')) 
              ? `"${cell.replace(/"/g, '""')}"` 
              : cell
          ).join(',')
        )
      ].join('\n');

      // Create a Blob with the CSV content
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      
      // Create a download link
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.setAttribute('href', url);
      link.setAttribute('download', `registrations-${format(new Date(), 'yyyy-MM-dd')}.csv`);
      link.style.visibility = 'hidden';
      
      // Add to document, click to download, and remove
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success('Registrations downloaded successfully');
    } catch (err) {
      console.error('Error downloading registrations:', err);
      toast.error('Failed to download registrations');
    }
  };

  const handleMarkAsCompleted = async (registrationId: string) => {
    try {
      setIsUpdatingPayment(registrationId);
      await RegistrationsService.updateRegistration(registrationId, {
        payment_status: 'completed',
        payment_date: new Date().toISOString()
      });
      
      // Update the local state to reflect the change
      setRegistrations(registrations.map(reg => 
        reg.id === registrationId 
          ? { 
              ...reg, 
              payment_status: 'completed', 
              payment_date: new Date().toISOString() 
            } 
          : reg
      ));
      
      toast.success('Payment status updated to completed');
    } catch (error) {
      console.error('Error updating payment status:', error);
      toast.error('Failed to update payment status');
    } finally {
      setIsUpdatingPayment(null);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#344736] mx-auto"></div>
        <p className="mt-4 text-[#51514d]">Loading registrations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <div className="text-red-500 mb-4">
          <ExclamationCircleIcon className="h-12 w-12 mx-auto" />
        </div>
        <p className="text-lg font-medium text-[#342e29]">Error Loading Registrations</p>
        <p className="text-[#51514d] mt-1">{error}</p>
        <button
          onClick={() => loadRegistrations()}
          className="mt-4 px-4 py-2 bg-[#344736] text-white rounded-md hover:bg-[#415c43]"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (registrations.length === 0) {
    return (
      <div className="bg-[#fdfbf7] shadow rounded-lg overflow-hidden border border-[#e7e4df]">
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-medium">
            Registrations (0)
            {searchQuery && <span className="ml-2 text-sm text-gray-500">Search results for: "{searchQuery}"</span>}
          </h2>
          <div className="flex space-x-2">
            <button 
              onClick={() => loadRegistrations(searchQuery)}
              className="px-3 py-1 bg-[#e7e4df] rounded hover:bg-[#d1cec9] flex items-center text-[#342e29]"
              disabled={isLoading || isSearching}
            >
              <ArrowPathIcon className={`h-4 w-4 mr-1 ${(isLoading || isSearching) ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
        
        {/* Search Bar */}
        <div className="p-4 border-b">
          <form onSubmit={handleSearch} className="flex items-center">
            <div className="relative flex-grow">
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by Transaction ID or Registration ID..."
                className="w-full p-2 pl-10 border border-r-0 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#344736] focus:border-[#344736]"
              />
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <button
              type="submit"
              className="p-2 bg-[#344736] text-white rounded-r-md hover:bg-[#415c43] flex items-center"
              disabled={isSearching}
            >
              {isSearching ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Searching...
                </>
              ) : (
                'Search'
              )}
            </button>
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="mt-4 px-4 py-2 bg-[#344736] text-white rounded-md hover:bg-[#415c43]"
              >
                Clear Search
              </button>
            )}
          </form>
        </div>
        
        <div className="py-12 text-center">
          <div className="text-[#51514d] mb-4">
            <MagnifyingGlassIcon className="h-12 w-12 mx-auto" />
          </div>
          {searchQuery ? (
            <>
              <p className="text-lg font-medium text-[#342e29]">No registrations found</p>
              <p className="text-[#51514d] mt-1">No registrations match your search criteria</p>
              <button
                onClick={clearSearch}
                className="mt-4 px-4 py-2 bg-[#344736] text-white rounded-md hover:bg-[#415c43]"
              >
                Clear Search
              </button>
            </>
          ) : (
            <>
              <p className="text-lg font-medium text-[#342e29]">No registrations yet</p>
              <p className="text-[#51514d] mt-1">When users register for experiences, they'll appear here</p>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fdfbf7] shadow rounded-lg overflow-hidden border border-[#e7e4df]">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-medium">
          Registrations ({registrations.length})
          {searchQuery && <span className="ml-2 text-sm text-gray-500">Search results for: "{searchQuery}"</span>}
        </h2>
        <div className="flex space-x-2">
          <button 
            onClick={() => loadRegistrations(searchQuery)}
            className="px-3 py-1 bg-[#e7e4df] rounded hover:bg-[#d1cec9] flex items-center text-[#342e29]"
            disabled={isLoading || isSearching}
          >
            <ArrowPathIcon className={`h-4 w-4 mr-1 ${(isLoading || isSearching) ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button 
            onClick={downloadRegistrationsCSV}
            className="px-3 py-1 bg-[#344736] text-white rounded hover:bg-[#415c43] flex items-center"
          >
            <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
            Download CSV
          </button>
        </div>
      </div>
      <div className="p-4 border-b">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="relative flex-grow">
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Transaction ID or Registration ID..."
              className="w-full p-2 pl-10 border border-r-0 rounded-l-md focus:outline-none focus:ring-2 focus:ring-[#344736] focus:border-[#344736]"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 absolute left-2 top-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            type="submit"
            className="p-2 bg-[#344736] text-white rounded-r-md hover:bg-[#415c43] flex items-center"
            disabled={isSearching}
          >
            {isSearching ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Searching...
              </>
            ) : (
              'Search'
            )}
          </button>
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="p-2 bg-[#344736] text-white rounded hover:bg-[#415c43] ml-2"
              type="button"
            >
              Clear
            </button>
          )}
        </form>
      </div>
      <table className="min-w-full divide-y divide-[#e7e4df]">
        <thead className="bg-[#f5efe6]">
          <tr>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#342e29] uppercase tracking-wider">
              Registration
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#342e29] uppercase tracking-wider">
              User
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#342e29] uppercase tracking-wider">
              Experience
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#342e29] uppercase tracking-wider">
              Payment
            </th>
            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-[#342e29] uppercase tracking-wider">
              Date
            </th>
            <th scope="col" className="relative px-6 py-3">
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody className="bg-[#fdfbf7] divide-y divide-[#e7e4df]">
          {registrations.map((reg) => (
            <tr key={reg.id} className="hover:bg-[#f5efe6]">
              <td className="px-6 py-4 text-sm text-[#342e29]">{reg.id}</td>
              <td className="px-6 py-4">
                <div className="text-sm text-[#342e29]">{reg.user?.full_name}</div>
                <div className="text-sm text-[#51514d]">{reg.user?.email}</div>
                <div className="text-sm text-[#51514d]">{reg.user?.phone}</div>
              </td>
              <td className="px-6 py-4 text-sm text-[#342e29]">{reg.experience?.title}</td>
              <td className="px-6 py-4 text-sm text-[#342e29]">
                {reg.transaction_id ? (
                  <div className="flex items-center">
                    <span className="mr-1">₹{reg.total_amount}</span>
                    <button 
                      onClick={() => copyToClipboard(reg.transaction_id || '')}
                      className="text-[#344736] hover:text-[#415c43] ml-1"
                      title="Copy Transaction ID"
                    >
                      <ClipboardIcon className="h-4 w-4" />
                    </button>
                  </div>
                ) : (
                  <span>₹{reg.total_amount}</span>
                )}
                <div className="text-sm text-[#51514d]">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    reg.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                    reg.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'
                  }`}>
                    {reg.payment_status}
                  </span>
                  {reg.payment_status === 'pending' && (
                    <button
                      onClick={() => handleMarkAsCompleted(reg.id)}
                      disabled={isUpdatingPayment === reg.id}
                      className="ml-2 text-[#344736] hover:text-[#415c43] inline-flex items-center"
                      title="Mark as Completed"
                    >
                      {isUpdatingPayment === reg.id ? (
                        <div className="animate-spin h-4 w-4 border-t-2 border-b-2 border-[#344736] rounded-full"></div>
                      ) : (
                        <CheckCircleIcon className="h-4 w-4" />
                      )}
                    </button>
                  )}
                </div>
              </td>
              <td className="px-6 py-4 text-sm text-[#51514d]">
                {format(new Date(reg.created_at), 'MMM d, yyyy')}
              </td>
              <td className="px-6 py-4 text-right text-sm font-medium">
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleViewDetails(reg)}
                    className="text-[#344736] hover:text-[#415c43] p-1"
                    title="View Details"
                  >
                    <EyeIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleShare(reg)}
                    className="text-[#344736] hover:text-[#415c43] p-1 ml-2"
                    title="Share Confirmation"
                  >
                    <ShareIcon className="h-5 w-5" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Registration Details Modal */}
      <Modal
        isOpen={detailsModalOpen}
        onClose={() => setDetailsModalOpen(false)}
        title="Registration Details"
        maxWidth="2xl"
      >
        {selectedRegistration && (
          <div className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-[#f5efe6] p-4 rounded-lg">
                <h3 className="text-lg font-medium text-[#342e29] mb-3">Experience Information</h3>
                <p className="text-[#51514d]"><span className="font-medium">Title:</span> {selectedRegistration.experience?.title}</p>
                <p className="text-[#51514d]"><span className="font-medium">Location:</span> {selectedRegistration.experience?.location?.name}</p>
                <p className="text-[#51514d]"><span className="font-medium">Date:</span> {selectedRegistration.experience?.start_date && format(new Date(selectedRegistration.experience.start_date), 'MMMM d, yyyy')}</p>
              </div>
              
              <div className="bg-[#f5efe6] p-4 rounded-lg">
                <h3 className="text-lg font-medium text-[#342e29] mb-3">User Information</h3>
                <p className="text-[#51514d]"><span className="font-medium">Name:</span> {selectedRegistration.user?.full_name}</p>
                <p className="text-[#51514d]"><span className="font-medium">Email:</span> {selectedRegistration.user?.email}</p>
                <p className="text-[#51514d]"><span className="font-medium">Phone:</span> {selectedRegistration.user?.phone || 'Not provided'}</p>
              </div>
              
              <div className="bg-[#f5efe6] p-4 rounded-lg">
                <h3 className="text-lg font-medium text-[#342e29] mb-3">Payment Information</h3>
                <p className="text-[#51514d]"><span className="font-medium">Amount:</span> ₹{selectedRegistration.total_amount}</p>
                <p className="text-[#51514d]"><span className="font-medium">Transaction ID:</span> {selectedRegistration.transaction_id || 'Not available'}</p>
                <p className="text-[#51514d]"><span className="font-medium">Status:</span> {selectedRegistration.payment_status}</p>
                {selectedRegistration.payment_date && (
                  <p className="text-[#51514d]"><span className="font-medium">Payment Date:</span> {format(new Date(selectedRegistration.payment_date), 'MMMM d, yyyy')}</p>
                )}
              </div>
              
              <div className="bg-[#f5efe6] p-4 rounded-lg">
                <h3 className="text-lg font-medium text-[#342e29] mb-3">Booking Details</h3>
                <p className="text-[#51514d]"><span className="font-medium">Participants:</span> {selectedRegistration.booking_details?.participants || 'Not specified'}</p>
                {selectedRegistration.booking_details?.arrival_time && (
                  <p className="text-[#51514d]"><span className="font-medium">Arrival Time:</span> {selectedRegistration.booking_details.arrival_time}</p>
                )}
                {selectedRegistration.booking_details?.accommodation_preference && (
                  <p className="text-[#51514d]"><span className="font-medium">Accommodation:</span> {selectedRegistration.booking_details.accommodation_preference}</p>
                )}
                {selectedRegistration.booking_details?.dietary_restrictions && (
                  <p className="text-[#51514d]">
                    <span className="font-medium">Dietary Restrictions:</span>{' '}
                    {Array.isArray(selectedRegistration.booking_details.dietary_restrictions)
                      ? selectedRegistration.booking_details.dietary_restrictions.join(', ')
                      : selectedRegistration.booking_details.dietary_restrictions}
                  </p>
                )}
                {selectedRegistration.booking_details?.special_requests && (
                  <p className="text-[#51514d]"><span className="font-medium">Special Requests:</span> {selectedRegistration.booking_details.special_requests}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setDetailsModalOpen(false)}
                variant="secondary"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Share Modal */}
      <Modal
        isOpen={shareModalOpen}
        onClose={() => setShareModalOpen(false)}
        title="Share Confirmation"
        maxWidth="lg"
      >
        <div className="mt-4">
          <p className="text-[#51514d] mb-4">
            Share this link with the user to view their registration confirmation:
          </p>
          <div className="flex mb-6">
            <input
              type="text"
              value={confirmationUrl}
              readOnly
              className="w-full p-2 border border-r-0 rounded-l-md bg-[#f5efe6] text-[#342e29] focus:outline-none focus:ring-2 focus:ring-[#344736] focus:border-[#344736]"
            />
            <button
              onClick={() => copyToClipboard(confirmationUrl)}
              className="p-2 bg-[#344736] text-white rounded-r-md hover:bg-[#415c43]"
            >
              <ClipboardIcon className="h-5 w-5" />
            </button>
          </div>
          <div className="flex justify-end">
            <Button 
              onClick={() => setShareModalOpen(false)}
              variant="secondary"
            >
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}