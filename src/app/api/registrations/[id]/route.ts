import { NextRequest, NextResponse } from 'next/server';
import { getServiceClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    console.log(`API: Fetching registration with ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('registrations')
      .select(`
        *,
        experiences (
          id,
          title,
          start_date,
          end_date,
          slug,
          location_id,
          locations (
            name
          )
        ),
        users (
          full_name,
          email,
          phone
        )
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error(`API: Error getting registration by ID ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to fetch registration', details: error },
        { status: error.code === 'PGRST116' ? 404 : 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error in GET registration by ID:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    console.log(`API: Updating registration with ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log(`API: Update data for registration ${id}:`, body);

    const supabase = getServiceClient();
    const { data, error } = await supabase
      .from('registrations')
      .update(body)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error(`API: Error updating registration ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to update registration', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('API: Unexpected error in PATCH registration:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: { id: string } }
) {
  try {
    const id = context.params.id;
    console.log(`API: Deleting registration with ID: ${id}`);
    
    if (!id) {
      return NextResponse.json(
        { error: 'Registration ID is required' },
        { status: 400 }
      );
    }

    const supabase = getServiceClient();
    const { error } = await supabase
      .from('registrations')
      .delete()
      .eq('id', id);

    if (error) {
      console.error(`API: Error deleting registration ${id}:`, error);
      return NextResponse.json(
        { error: 'Failed to delete registration', details: error },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API: Unexpected error in DELETE registration:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
