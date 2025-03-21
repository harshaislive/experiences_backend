import { getServiceClient, handleSupabaseError } from '@/lib/supabase';
import { Experience, ExperiencePricing, ExperienceItemToBring, ExperienceFoodOption } from '@/types';

export const ExperiencesService = {
  // Get all experiences (using service client to bypass RLS)
  async getAll() {
    console.log('ExperiencesService.getAll called');
    
    try {
      const serviceClient = getServiceClient();
      const { data, error } = await serviceClient
        .from('experiences')
        .select(`
          *,
          locations (
            id,
            name,
            location_images (*)
          ),
          experience_pricing (*),
          experience_items_to_bring (*)
        `)
        .order('start_date', { ascending: true });

      if (error) {
        console.error('Error fetching experiences:', error);
        handleSupabaseError(error);
      }
      
      // For debugging - log status counts
      if (data) {
        const statusCounts = {};
        data.forEach(exp => {
          statusCounts[exp.status] = (statusCounts[exp.status] || 0) + 1;
        });
        console.log(`Experiences fetched count: ${data.length}, Status counts:`, statusCounts);
      } else {
        console.log('No experiences found');
      }
      
      return data;
    } catch (error) {
      console.error('Unexpected error in getAll:', error);
      handleSupabaseError(error as Error);
      return [];
    }
  },

  // Get a single experience by ID (using service client)
  async getById(id: string) {
    console.log('Getting experience by ID:', id);
    const serviceClient = getServiceClient();
    const { data, error } = await serviceClient
      .from('experiences')
      .select(`
        *,
        locations (
          id,
          name,
          location_images (*)
        ),
        experience_items_to_bring (
          id,
          item,
          is_optional,
          sort_order
        ),
        experience_pricing (*),
        experience_images (*)
      `)
      .eq('id', id)
      .single();

    console.log('Experience getById response:', { data, error });

    if (error) {
      console.error('Error getting experience:', error);
      handleSupabaseError(error);
    }
    return data;
  },

  // Create a new experience (using admin client)
  async create(experience: Omit<Experience, 'id' | 'created_at' | 'updated_at'>) {
    const serviceClient = getServiceClient();
    const { data, error } = await serviceClient
      .from('experiences')
      .insert(experience)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  // Update an experience (using admin client)
  async update(
    id: string,
    experience: Partial<Omit<Experience, 'id' | 'created_at' | 'updated_at'>>
  ) {
    const serviceClient = getServiceClient();
    const { data, error } = await serviceClient
      .from('experiences')
      .update(experience)
      .eq('id', id)
      .select()
      .single();

    if (error) handleSupabaseError(error);
    return data;
  },

  // Delete an experience (using admin client)
  async delete(id: string) {
    const serviceClient = getServiceClient();
    const { error } = await serviceClient
      .from('experiences')
      .delete()
      .eq('id', id);

    if (error) handleSupabaseError(error);
    return true;
  },

  // Pricing operations
  pricing: {
    // Get pricing options for an experience (using service client)
    async getByExperienceId(experienceId: string) {
      try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
          .from('experience_pricing')
          .select('*')
          .eq('experience_id', experienceId)
          .order('price', { ascending: true });

        if (error) handleSupabaseError(error);
        return data || [];
      } catch (error) {
        handleSupabaseError(error as Error);
        return [];
      }
    },

    // Add pricing option (using admin client)
    async add(pricing: Omit<ExperiencePricing, 'id' | 'created_at' | 'updated_at'>) {
      const serviceClient = getServiceClient();
      const { data, error } = await serviceClient
        .from('experience_pricing')
        .insert(pricing)
        .select();

      if (error) handleSupabaseError(error);
      return data?.[0] || null;
    },

    // Update pricing option (using admin client)
    async update(
      id: string,
      pricing: Partial<Omit<ExperiencePricing, 'id' | 'created_at' | 'updated_at'>>
    ) {
      const serviceClient = getServiceClient();
      console.log('Updating pricing with ID:', id, 'Data:', pricing);

      // First fetch the existing price
      const { data: existing, error: fetchError } = await serviceClient
        .from('experience_pricing')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        handleSupabaseError(fetchError);
      }

      if (!existing) {
        console.error('Price option not found');
        return null;
      }

      // Merge existing data with updates
      const updateData = {
        ...existing,
        ...pricing,
        updated_at: new Date().toISOString()
      };

      // Remove id from update data
      delete updateData.id;
      delete updateData.created_at;

      console.log('Merged update data:', updateData);
      
      const { data, error } = await serviceClient
        .from('experience_pricing')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Update error:', error);
        handleSupabaseError(error);
      }
      
      console.log('Update response:', data);
      return data || null;
    },

    // Delete pricing option (using admin client)
    async delete(id: string) {
      const serviceClient = getServiceClient();
      const { error } = await serviceClient
        .from('experience_pricing')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);
      return true;
    }
  },

  // Items to bring operations
  itemsToBring: {
    // Get items for an experience (using service client)
    async getByExperienceId(experienceId: string) {
      try {
        console.log('Fetching items for experience:', experienceId);
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
          .from('experience_items_to_bring')
          .select('*')
          .eq('experience_id', experienceId)
          .order('sort_order', { ascending: true });

        console.log('Items fetch response:', { data, error });

        if (error) {
          console.error('Error fetching items:', error);
          handleSupabaseError(error);
        }
        return data || [];
      } catch (error) {
        console.error('Exception in getByExperienceId:', error);
        handleSupabaseError(error as Error);
        return [];
      }
    },

    // Add item (using admin client)
    async add(item: Omit<ExperienceItemToBring, 'id' | 'created_at' | 'updated_at'>) {
      try {
        console.log('Adding new item:', item);
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
          .from('experience_items_to_bring')
          .insert(item)
          .select()
          .single();

        console.log('Add item response:', { data, error });

        if (error) {
          console.error('Error adding item:', error);
          handleSupabaseError(error);
        }
        return data;
      } catch (error) {
        console.error('Exception in add:', error);
        handleSupabaseError(error as Error);
        return null;
      }
    },

    // Update item (using admin client)
    async update(
      id: string,
      item: Partial<Omit<ExperienceItemToBring, 'id' | 'created_at' | 'updated_at'>>
    ) {
      try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
          .from('experience_items_to_bring')
          .update({
            ...item,
            updated_at: new Date().toISOString()
          })
          .eq('id', id)
          .select()
          .single();

        if (error) handleSupabaseError(error);
        return data;
      } catch (error) {
        handleSupabaseError(error as Error);
        return null;
      }
    },

    // Delete item (using admin client)
    async delete(id: string) {
      const serviceClient = getServiceClient();
      const { error } = await serviceClient
        .from('experience_items_to_bring')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);
      return true;
    }
  },

  food: {
    // Get food options for an experience (using service client)
    async getByExperienceId(experienceId: string) {
      try {
        const serviceClient = getServiceClient();
        const { data, error } = await serviceClient
          .from('experience_food_options')
          .select('*')
          .eq('experience_id', experienceId)
          .order('created_at', { ascending: true });

        if (error) handleSupabaseError(error);
        return data || [];
      } catch (error) {
        handleSupabaseError(error as Error);
        return [];
      }
    },

    // Add food option (using admin client)
    async add(food: Omit<ExperienceFoodOption, 'id' | 'created_at' | 'updated_at'>) {
      const serviceClient = getServiceClient();
      const { data, error } = await serviceClient
        .from('experience_food_options')
        .insert(food)
        .select();

      if (error) handleSupabaseError(error);
      return data?.[0] || null;
    },

    // Update food option (using admin client)
    async update(
      id: string,
      food: Partial<Omit<ExperienceFoodOption, 'id' | 'created_at' | 'updated_at'>>
    ) {
      const serviceClient = getServiceClient();
      const { data, error } = await serviceClient
        .from('experience_food_options')
        .update(food)
        .eq('id', id)
        .select();

      if (error) handleSupabaseError(error);
      return data?.[0] || null;
    },

    // Delete food option (using admin client)
    async delete(id: string) {
      const serviceClient = getServiceClient();
      const { error } = await serviceClient
        .from('experience_food_options')
        .delete()
        .eq('id', id);

      if (error) handleSupabaseError(error);
      return true;
    }
  }
};
