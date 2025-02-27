import { supabase } from './supabaseClient';

export interface DiagnosticResult {
  success: boolean;
  message: string;
  details?: any;
}

/**
 * Checks if the Supabase client is properly initialized
 */
export async function checkSupabaseConnection(): Promise<DiagnosticResult> {
  try {
    if (!supabase) {
      return {
        success: false,
        message: 'Supabase client is not initialized'
      };
    }

    // Check if we can connect to Supabase by making a simple query
    const { data, error } = await supabase.from('registrations').select('id').limit(1);

    if (error) {
      return {
        success: false,
        message: 'Failed to connect to Supabase',
        details: {
          error: error.message,
          code: error.code,
          hint: error.hint || 'Check your environment variables (NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY)'
        }
      };
    }

    return {
      success: true,
      message: 'Successfully connected to Supabase',
      details: {
        dataReceived: !!data,
        count: data?.length || 0
      }
    };
  } catch (err: any) {
    return {
      success: false,
      message: 'Unexpected error when checking Supabase connection',
      details: {
        error: err.message || String(err)
      }
    };
  }
}

/**
 * Checks if the necessary environment variables are set
 */
export function checkEnvironmentVariables(): DiagnosticResult {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!supabaseKey) missingVars.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  
  if (missingVars.length > 0) {
    return {
      success: false,
      message: 'Missing required environment variables',
      details: {
        missingVariables: missingVars,
        hint: 'Create a .env.local file with these variables or set them in your environment'
      }
    };
  }
  
  return {
    success: true,
    message: 'All required environment variables are set',
    details: {
      variables: {
        NEXT_PUBLIC_SUPABASE_URL: supabaseUrl ? '✓ Set' : '✗ Missing',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: supabaseKey ? '✓ Set' : '✗ Missing'
      }
    }
  };
}

/**
 * Run all diagnostics
 */
export async function runAllDiagnostics(): Promise<Record<string, DiagnosticResult>> {
  const envCheck = checkEnvironmentVariables();
  const connectionCheck = await checkSupabaseConnection();
  
  return {
    environmentVariables: envCheck,
    supabaseConnection: connectionCheck
  };
}
