'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Experience, ExperienceFoodOption } from '@/types';
import { ExperiencesService } from '@/services/experiences';
import { updateExperienceFoodOption, createExperienceFoodOption, deleteExperienceFoodOption } from '@/app/actions/experiences';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface FoodFormData {
  name: string;
  description: string;
  price: string;
  max_quantity: string;
  is_vegetarian: boolean;
}

const initialFormData: FoodFormData = {
  name: '',
  description: '',
  price: '',
  max_quantity: '',
  is_vegetarian: false,
};

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
}

export default function ExperienceFoodPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [experience, setExperience] = useState<Experience | null>(null);
  const [foodOptions, setFoodOptions] = useState<ExperienceFoodOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedFood, setSelectedFood] = useState<ExperienceFoodOption | null>(null);
  const [foodToDelete, setFoodToDelete] = useState<ExperienceFoodOption | null>(null);
  const [formData, setFormData] = useState<FoodFormData>(initialFormData);

  const loadFoodData = async () => {
    try {
      setIsLoading(true);
      const [experienceData, foodData] = await Promise.all([
        ExperiencesService.getById(id),
        ExperiencesService.food.getByExperienceId(id),
      ]);

      if (!experienceData) {
        toast.error('Experience not found');
        router.push('/dashboard/experiences');
        return;
      }

      setExperience(experienceData);
      setFoodOptions(foodData || []);
    } catch (error) {
      console.error('Failed to load food data:', error);
      toast.error('Failed to load food data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFoodData();
  }, [id]);

  const handleCreate = () => {
    setSelectedFood(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleEdit = (food: ExperienceFoodOption) => {
    setSelectedFood(food);
    setFormData({
      name: food.name,
      description: food.description || '',
      price: food.price.toString(),
      max_quantity: food.max_quantity?.toString() || '',
      is_vegetarian: food.is_vegetarian,
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!foodToDelete) return;

    try {
      const result = await deleteExperienceFoodOption(foodToDelete.id);
      if (result.success) {
        toast.success('Food option deleted successfully');
        loadFoodData();
      } else {
        toast.error(result.error || 'Failed to delete food option');
      }
    } catch (error) {
      console.error('Failed to delete food option:', error);
      toast.error('Failed to delete food option. Please try again.');
    } finally {
      setFoodToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);

    try {
      const foodData = {
        experience_id: id,
        name: formData.name,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : undefined,
        is_vegetarian: formData.is_vegetarian,
      };

      let result;
      if (selectedFood) {
        // When updating, we don't need to include experience_id
        const updateData = {
          name: formData.name,
          description: formData.description || undefined,
          price: parseFloat(formData.price),
          max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : undefined,
          is_vegetarian: formData.is_vegetarian,
        };
        
        result = await updateExperienceFoodOption(selectedFood.id, updateData);
      } else {
        result = await createExperienceFoodOption(foodData);
      }

      if (result.success) {
        toast.success(selectedFood ? 'Food option updated successfully' : 'Food option added successfully');
        setModalOpen(false);
        loadFoodData();
      } else {
        console.error(selectedFood ? 'Update failed:' : 'Add failed:', result.error);
        toast.error(result.error || `Failed to ${selectedFood ? 'update' : 'add'} food option. Please try again.`);
      }
    } catch (error) {
      console.error('Failed to save food option:', error);
      toast.error('Failed to save food option. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns: Column<ExperienceFoodOption>[] = [
    { 
      header: 'Name',
      accessor: 'name'
    },
    { 
      header: 'Description',
      accessor: (food) => food.description || '-'
    },
    {
      header: 'Price',
      accessor: (food) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(food.price)
    },
    { 
      header: 'Max Quantity',
      accessor: (food) => food.max_quantity || 'Unlimited'
    },
    {
      header: 'Type',
      accessor: (food) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            food.is_vegetarian
              ? 'bg-green-100 text-green-800'
              : 'bg-orange-100 text-orange-800'
          }`}
        >
          {food.is_vegetarian ? 'Vegetarian' : 'Non-Vegetarian'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessor: (food) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(food);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              setFoodToDelete(food);
            }}
          >
            Delete
          </Button>
        </div>
      )
    },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFD]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-16">
          <div className="flex items-center gap-8">
            <Button
              variant="secondary"
              onClick={() => router.back()}
              className="bg-white/80 hover:bg-[#fdfbf7] text-[#342e29] px-4 py-2 rounded-full transition-all duration-200"
            >
              <ArrowLeftIcon className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-semibold tracking-tight text-[#342e29]">
                Food Options
              </h1>
              <p className="mt-2 text-lg text-[#51514d]">
                {experience?.title}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleCreate}
            className="bg-[#344736] hover:bg-[#415c43] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Food Option
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-8">
            <DataTable<ExperienceFoodOption>
              columns={columns}
              data={foodOptions}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => !isSaving && setModalOpen(false)}
          maxWidth="2xl"
          title={
            <div className="text-center px-4 pb-6">
              <h2 className="text-3xl font-semibold text-[#342e29] mb-2">
                {selectedFood ? 'Edit Food Option' : 'New Food Option'}
              </h2>
              <p className="text-[#51514d] text-lg">
                {selectedFood ? 'Update food option details' : 'Add a new food option'}
              </p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-12 px-4">
            <div className="space-y-8">
              <div className="bg-[#fdfbf7] rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-[#342e29] mb-8">Food Details</h3>
                
                <div className="space-y-8">
                  <Input
                    label="Name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Enter the food item name"
                  />

                  <Input
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    variant="textarea"
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] h-40 px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Add details about ingredients, preparation, etc."
                  />

                  <Input
                    label="Price"
                    type="number"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Enter price amount"
                  />

                  <Input
                    label="Max Quantity"
                    type="number"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Leave empty for unlimited"
                    helperText="Maximum number of servings available"
                  />

                  <div className="flex items-center gap-3 bg-white/80 rounded-xl p-6 shadow-sm">
                    <input
                      type="checkbox"
                      id="is_vegetarian"
                      checked={formData.is_vegetarian}
                      onChange={(e) => setFormData({ ...formData, is_vegetarian: e.target.checked })}
                      className="h-5 w-5 rounded-md border-[#e7e4df] text-[#344736] focus:ring-[#344736] transition-colors cursor-pointer"
                    />
                    <label
                      htmlFor="is_vegetarian"
                      className="text-sm font-medium text-[#342e29] cursor-pointer select-none"
                    >
                      Vegetarian Option
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
                  disabled={isSaving}
                  className="px-8 py-3 rounded-full text-[#342e29] hover:bg-[#fdfbf7] transition-all duration-200"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  isLoading={isSaving}
                  className="bg-[#344736] hover:bg-[#415c43] text-white px-8 py-3 rounded-full transition-all duration-200"
                >
                  {selectedFood ? 'Update Food Option' : 'Add Food Option'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={!!foodToDelete}
          onClose={() => setFoodToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Food Option"
          description="Are you sure you want to delete this food option? This action cannot be undone."
          confirmText="Delete"
          isDestructive
        />
      </div>
    </div>
  );
} 