import { Registration, RegistrationsService, PaginatedResult } from '@/services/RegistrationsService';
import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { EyeIcon, ShareIcon, ClipboardIcon, ArrowPathIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { ExclamationCircleIcon, MagnifyingGlassIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
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
  const [searchType, setSearchType] = useState<'transaction' | 'user'>('transaction');
  const [isSearching, setIsSearching] = useState(false);
  const [isUpdatingPayment, setIsUpdatingPayment] = useState<string | null>(null);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRegistrations, setTotalRegistrations] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [pageSize, setPageSize] = useState(limit);

  useEffect(() => {
    loadRegistrations(initialSearchQuery);
  }, [currentPage, pageSize]); // Reload when page or page size changes

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
      
      const result = await RegistrationsService.getRegistrations(
        query, 
        currentPage, 
        pageSize,
        searchType
      );
      
      console.log(`Received ${result.data.length} registrations, total: ${result.total}`);
      
      // Update state with paginated data
      setRegistrations(result.data);
      setTotalRegistrations(result.total);
      setTotalPages(result.totalPages);
      
      if (result.data.length === 0 && query) {
        console.log('No registrations found for search query:', query);
        toast.info(`No registrations found matching "${query}"`);
      } else if (result.data.length === 0) {
        console.log('No registrations found or error occurred');
      }
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
    setCurrentPage(1); // Reset to first page when searching
    loadRegistrations(searchQuery);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setIsSearching(true);
    setCurrentPage(1); // Reset to first page when clearing search
    loadRegistrations();
  };

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > totalPages) return;
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSize = parseInt(e.target.value, 10);
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
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
          <p className="mt-2 text-lg font-semibold">Error Loading Data</p>
        </div>
        <p className="mb-6 text-[#51514d]">{error}</p>
        <Button onClick={() => loadRegistrations()}>Try Again</Button>
      </div>
    );
  }

  return (
    <div>
      {/* Search and Filter Section */}
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-4 mb-4">
          <div className="relative flex-grow">
            <input
              type="search"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-[#344736] focus:border-[#344736]"
              placeholder={searchType === 'transaction' ? "Search by transaction ID..." : "Search by name or email..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="flex gap-2">
            <select
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white focus:ring-[#344736] focus:border-[#344736]"
              value={searchType}
              onChange={(e) => setSearchType(e.target.value as 'transaction' | 'user')}
            >
              <option value="transaction">Transaction ID</option>
              <option value="user">User Name/Email</option>
            </select>
            
            <Button 
              type="submit" 
              className="bg-[#344736] text-white hover:bg-[#415c43]"
              disabled={isSearching}
            >
              Search
            </Button>
            
            {searchQuery && (
              <Button 
                type="button" 
                variant="secondary" 
                onClick={clearSearch}
                disabled={isSearching}
              >
                Clear
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* Download Button */}
      <div className="flex justify-between items-center mb-4">
        <div className="text-sm text-[#51514d]">
          {totalRegistrations === 0 ? (
            <span>No registrations found</span>
          ) : (
            <span>Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, totalRegistrations)} of {totalRegistrations} registrations</span>
          )}
        </div>
        
        <Button
          onClick={downloadRegistrationsCSV}
          variant="secondary"
          className="flex items-center gap-2"
        >
          <ArrowDownTrayIcon className="h-5 w-5" />
          Download CSV
        </Button>
      </div>

      {/* Registrations Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Registration</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
              <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {registrations.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                  {searchQuery ? 'No registrations found for your search.' : 'No registrations found.'}
                </td>
              </tr>
            ) : (
              registrations.map((registration) => (
                <tr 
                  key={registration.id} 
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => handleViewDetails(registration)}
                >
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[#344736]">
                    #{registration.id.substring(0, 8)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div className="font-medium">{registration.user?.full_name || 'Unknown'}</div>
                    <div className="text-xs text-gray-500">{registration.user?.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {registration.experience?.title || 'Unknown Experience'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium">₹{registration.total_amount.toLocaleString()}</div>
                    <div className="flex items-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        registration.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                        registration.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {registration.payment_status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {format(new Date(registration.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex space-x-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        className="text-[#344736] hover:text-[#415c43]"
                        title="View details"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetails(registration);
                        }}
                      >
                        <EyeIcon className="h-5 w-5" />
                      </button>

                      <button
                        className="text-blue-600 hover:text-blue-800"
                        title="Share confirmation"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(registration);
                        }}
                      >
                        <ShareIcon className="h-5 w-5" />
                      </button>

                      {registration.payment_status === 'pending' && (
                        <button
                          className="text-green-600 hover:text-green-800"
                          title="Mark as paid"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleMarkAsCompleted(registration.id);
                          }}
                          disabled={isUpdatingPayment === registration.id}
                        >
                          {isUpdatingPayment === registration.id ? (
                            <ArrowPathIcon className="h-5 w-5 animate-spin" />
                          ) : (
                            <CheckCircleIcon className="h-5 w-5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <div className="flex items-center">
          <span className="text-sm text-gray-700 mr-2">Show:</span>
          <select 
            className="border border-gray-300 rounded-md text-sm px-2 py-1"
            value={pageSize}
            onChange={handlePageSizeChange}
          >
            <option value="10">10</option>
            <option value="20">20</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
        </div>
        
        <div className="flex items-center justify-center space-x-2">
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => handlePageChange(currentPage - 1)}
            className="px-2 py-1"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </Button>
          
          <div className="text-sm text-gray-700">
            Page {currentPage} of {totalPages}
          </div>
          
          <Button
            variant="secondary"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
            className="px-2 py-1"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </Button>
        </div>
      </div>

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