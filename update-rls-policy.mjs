import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Initialize environment variables
dotenv.config();

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

// Create a service client (admin)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function updateRLSPolicy() {
  console.log('Checking existing RLS policies...');
  
  try {
    // Get the existing policy
    const { data: existingPolicies, error: policiesError } = await serviceClient.rpc('get_policies', {
      table_name: 'experiences',
      schema_name: 'public'
    });

    if (policiesError) {
      console.error('Error fetching policies:', policiesError);
      return;
    }

    console.log('Existing policies:', existingPolicies);

    // Now we should drop the existing Public policy and create a new one
    console.log('Dropping existing "Public can view upcoming events" policy...');
    
    try {
      await serviceClient.rpc('drop_policy', {
        table_name: 'experiences',
        policy_name: 'Public can view upcoming events',
        schema_name: 'public'
      });
      
      console.log('Successfully dropped the policy');
    } catch (dropError) {
      console.error('Error dropping policy:', dropError);
      return;
    }

    // Create an improved policy that shows all experiences to admins but only upcoming to public
    console.log('Creating new RLS policy for experiences...');
    
    try {
      await serviceClient.rpc('create_policy', {
        table_name: 'experiences',
        policy_name: 'Admins see all, Public sees upcoming only',
        action: 'SELECT',
        definition: "(auth.uid() IN (SELECT au.id FROM auth.users au WHERE au.email = current_setting('app.admin_email', true))) OR (status = 'upcoming')",
        schema_name: 'public',
        check: null,
        roles: '{public}'
      });
      
      console.log('Successfully created the new policy');
    } catch (createError) {
      console.error('Error creating policy:', createError);
      return;
    }

    console.log('RLS policy update complete.');
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the update function
updateRLSPolicy(); 