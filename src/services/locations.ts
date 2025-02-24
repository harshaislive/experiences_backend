import { supabase, getServiceClient, handleSupabaseError } from '@/lib/supabase'
import { Location, LocationImage } from '@/types'

export const LocationsService = {
  // Get all locations (using public client)
  async getAll() {
    const { data, error } = await supabase
      .from('locations')
      .select('*, location_images(*)')
      .order('name', { ascending: true })

    if (error) handleSupabaseError(error)
    return data
  },

  // Get a single location by ID (using public client)
  async getById(id: string) {
    const { data, error } = await supabase
      .from('locations')
      .select('*, location_images(*)')
      .eq('id', id)
      .single()

    if (error) handleSupabaseError(error)
    return data
  },

  // Create a new location (using service client)
  async create(location: Omit<Location, 'id' | 'created_at' | 'updated_at'>) {
    const serviceClient = getServiceClient()
    const { data, error } = await serviceClient
      .from('locations')
      .insert(location)
      .select()
      .single()

    if (error) handleSupabaseError(error)
    return data
  },

  // Update a location (using service client)
  async update(id: string, location: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>) {
    const serviceClient = getServiceClient()
    const { data, error } = await serviceClient
      .from('locations')
      .update(location)
      .eq('id', id)
      .select()
      .single()

    if (error) handleSupabaseError(error)
    return data
  },

  // Delete a location (using service client)
  async delete(id: string) {
    const serviceClient = getServiceClient()
    const { error } = await serviceClient
      .from('locations')
      .delete()
      .eq('id', id)

    if (error) handleSupabaseError(error)
    return true
  },

  // Upload location image (using service client)
  async uploadImage(file: File, path: string) {
    const serviceClient = getServiceClient()
    const { data, error } = await serviceClient.storage
      .from('location-images')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) handleSupabaseError(error)
    return data
  },

  // Add location image record (using service client)
  async addImage(image: Omit<LocationImage, 'id' | 'created_at'>) {
    const serviceClient = getServiceClient()
    const { data, error } = await serviceClient
      .from('location_images')
      .insert(image)
      .select()
      .single()

    if (error) handleSupabaseError(error)
    return data
  },

  // Delete location image (using service client)
  async deleteImage(id: string) {
    const serviceClient = getServiceClient()
    const { error } = await serviceClient
      .from('location_images')
      .delete()
      .eq('id', id)

    if (error) handleSupabaseError(error)
    return true
  },

  // Update image order (using service client)
  async updateImageOrder(id: string, order: number) {
    const serviceClient = getServiceClient()
    const { data, error } = await serviceClient
      .from('location_images')
      .update({ order })
      .eq('id', id)
      .select()
      .single()

    if (error) handleSupabaseError(error)
    return data
  }
}
