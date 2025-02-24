'use client';

import { useCallback, useEffect, useState } from 'react';
import { Location } from '@/types';
import { LocationsService } from '@/services/locations';
import { createLocation, updateLocation, deleteLocation } from '@/app/actions/locations';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { ImageUpload } from '@/components/ui/ImageUpload';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function LocationsPage() {
  const [locations, setLocations] = useState<Location[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [locationToDelete, setLocationToDelete] = useState<Location | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    slug: '',
    features: {},
    highlights: {},
    is_active: true,
  });
  const [images, setImages] = useState<Array<{ id?: string; url: string; file?: File; order: number; is_hero?: boolean }>>([]);

  const loadLocations = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await LocationsService.getAll();
      setLocations(data || []);
    } catch (error) {
      console.error('Failed to load locations:', error);
      toast.error('Failed to load locations');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadLocations();
  }, [loadLocations]);

  const handleCreate = () => {
    setSelectedLocation(null);
    setFormData({
      name: '',
      description: '',
      slug: '',
      features: {},
      highlights: {},
      is_active: true,
    });
    setModalOpen(true);
  };

  const handleEdit = async (location: Location) => {
    setSelectedLocation(location);
    setFormData({
      name: location.name,
      description: location.description || '',
      slug: location.slug,
      features: location.features || {},
      highlights: location.highlights || {},
      is_active: location.is_active,
    });

    // Load existing images
    try {
      const locationData = await LocationsService.getById(location.id);
      if (locationData?.location_images) {
        setImages(
          locationData.location_images
            .filter((img: { id: string; image_url: string; order: number; is_hero: boolean }) => img.image_url)
            .map((img: { id: string; image_url: string; order: number; is_hero: boolean }) => ({
              id: img.id,
              url: img.image_url.startsWith('http') 
                ? img.image_url 
                : `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/location-images/${img.image_url}`,
              order: img.order || 0,
              is_hero: img.is_hero
            }))
        );
      }
    } catch (error) {
      console.error('Failed to load location images:', error);
      toast.error('Failed to load existing images');
    }

    setModalOpen(true);
  };

  const handleImagesChange = async (newImages: Array<{ id?: string; url: string; file?: File; order: number; is_hero?: boolean }>) => {
    setImages(newImages);
  };

  const deleteExistingImage = async (imageId: string) => {
    try {
      const imageToDelete = images.find(img => img.id === imageId);
      if (!imageToDelete) {
        throw new Error('Image not found');
      }

      await LocationsService.deleteImage(imageId);
      toast.success('Image deleted successfully');
      
      setImages(current => current.filter(img => img.id !== imageId));
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleDeleteImage = async (index: number) => {
    const image = images[index];
    if (image.id) {
      await deleteExistingImage(image.id);
    }
    const newImages = images.filter((_, i) => i !== index);
    newImages.forEach((img, i) => {
      img.order = i;
    });
    setImages(newImages);
  };

  const uploadImages = async (locationId: string) => {
    const newImages = images.filter(img => img.file);

    try {
      for (const image of newImages) {
        if (!image.file) continue;

        const fileName = `${locationId}/${Date.now()}-${image.file.name}`;
        const uploadResult = await LocationsService.uploadImage(image.file, fileName);

        if (!uploadResult) {
          throw new Error('Failed to upload image');
        }

        await LocationsService.addImage({
          location_id: locationId,
          image_url: uploadResult.path,
          is_hero: image.is_hero || false,
          order: image.order
        });
      }

      toast.success('Images uploaded successfully');
    } catch (error) {
      console.error('Error uploading images:', error);
      toast.error('Failed to upload images');
    }
  };

  const handleDelete = async () => {
    if (!locationToDelete) return;

    try {
      const result = await deleteLocation(locationToDelete.id);
      if (result.success) {
        toast.success('Location deleted successfully');
        loadLocations();
      } else {
        toast.error(result.error || 'Failed to delete location');
      }
    } catch (error) {
      console.error('Failed to delete location:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setLocationToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (selectedLocation?.id) {
        const result = await updateLocation(selectedLocation.id, formData);
        if (result.success) {
          if (images.some(img => img.file)) {
            await uploadImages(selectedLocation.id);
          }
          toast.success('Location updated successfully');
          setModalOpen(false);
          loadLocations();
        } else {
          toast.error(result.error || 'Failed to update location');
        }
      } else {
        const result = await createLocation(formData);
        if (result.success) {
          if (images.length > 0) {
            await uploadImages(result.data.id);
          }
          toast.success('Location created successfully');
          setModalOpen(false);
          loadLocations();
        } else {
          toast.error(result.error || 'Failed to create location');
        }
      }
    } catch (error) {
      console.error('Failed to save location:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { header: 'Name', accessor: 'name' as keyof Location },
    { header: 'Slug', accessor: 'slug' as keyof Location },
    {
      header: 'Status',
      accessor: (location: Location) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            location.is_active
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {location.is_active ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      header: 'Created',
      accessor: (location: Location) =>
        location.created_at
          ? new Date(location.created_at).toLocaleDateString()
          : '',
    },
    {
      header: 'Actions',
      accessor: (location: Location) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(location);
            }}
          >
            <PencilSquareIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              setLocationToDelete(location);
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-4xl font-semibold text-[#342e29]">
            Locations
          </h1>
          <p className="mt-4 text-lg text-[#51514d]">
            Manage your beautiful destinations
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-[#fdfbf7]/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(52,46,41,0.04)] border border-[#e7e4df] overflow-hidden">
          <div className="p-8">
            <div className="flex justify-end mb-8">
              <Button 
                onClick={handleCreate}
                className="bg-[#344736] hover:bg-[#415c43] text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
              >
                <PlusIcon className="h-5 w-5 mr-2" />
                New Location
              </Button>
            </div>

            <DataTable<Location>
              columns={columns}
              data={locations}
              isLoading={isLoading}
            />
          </div>
        </div>

        <Modal
          isOpen={modalOpen}
          onClose={() => !isSaving && setModalOpen(false)}
          maxWidth="2xl"
          title={
            <div className="text-center px-4 pb-6">
              <h2 className="text-3xl font-semibold text-[#342e29] mb-2">
                {selectedLocation ? 'Edit Location' : 'New Location'}
              </h2>
              <p className="text-[#51514d] text-lg">
                {selectedLocation ? 'Refine your location details' : 'Create a new destination'}
              </p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-12 px-4">
            {/* Basic Information Section */}
            <div className="space-y-8">
              <div className="bg-[#fdfbf7] rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-[#342e29] mb-8">Basic Information</h3>
                <div className="space-y-6">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Enter a memorable location name"
                  />

                  <Input
                    label="Slug"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    required
                    pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                    helperText="Lowercase letters, numbers, and hyphens only"
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="unique-location-identifier"
                  />

                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    variant="textarea"
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] h-40 px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Paint a picture of this location. What makes it special? What can visitors expect to find here?"
                  />

                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="is_active"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="h-5 w-5 rounded-md border-[#e7e4df] text-[#344736] focus:ring-[#344736] transition-colors cursor-pointer"
                    />
                    <label
                      htmlFor="is_active"
                      className="text-sm font-medium text-[#342e29] cursor-pointer select-none"
                    >
                      Active Location
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Images Section */}
            <div className="space-y-8">
              <div className="bg-[#fdfbf7] rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-[#342e29] mb-8">Location Images</h3>
                <div className="bg-white/80 rounded-xl p-8 shadow-sm">
                  <ImageUpload
                    images={images}
                    onImagesChange={handleImagesChange}
                    onDelete={handleDeleteImage}
                    maxFiles={10}
                    maxSize={5 * 1024 * 1024} // 5MB
                    allowHeroSelection={true}
                    storageBucket="location-images"
                  />
                  <p className="mt-4 text-sm text-[#51514d]">
                    Upload high-quality images that showcase your location. The first image will be used as the hero image.
                  </p>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-[#fdfbf7] border-t border-[#e7e4df] -mx-4 px-8 py-6">
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  disabled={isSaving}
                  className="px-8 py-3 rounded-xl text-[#342e29] hover:bg-[#fdfbf7] transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  className="bg-[#344736] hover:bg-[#415c43] text-white px-8 py-3 rounded-xl transition-all duration-200"
                >
                  {selectedLocation ? 'Update Location' : 'Create Location'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={!!locationToDelete}
          onClose={() => setLocationToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Location"
          description="Are you sure you want to delete this location? This action cannot be undone."
          confirmText="Delete"
          isDestructive
        />
      </div>
    </div>
  );
}
