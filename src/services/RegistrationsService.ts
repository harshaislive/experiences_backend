import { supabase } from '@/lib/supabaseClient';

export interface Registration {
  id: string;
  user_id: string;
  experience_id: string;
  total_amount: number;
  payment_status: string;
  created_at: string;
  experience: {
    title: string;
  };
  user: {
    full_name: string;
    email: string;
  };
}

export class RegistrationsService {
  static async getRegistrations() {
    try {
      // First, let's just check if we can get any registrations
      const { data: basicData, error: basicError } = await supabase
        .from('registrations')
        .select('*')
        .limit(1);

      console.log('Basic query result:', { data: basicData, error: basicError });

      if (basicError) {
        console.error('Error with basic query:', basicError);
        return [];
      }

      // If basic query works, try with joins
      const { data, error } = await supabase
        .from('registrations')
        .select(`
          *,
          experiences (
            title
          ),
          users (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      console.log('Full query result:', { data, error });

      if (error) {
        console.error('Error with full query:', error);
        return [];
      }

      // Transform the data
      const transformedData = data?.map(item => ({
        ...item,
        experience: item.experiences,
        user: item.users
      }));

      return transformedData || [];
    } catch (err) {
      console.error('Unexpected error:', err);
      return [];
    }
  }
}