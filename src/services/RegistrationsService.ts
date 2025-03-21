import { supabase } from '@/lib/supabaseClient';
import { handleSupabaseError } from '@/lib/supabase';

export interface Registration {
  id: string;
  user_id: string;
  experience_id: string;
  total_amount: number;
  transaction_id: string | null;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_date: string | null;
  booking_details: BookingDetails | null;
  created_at: string;
  updated_at: string;
  experience?: {
    id?: string;
    title?: string;
    start_date?: string;
    end_date?: string;
    slug?: string;
  };
  user?: {
    full_name?: string;
    email?: string;
    phone?: string;
  };
}

export interface BookingDetails {
  participants: number;
  special_requests?: string;
  arrival_time?: string;
  dietary_restrictions?: string[] | string;
  accommodation_preference?: string;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class RegistrationsService {
  static async getRegistrations(
    searchQuery?: string,
    page: number = 1,
    pageSize: number = 10,
    searchType: 'transaction' | 'user' = 'transaction'
  ): Promise<PaginatedResult<Registration>> {
    console.log('Starting to fetch registrations via API...');
    try {
      // Build the URL with all query parameters
      const params = new URLSearchParams();
      if (searchQuery) {
        params.append('search', searchQuery);
        params.append('searchType', searchType);
      }
      params.append('page', page.toString());
      params.append('pageSize', pageSize.toString());
      
      const url = `/api/registrations?${params.toString()}`;
      console.log(`Fetching registrations from: ${url}`);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('API error response:', errorData);
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched registrations via API: ${data?.data?.length || 0} items, total: ${data?.total || 0}`);
      
      return {
        data: data.data || [],
        total: data.total || 0,
        page: data.page || page,
        pageSize: data.pageSize || pageSize,
        totalPages: data.totalPages || 1
      };
    } catch (err) {
      console.error('Unexpected error in getRegistrations:', err);
      // Return empty result on error
      return {
        data: [],
        total: 0,
        page: page,
        pageSize: pageSize,
        totalPages: 1
      };
    }
  }

  static async getRegistrationById(id: string) {
    try {
      console.log(`Fetching registration with ID: ${id} via API`);
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API error response for ID ${id}:`, errorData);
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log(`Successfully fetched registration with ID ${id} via API`);
      return data || null;
    } catch (err) {
      console.error('Unexpected error getting registration by ID:', err);
      return null;
    }
  }

  static async updateRegistration(id: string, updates: Partial<Registration>) {
    try {
      console.log(`Updating registration with ID: ${id} via API`);
      
      // Remove nested objects that shouldn't be sent to the database
      const { experience, user, ...registrationData } = updates;
      
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API error response for ID ${id}:`, errorData);
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      const data = await response.json();
      console.log(`Successfully updated registration with ID ${id} via API`);
      return data || null;
    } catch (err) {
      console.error('Unexpected error updating registration:', err);
      throw err;
    }
  }

  static async deleteRegistration(id: string) {
    try {
      console.log(`Deleting registration with ID: ${id} via API`);
      const response = await fetch(`/api/registrations/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error(`API error response for ID ${id}:`, errorData);
        throw new Error(`API error: ${errorData.error || response.statusText}`);
      }

      console.log(`Successfully deleted registration with ID ${id} via API`);
      return true;
    } catch (err) {
      console.error('Unexpected error deleting registration:', err);
      throw err;
    }
  }

  static getConfirmationPageUrl(registrationId: string) {
    return `https://experiences.beforest.co/payment/status/${registrationId}`;
  }
}