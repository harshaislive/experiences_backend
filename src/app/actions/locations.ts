'use server'

import { getServiceClient } from '@/lib/supabase'
import { Location } from '@/types'

export async function updateLocation(id: string, data: Partial<Location>) {
  try {
    const supabase = getServiceClient()
    const { data: updatedLocation, error } = await supabase
      .from('locations')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: updatedLocation }
  } catch (error) {
    console.error('Server error updating location:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to update location' }
  }
}

export async function createLocation(data: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
  try {
    const supabase = getServiceClient()
    const { data: newLocation, error } = await supabase
      .from('locations')
      .insert(data)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: newLocation }
  } catch (error) {
    console.error('Server error creating location:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to create location' }
  }
}

export async function deleteLocation(id: string) {
  try {
    const supabase = getServiceClient()
    const { error } = await supabase
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Server error deleting location:', error)
    return { success: false, error: error instanceof Error ? error.message : 'Failed to delete location' }
  }
} 