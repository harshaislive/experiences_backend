'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Experience, ExperienceStatus } from '@/types';
import { ExperiencesService } from '@/services/experiences';
import { LocationsService } from '@/services/locations';
import { DataTable } from '@/components/ui/DataTable';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import {
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  CurrencyDollarIcon,
  ListBulletIcon,
  PhotoIcon,
  CakeIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { createExperience, updateExperience, deleteExperience } from '@/app/actions/experiences';

type ExperienceFormData = Omit<Experience, 'id' | 'created_at' | 'updated_at'>;

const initialFormData: ExperienceFormData = {
  location_id: '',
  title: '',
  description: '',
  slug: '',
  start_date: '',
  end_date: '',
  total_capacity: 0,
  current_participants: 0,
  is_featured: false,
  status: 'upcoming',
};

export default function ExperiencesPage() {
  const router = useRouter();
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [locations, setLocations] = useState<{ id: string; name: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExperience, setSelectedExperience] = useState<Experience | null>(null);
  const [experienceToDelete, setExperienceToDelete] = useState<Experience | null>(null);
  const [formData, setFormData] = useState<ExperienceFormData>(initialFormData);
  const [debugInfo, setDebugInfo] = useState({ count: 0, statuses: {} });

  const loadExperiences = useCallback(async () => {
    try {
      setIsLoading(true);
      console.log('Loading experiences...');
      const [experiencesData, locationsData] = await Promise.all([
        ExperiencesService.getAll(),
        LocationsService.getAll(),
      ]);
      console.log('Experiences fetched:', experiencesData);
      
      setExperiences(experiencesData || []);
      
      const statuses = {};
      experiencesData?.forEach(exp => {
        statuses[exp.status] = (statuses[exp.status] || 0) + 1;
      });
      
      setDebugInfo({
        count: experiencesData?.length || 0,
        statuses
      });
      
      setLocations(
        locationsData?.map((loc) => ({ id: loc.id, name: loc.name })) || []
      );
    } catch (error) {
      console.error('Failed to load experiences:', error);
      toast.error('Failed to load experiences');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadExperiences();
  }, [loadExperiences]);

  const handleNavigate = (experienceId: string, path: 'pricing' | 'items' | 'food' | 'images') => {
    router.push(`/dashboard/experiences/${experienceId}/${path}`);
  };

  const handleCreate = () => {
    setSelectedExperience(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleEdit = async (experience: Experience) => {
    setSelectedExperience(experience);
    setFormData({
      location_id: experience.location_id,
      title: experience.title,
      description: experience.description || '',
      slug: experience.slug,
      start_date: new Date(experience.start_date).toISOString().split('T')[0],
      end_date: new Date(experience.end_date).toISOString().split('T')[0],
      total_capacity: experience.total_capacity,
      current_participants: experience.current_participants,
      is_featured: experience.is_featured,
      status: experience.status,
    });

    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!experienceToDelete) return;

    try {
      const result = await deleteExperience(experienceToDelete.id);
      if (result.success) {
        toast.success('Experience deleted successfully');
        loadExperiences();
      } else {
        toast.error(result.error || 'Failed to delete experience');
      }
    } catch (error) {
      console.error('Failed to delete experience:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setExperienceToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      if (selectedExperience) {
        const result = await updateExperience(selectedExperience.id, formData);
        if (!result.success) {
          throw new Error(result.error);
        }
        
        toast.success('Experience updated successfully');
      } else {
        const result = await createExperience(formData);
        if (!result.success) {
          throw new Error(result.error);
        }
        console.log('New experience created:', result.data);
        toast.success('Experience created successfully');
      }

      // Reset form
      setFormData(initialFormData);
      setSelectedExperience(null);
      setModalOpen(false);
      
      // Force reload experiences to see the new one
      setTimeout(() => {
        loadExperiences();
      }, 500); // Small delay to ensure the database has time to update
    } catch (error) {
      console.error('Error saving experience:', error);
      toast.error('Failed to save experience');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: ExperienceStatus) => {
    switch (status) {
      case 'upcoming':
        return 'bg-[#e7e4df] text-[#344736]';
      case 'ongoing':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const columns = [
    { header: 'Title', accessor: 'title' as keyof Experience },
    { header: 'Location', accessor: (exp: Experience) => {
      const location = locations.find(loc => loc.id === exp.location_id);
      return location?.name || 'Unknown Location';
    }},
    {
      header: 'Status',
      accessor: (experience: Experience) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
            experience.status
          )}`}
        >
          {experience.status.charAt(0).toUpperCase() + experience.status.slice(1)}
        </span>
      ),
    },
    {
      header: 'Capacity',
      accessor: (experience: Experience) =>
        `${experience.current_participants}/${experience.total_capacity}`,
    },
    {
      header: 'Dates',
      accessor: (experience: Experience) =>
        `${new Date(experience.start_date).toLocaleDateString()} - ${new Date(
          experience.end_date
        ).toLocaleDateString()}`,
    },
    {
      header: 'Actions',
      accessor: (experience: Experience) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(experience);
            }}
            title="Edit experience"
          >
            <PencilSquareIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(experience.id, 'pricing');
            }}
            title="Manage pricing"
          >
            <CurrencyDollarIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(experience.id, 'items');
            }}
            title="Manage items"
          >
            <ListBulletIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(experience.id, 'food');
            }}
            title="Manage food options"
          >
            <CakeIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleNavigate(experience.id, 'images');
            }}
            title="Manage images"
          >
            <PhotoIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              setExperienceToDelete(experience);
            }}
            title="Delete experience"
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const handleRefresh = () => {
    toast.loading('Refreshing experiences...');
    loadExperiences().then(() => {
      toast.dismiss();
      toast.success('Experiences refreshed');
    });
  };

  return (
    <div className="min-h-screen bg-[#fdfbf7]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-semibold tracking-tight text-[#342e29]">
            Experiences
          </h1>
          <p className="mt-4 text-lg text-[#51514d]">
            Create unforgettable moments for your guests
          </p>
        </div>

        {/* Main Content */}
        <div className="bg-[#fdfbf7]/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(52,46,41,0.04)] overflow-hidden border border-[#e7e4df]">
          <div className="p-8">
            <div className="flex justify-between mb-8">
              <div>
                {/* Only show this in development to help debugging */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-[#51514d]">
                    Found {debugInfo.count} experiences. 
                    Status counts: {Object.entries(debugInfo.statuses).map(([status, count]) => 
                      `${status}: ${count}`).join(', ')}
                  </div>
                )}
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleRefresh}
                  variant="secondary" 
                  className="px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200"
                >
                  Refresh
                </Button>
                <Button 
                  onClick={handleCreate} 
                  className="bg-[#344736] hover:bg-[#415c43] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  New Experience
                </Button>
              </div>
            </div>

            <DataTable
              data={experiences}
              columns={columns}
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
                {selectedExperience ? 'Edit Experience' : 'New Experience'}
              </h2>
              <p className="text-[#51514d] text-lg">
                {selectedExperience ? 'Refine your experience details' : 'Create something extraordinary'}
              </p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-12 px-4">
            {/* Basic Information Section */}
            <div className="space-y-8">
              <div className="bg-[#fdfbf7] rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-[#342e29] mb-8">Basic Information</h3>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-[#342e29] mb-2">Location</label>
                    <select
                      className="w-full rounded-xl border-0 py-4 px-5 text-[#342e29] shadow-sm ring-1 ring-inset ring-[#e7e4df] focus:ring-2 focus:ring-inset focus:ring-[#344736] transition-all duration-200 placeholder:text-[#51514d]"
                      value={formData.location_id}
                      onChange={(e) => setFormData({ ...formData, location_id: e.target.value })}
                      required
                    >
                      <option value="" className="text-[#51514d]">Choose a location for your experience</option>
                      {locations.map((location) => (
                        <option key={location.id} value={location.id}>
                          {location.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <Input
                      label="Title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                      className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                      placeholder="e.g. Night Sky Photography Workshop"
                    />

                    <Input
                      label="Slug"
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                      required
                      pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                      helperText="Lowercase letters, numbers, and hyphens only"
                      className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                      placeholder="night-sky-photography"
                    />
                  </div>

                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    variant="textarea"
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] h-40 px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Share the details of your experience. What will participants do? What should they expect? What makes this experience special?"
                  />
                </div>
              </div>
            </div>

            {/* Schedule & Capacity Section */}
            <div className="space-y-8">
              <div className="bg-[#fdfbf7] rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-[#342e29] mb-8">Schedule & Capacity</h3>

                <div className="space-y-8">
                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <Input
                      label="Start Date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      required
                      className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4"
                    />

                    <Input
                      label="End Date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                      required
                      className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4"
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
                    <Input
                      label="Total Capacity"
                      type="number"
                      value={formData.total_capacity}
                      onChange={(e) => setFormData({ ...formData, total_capacity: parseInt(e.target.value) })}
                      required
                      min={0}
                      className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                      placeholder="e.g. 20"
                    />

                    <div>
                      <label className="block text-sm font-medium text-[#342e29] mb-2">Status</label>
                      <select
                        className="w-full rounded-xl border-0 py-4 px-5 text-[#342e29] shadow-sm ring-1 ring-inset ring-[#e7e4df] focus:ring-2 focus:ring-inset focus:ring-[#344736] transition-all duration-200 placeholder:text-[#51514d]"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as ExperienceStatus })}
                        required
                      >
                        <option value="upcoming">Upcoming</option>
                        <option value="ongoing">Ongoing</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 bg-white/80 rounded-xl p-6 shadow-sm">
                    <input
                      type="checkbox"
                      id="is_featured"
                      checked={formData.is_featured}
                      onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                      className="h-5 w-5 rounded-md border-[#e7e4df] text-[#344736] focus:ring-[#344736] transition-colors cursor-pointer"
                    />
                    <label
                      htmlFor="is_featured"
                      className="text-sm font-medium text-[#342e29] cursor-pointer select-none"
                    >
                      Featured Experience
                    </label>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="sticky bottom-0 bg-white/80 backdrop-blur-xl -mx-10 px-10 py-6 border-t border-[#e7e4df]">
              <div className="flex justify-end gap-4">
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setModalOpen(false)}
                  className="px-8 py-3 rounded-full text-[#342e29] hover:bg-[#fdfbf7] transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  disabled={isSaving}
                  className="bg-[#344736] hover:bg-[#415c43] text-white px-8 py-3 rounded-full transition-all duration-200"
                >
                  {selectedExperience ? 'Update Experience' : 'Create Experience'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={!!experienceToDelete}
          onClose={() => setExperienceToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Experience"
          description="Are you sure you want to delete this experience? This action cannot be undone."
        />
      </div>
    </div>
  );
}
