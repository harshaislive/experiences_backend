import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Fetching registrations...');
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    
    console.log('API: Search query:', searchQuery);
    
    const supabase = getServiceClient();
    
    // First, let's just check if we can get any registrations
    const { data: basicData, error: basicError } = await supabase
      .from('registrations')
      .select('*')
      .limit(1);

    console.log('API: Basic query result:', { 
      success: !basicError, 
      dataReceived: !!basicData, 
      count: basicData?.length || 0,
      error: basicError ? basicError.message : null 
    });

    if (basicError) {
      console.error('API: Error with basic query:', basicError);
      return NextResponse.json(
        { error: 'Failed to fetch registrations', details: basicError },
        { status: 500 }
      );
    }

    // Build the query
    let query = supabase
      .from('registrations')
      .select(`
        *,
        experiences (
          id,
          title,
          start_date,
          end_date,
          slug
        ),
        users (
          full_name,
          email,
          phone
        )
      `);
    
    // Apply search filter if provided
    if (searchQuery) {
      try {
        console.log(`API: Applying search filter for: "${searchQuery}"`);
        
        // For transaction_id (which is a text field), we can use ilike directly
        // This is the correct syntax for Supabase's PostgreSQL REST API
        query = query.ilike('transaction_id', `%${searchQuery}%`);
        
        console.log('API: Search filter applied successfully');
      } catch (err) {
        console.error('API: Error applying search filter:', err);
        // Continue with the query without the filter if there's an error
      }
    }
    
    // Execute the query with ordering
    const { data, error } = await query.order('created_at', { ascending: false });

    console.log('API: Full query result:', { 
      success: !error, 
      dataReceived: !!data, 
      count: data?.length || 0,
      error: error ? error.message : null 
    });

    if (error) {
      console.error('API: Error with full query:', error);
      
      // If there was a search query that caused the error, try again without the search filter
      if (searchQuery) {
        console.log('API: Retrying query without search filter due to error');
        const retryQuery = supabase
          .from('registrations')
          .select(`
            *,
            experiences (
              id,
              title,
              start_date,
              end_date,
              slug
            ),
            users (
              full_name,
              email,
              phone
            )
          `)
          .order('created_at', { ascending: false });
          
        const { data: retryData, error: retryError } = await retryQuery;
        
        if (retryError) {
          return NextResponse.json(
            { error: 'Failed to fetch registrations', details: error },
            { status: 500 }
          );
        }
        
        // Transform the data
        const transformedData = retryData?.map(item => ({
          ...item,
          experience: item.experiences,
          user: item.users
        }));
        
        return NextResponse.json(transformedData || []);
      }
      
      return NextResponse.json(
        { error: 'Failed to fetch registrations', details: error },
        { status: 500 }
      );
    }

    // Transform the data
    const transformedData = data?.map(item => ({
      ...item,
      experience: item.experiences,
      user: item.users
    }));

    return NextResponse.json(transformedData || []);
  } catch (error) {
    console.error('API: Unexpected error in getRegistrations:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
