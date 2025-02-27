import { supabase } from '@/lib/supabaseClient';

export const runDiagnostics = async () => {
  const results: Record<string, any> = {};
  
  // Check environment variables
  results.environment = {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
    supabaseServiceKey: process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Missing',
  };
  
  // Test Supabase connection
  try {
    const { data, error } = await supabase.from('experiences').select('count').single();
    results.supabaseConnection = {
      success: !error,
      error: error ? error.message : null,
      data
    };
  } catch (err: any) {
    results.supabaseConnection = {
      success: false,
      error: err.message
    };
  }
  
  // Test authentication
  try {
    const { data, error } = await supabase.auth.getSession();
    results.authentication = {
      success: !error,
      hasSession: !!data.session,
      error: error ? error.message : null
    };
  } catch (err: any) {
    results.authentication = {
      success: false,
      error: err.message
    };
  }
  
  // Test tables access
  const tables = ['experiences', 'locations', 'registrations', 'experience_pricing', 'experience_items_to_bring'];
  results.tableAccess = {};
  
  for (const table of tables) {
    try {
      const { data, error } = await supabase.from(table).select('count').single();
      results.tableAccess[table] = {
        success: !error,
        error: error ? error.message : null,
        count: data?.count
      };
    } catch (err: any) {
      results.tableAccess[table] = {
        success: false,
        error: err.message
      };
    }
  }
  
  return results;
};
