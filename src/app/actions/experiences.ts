'use server'

import { getServiceClient } from '@/lib/supabase'
import { Experience, ExperiencePricing, ExperienceItemToBring, ExperienceImage, ExperienceFoodOption } from '@/types'
import { ExperiencesService } from '@/services/experiences'

export async function updateExperience(id: string, data: Partial<Experience>) {
  try {
    const supabase = getServiceClient()
    const { data: updatedExperience, error } = await supabase
      .from('experiences')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: updatedExperience }
  } catch (error) {
    console.error('Server error updating experience:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update experience' }
  }
}

export async function createExperience(data: Omit<Experience, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = getServiceClient()
    const { data: newExperience, error } = await supabase
      .from('experiences')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: newExperience }
  } catch (error) {
    console.error('Server error creating experience:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create experience' }
  }
}

export async function deleteExperience(id: string) {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('experiences')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Server error deleting experience:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete experience' }
  }
}

export async function updateExperiencePricing(id: string, data: Partial<ExperiencePricing>) {
  try {
    const supabase = getServiceClient()
    const { data: updatedPricing, error } = await supabase
      .from('experience_pricing')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: updatedPricing }
  } catch (error) {
    console.error('Server error updating experience pricing:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update pricing' }
  }
}

export async function createExperiencePricing(data: Omit<ExperiencePricing, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = getServiceClient()
    const { data: newPricing, error } = await supabase
      .from('experience_pricing')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: newPricing }
  } catch (error) {
    console.error('Server error creating experience pricing:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create pricing' }
  }
}

export async function deleteExperiencePricing(id: string) {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('experience_pricing')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Server error deleting experience pricing:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete pricing' }
  }
}

export async function updateExperienceItem(id: string, data: Partial<ExperienceItemToBring>) {
  try {
    const supabase = getServiceClient()
    const { data: updatedItem, error } = await supabase
      .from('experience_items_to_bring')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: updatedItem }
  } catch (error) {
    console.error('Server error updating experience item:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update item' }
  }
}

export async function createExperienceItem(data: Omit<ExperienceItemToBring, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = getServiceClient()
    const { data: newItem, error } = await supabase
      .from('experience_items_to_bring')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: newItem }
  } catch (error) {
    console.error('Server error creating experience item:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create item' }
  }
}

export async function deleteExperienceItem(id: string) {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('experience_items_to_bring')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Server error deleting experience item:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete item' }
  }
}

export async function uploadExperienceImage(file: File, path: string) {
  try {
    const supabase = getServiceClient()

    // Ensure we have a valid file
    if (!file || !(file instanceof File)) {
      throw new Error('Invalid file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      throw new Error('Invalid file type. Only JPEG, PNG and WebP images are allowed.');
    }

    // Validate file size (5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      throw new Error('File size too large. Maximum size is 5MB.');
    }

    // Upload with content type
    const { data, error } = await supabase.storage
      .from('images_experiences')
      .upload(path, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      console.error('Storage upload error:', error);
      throw error;
    }

    if (!data) {
      throw new Error('No data returned from upload');
    }

    // Get the public URL for the uploaded file
    const { data: publicUrlData } = supabase.storage
      .from('images_experiences')
      .getPublicUrl(data.path);

    console.log('Upload successful:', {
      path: data.path,
      publicUrl: publicUrlData.publicUrl
    });

    return { 
      success: true, 
      data: {
        path: data.path,
        publicUrl: publicUrlData.publicUrl
      }
    }
  } catch (error) {
    console.error('Server error uploading experience image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to upload image' 
    }
  }
}

export async function addExperienceImage(data: Omit<ExperienceImage, 'id' | 'created_at'>) {
  try {
    const supabase = getServiceClient();
    console.log('Adding experience image to database:', data);

    const { data: newImage, error } = await supabase
      .from('experience_images')
      .insert({
        experience_id: data.experience_id,
        image_url: data.image_url,
        is_hero: data.is_hero,
        order: data.order,
        alt_text: data.alt_text || ''
      })
      .select()
      .single();

    if (error) {
      console.error('Database error adding image:', error);
      throw error;
    }

    console.log('Successfully added image to database:', newImage);
    return { success: true, data: newImage };
  } catch (error) {
    console.error('Server error adding experience image:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to add image to database'
    };
  }
}

export async function deleteExperienceImage(id: string, path: string) {
  try {
    const supabase = getServiceClient()
    
    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from('images_experiences')
      .remove([path])

    if (storageError) throw storageError

    // Delete from database
    const { error: dbError } = await supabase
      .from('experience_images')
      .delete()
      .eq('id', id)

    if (dbError) throw dbError
    return { success: true }
  } catch (error) {
    console.error('Server error deleting experience image:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete image' }
  }
}

export async function updateExperienceImageOrder(id: string, order: number) {
  try {
    const supabase = getServiceClient()
    const { data, error } = await supabase
      .from('experience_images')
      .update({ order })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Server error updating image order:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update image order' }
  }
}

export async function updateExperienceFoodOption(
  id: string,
  data: Partial<Omit<ExperienceFoodOption, 'id' | 'created_at' | 'updated_at'>>
) {
  try {
    const result = await ExperiencesService.food.update(id, data);
    if (!result) {
      return { success: false, error: 'Failed to update food option' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to update food option:', error);
    return { success: false, error: 'Failed to update food option' };
  }
}

export async function createExperienceFoodOption(
  data: Omit<ExperienceFoodOption, 'id' | 'created_at' | 'updated_at'>
) {
  try {
    const result = await ExperiencesService.food.add(data);
    if (!result) {
      return { success: false, error: 'Failed to create food option' };
    }
    return { success: true, data: result };
  } catch (error) {
    console.error('Failed to create food option:', error);
    return { success: false, error: 'Failed to create food option' };
  }
}

export async function deleteExperienceFoodOption(id: string) {
  try {
    await ExperiencesService.food.delete(id);
    return { success: true };
  } catch (error) {
    console.error('Failed to delete food option:', error);
    return { success: false, error: 'Failed to delete food option' };
  }
}

export async function updateExperienceImage(id: string, data: Partial<Omit<ExperienceImage, 'id' | 'created_at'>>) {
  try {
    const supabase = getServiceClient();
    const { data: updatedImage, error } = await supabase
      .from('experience_images')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return { success: true, data: updatedImage };
  } catch (error) {
    console.error('Server error updating experience image:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update image' };
  }
} 