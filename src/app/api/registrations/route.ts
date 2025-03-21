import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    console.log('API: Fetching registrations...');
    const { searchParams } = new URL(request.url);
    const searchQuery = searchParams.get('search');
    const searchType = searchParams.get('searchType') || 'transaction';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const pageSize = parseInt(searchParams.get('pageSize') || '10', 10);
    
    // Calculate offset for pagination
    const offset = (page - 1) * pageSize;
    
    console.log('API: Query parameters:', { 
      search: searchQuery, 
      searchType,
      page, 
      pageSize,
      offset
    });
    
    const supabase = getServiceClient();
    
    // First, build the count query to get total number of registrations
    let countQuery = supabase
      .from('registrations')
      .select('id', { count: 'exact' });
    
    // Build the main query
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
        console.log(`API: Applying search filter for: "${searchQuery}" (type: ${searchType})`);
        
        if (searchType === 'transaction') {
          // Search by transaction ID
          query = query.ilike('transaction_id', `%${searchQuery}%`);
          countQuery = countQuery.ilike('transaction_id', `%${searchQuery}%`);
        } else if (searchType === 'user') {
          // Search by user name/email (using foreign key relationship)
          // This requires a join to the users table
          query = query.or(`users.full_name.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`);
          countQuery = countQuery.or(`users.full_name.ilike.%${searchQuery}%,users.email.ilike.%${searchQuery}%`);
        }
        
        console.log('API: Search filter applied successfully');
      } catch (err) {
        console.error('API: Error applying search filter:', err);
        // Continue with the query without the filter if there's an error
      }
    }
    
    // Execute the count query first
    const { count, error: countError } = await countQuery;
    
    if (countError) {
      console.error('API: Error with count query:', countError);
      return NextResponse.json(
        { error: 'Failed to count registrations', details: countError },
        { status: 500 }
      );
    }
    
    // Calculate total pages
    const total = count || 0;
    const totalPages = Math.ceil(total / pageSize);
    
    console.log('API: Count result:', { total, totalPages });
    
    // Execute the main query with pagination
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + pageSize - 1);

    console.log('API: Main query result:', { 
      success: !error, 
      dataReceived: !!data, 
      count: data?.length || 0,
      error: error ? error.message : null 
    });

    if (error) {
      console.error('API: Error with main query:', error);
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
    
    // Return paginated result
    return NextResponse.json({
      data: transformedData || [],
      total,
      page,
      pageSize,
      totalPages
    });
  } catch (error) {
    console.error('API: Unexpected error in getRegistrations:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
