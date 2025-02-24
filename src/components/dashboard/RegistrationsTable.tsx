import { useEffect, useState } from 'react';
import { RegistrationsService, Registration } from '@/services/RegistrationsService';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { format } from 'date-fns';

export function RegistrationsTable() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadRegistrations();
  }, []);

  const loadRegistrations = async () => {
    try {
      setIsLoading(true);
      const data = await RegistrationsService.getRegistrations();
      setRegistrations(data);
    } catch (err) {
      console.error('Error loading registrations:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!registrations.length) {
    return (
      <div className="text-center py-4">
        <p>No registrations found</p>
        <button 
          onClick={loadRegistrations}
          className="mt-4 px-4 py-2 text-sm bg-gray-100 rounded hover:bg-gray-200"
        >
          Refresh
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <table className="min-w-full">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Experience</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {registrations.map((reg) => (
            <tr key={reg.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 text-sm text-gray-900">{reg.experience?.title}</td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900">{reg.user?.full_name}</div>
                <div className="text-sm text-gray-500">{reg.user?.email}</div>
              </td>
              <td className="px-6 py-4 text-sm text-gray-900">₹{reg.total_amount}</td>
              <td className="px-6 py-4">
                <span className={`inline-flex px-2 py-1 text-xs rounded-full font-medium
                  ${reg.payment_status === 'completed' ? 'bg-green-100 text-green-800' : 
                    reg.payment_status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                    'bg-red-100 text-red-800'}`}>
                  {reg.payment_status}
                </span>
              </td>
              <td className="px-6 py-4 text-sm text-gray-500">
                {format(new Date(reg.created_at), 'MMM d, yyyy')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 