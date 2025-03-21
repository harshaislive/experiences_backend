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

async function updateEventStatus() {
  console.log('Updating Ugadi event status...');
  
  try {
    // Check if the event exists
    const { data: event, error: fetchError } = await serviceClient
      .from('experiences')
      .select('*')
      .eq('title', 'Ugadi 2025')
      .single();
    
    if (fetchError) {
      console.error('Error fetching event:', fetchError);
      return;
    }
    
    console.log('Current event data:', event);
    
    // Update the status to 'upcoming'
    const { data: updatedEvent, error: updateError } = await serviceClient
      .from('experiences')
      .update({ status: 'upcoming' })
      .eq('id', event.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating event status:', updateError);
      return;
    }
    
    console.log('Successfully updated event status:', updatedEvent);
  } catch (error) {
    console.error('Unexpected error:', error);
  }
}

// Run the update function
updateEventStatus(); 