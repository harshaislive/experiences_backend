'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Experience, ExperiencePricing, PricingCategory } from '@/types';
import { ExperiencesService } from '@/services/experiences';
import { updateExperiencePricing, createExperiencePricing, deleteExperiencePricing } from '@/app/actions/experiences';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { PlusIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface PricingFormData {
  category: PricingCategory;
  price: string;
  description: string;
  max_quantity: string;
}

const initialFormData: PricingFormData = {
  category: 'adult',
  price: '',
  description: '',
  max_quantity: '',
};

export default function ExperiencePricingPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [experience, setExperience] = useState<Experience | null>(null);
  const [prices, setPrices] = useState<ExperiencePricing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedPrice, setSelectedPrice] = useState<ExperiencePricing | null>(null);
  const [priceToDelete, setPriceToDelete] = useState<ExperiencePricing | null>(null);
  const [formData, setFormData] = useState<PricingFormData>(initialFormData);

  const loadPricingData = async () => {
    try {
      setIsLoading(true);
      const [experienceData, pricingData] = await Promise.all([
        ExperiencesService.getById(id),
        ExperiencesService.pricing.getByExperienceId(id),
      ]);

      if (!experienceData) {
        toast.error('Experience not found');
        router.push('/dashboard/experiences');
        return;
      }

      setExperience(experienceData);
      setPrices(pricingData || []);
    } catch (error) {
      console.error('Failed to load pricing data:', error);
      toast.error('Failed to load pricing data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPricingData();
  }, [id]);

  const handleCreate = () => {
    setSelectedPrice(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleEdit = (price: ExperiencePricing) => {
    setSelectedPrice(price);
    setFormData({
      category: price.category,
      price: price.price.toString(),
      description: price.description || '',
      max_quantity: price.max_quantity?.toString() || '',
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!priceToDelete) return;

    try {
      await deleteExperiencePricing(priceToDelete.id);
      toast.success('Price option deleted successfully');
      loadPricingData();
    } catch (error) {
      console.error('Failed to delete price option:', error);
      toast.error('Failed to delete price option. Please try again.');
    } finally {
      setPriceToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);

    try {
      if (selectedPrice) {
        console.log('Updating price option with ID:', selectedPrice.id);
        const updateData = {
          category: formData.category,
          price: parseFloat(formData.price),
          description: formData.description || undefined,
          max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : undefined,
        };
        
        console.log('Update data:', updateData);
        const result = await updateExperiencePricing(selectedPrice.id, updateData);
        console.log('Update result:', result);
        
        if (result.success) {
          toast.success('Price option updated successfully');
          setModalOpen(false);
          await loadPricingData();
        } else {
          console.error('Update failed:', result.error);
          toast.error(result.error || 'Failed to update price option. Please try again.');
        }
      } else {
        const priceData = {
          experience_id: id,
          category: formData.category,
          price: parseFloat(formData.price),
          description: formData.description || undefined,
          max_quantity: formData.max_quantity ? parseInt(formData.max_quantity) : undefined,
        };

        console.log('Adding new price option:', priceData);
        const result = await createExperiencePricing(priceData);
        console.log('Add result:', result);
        
        if (result.success) {
          toast.success('Price option added successfully');
          setModalOpen(false);
          await loadPricingData();
        } else {
          console.error('Add failed:', result.error);
          toast.error(result.error || 'Failed to add price option. Please try again.');
        }
      }
    } catch (error) {
      console.error('Failed to save price option:', error);
      toast.error('Failed to save price option. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const columns = [
    { 
      header: 'Category',
      accessor: (price: ExperiencePricing) => 
        price.category.replace(/([A-Z])/g, ' $1').trim()
    },
    { 
      header: 'Price',
      accessor: (price: ExperiencePricing) =>
        new Intl.NumberFormat('en-IN', {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: 0
        }).format(price.price)
    },
    { 
      header: 'Description', 
      accessor: (price: ExperiencePricing) => price.description || '-'
    },
    { 
      header: 'Max Quantity',
      accessor: (price: ExperiencePricing) => price.max_quantity || 'Unlimited'
    },
    {
      header: 'Actions',
      accessor: (price: ExperiencePricing) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(price);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              setPriceToDelete(price);
            }}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  const pricingCategories: { value: PricingCategory; label: string }[] = [
    { value: 'adult', label: 'Adult' },
    { value: 'child', label: 'Child' },
    { value: 'camping_gear', label: 'Camping Gear' },
    { value: 'Member Adult', label: 'Member Adult' },
    { value: 'Member Kid', label: 'Member Kid' },
    { value: 'Non-Member Adult', label: 'Non-Member Adult' },
    { value: 'Non-Member Kid', label: 'Non-Member Kid' },
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
                Pricing
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
            Add Price Option
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-8">
            <DataTable<ExperiencePricing>
              columns={columns}
              data={prices}
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
                {selectedPrice ? 'Edit Price Option' : 'New Price Option'}
              </h2>
              <p className="text-[#51514d] text-lg">
                {selectedPrice ? 'Update pricing details' : 'Create a new pricing option'}
              </p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-12 px-4">
            <div className="space-y-8">
              <div className="bg-[#fdfbf7] rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-[#342e29] mb-8">Price Details</h3>
                
                <div className="space-y-8">
                  <div>
                    <label className="block text-sm font-medium text-[#342e29] mb-2">
                      Category
                    </label>
                    <select
                      className="w-full rounded-xl border-0 py-4 px-5 text-[#342e29] shadow-sm ring-1 ring-inset ring-[#e7e4df] focus:ring-2 focus:ring-inset focus:ring-[#344736] transition-all duration-200"
                      value={formData.category}
                      onChange={(e) =>
                        setFormData({ ...formData, category: e.target.value as PricingCategory })
                      }
                      required
                    >
                      <option value="" className="text-[#51514d]">Select Category</option>
                      {pricingCategories.map((category) => (
                        <option key={category.value} value={category.value}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>

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
                    label="Description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Add a description for this price option"
                  />

                  <Input
                    label="Max Quantity"
                    type="number"
                    value={formData.max_quantity}
                    onChange={(e) => setFormData({ ...formData, max_quantity: e.target.value })}
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Leave empty for unlimited"
                    helperText="Maximum number of tickets available at this price"
                  />
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
                  {selectedPrice ? 'Update Price' : 'Add Price'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={!!priceToDelete}
          onClose={() => setPriceToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Price Option"
          description="Are you sure you want to delete this price option? This action cannot be undone."
          confirmText="Delete"
          isDestructive
        />
      </div>
    </div>
  );
}
