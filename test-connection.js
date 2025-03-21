require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client with environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey || !supabaseAnonKey) {
  console.error('Missing required environment variables. Please check your .env file.');
  process.exit(1);
}

console.log('Supabase URL:', supabaseUrl);
console.log('Service Key exists:', !!supabaseServiceKey);
console.log('Anon Key exists:', !!supabaseAnonKey);

// Create a service client (admin)
const serviceClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Create a regular client
const regularClient = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('===== TESTING SUPABASE CONNECTION =====');
  
  try {
    // Test service client connection
    console.log('\nTesting service client connection...');
    const { data: serviceData, error: serviceError } = await serviceClient
      .from('experiences')
      .select('count')
      .single();
    
    if (serviceError) {
      console.error('Service client connection error:', serviceError);
    } else {
      console.log('Service client connection successful:', serviceData);
    }
    
    // Test regular client connection
    console.log('\nTesting regular client connection...');
    const { data: regularData, error: regularError } = await regularClient
      .from('experiences')
      .select('count')
      .single();
    
    if (regularError) {
      console.error('Regular client connection error:', regularError);
    } else {
      console.log('Regular client connection successful:', regularData);
    }
    
    console.log('\nChecking locations...');
    const { data: locations, error: locationsError } = await serviceClient
      .from('locations')
      .select('id, name')
      .limit(5);
    
    if (locationsError) {
      console.error('Error fetching locations:', locationsError);
    } else {
      console.log('Locations found:', locations);
    }
    
    // Create a test experience
    if (locations && locations.length > 0) {
      const locationId = locations[0].id;
      
      console.log('\nCreating a test experience...');
      const testExperience = {
        location_id: locationId,
        slug: `test-experience-${Date.now()}`,
        title: 'Test Experience',
        description: 'This is a test experience created to verify connection',
        start_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 1 week from now
        end_date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(), // 1 week + 1 day from now
        total_capacity: 15,
        current_participants: 0,
        is_featured: false,
        status: 'upcoming'
      };
      
      const { data: newExperience, error: createError } = await serviceClient
        .from('experiences')
        .insert(testExperience)
        .select()
        .single();
      
      if (createError) {
        console.error('Error creating test experience:', createError);
      } else {
        console.log('Test experience created successfully:', newExperience);
        
        // Clean up - delete the test experience
        console.log('\nCleaning up - deleting test experience...');
        const { error: deleteError } = await serviceClient
          .from('experiences')
          .delete()
          .eq('id', newExperience.id);
        
        if (deleteError) {
          console.error('Error deleting test experience:', deleteError);
        } else {
          console.log('Test experience deleted successfully.');
        }
      }
    } else {
      console.log('No locations found to create a test experience.');
    }
    
  } catch (error) {
    console.error('Unexpected error during connection test:', error);
  }
}

// Run the test
testConnection(); 