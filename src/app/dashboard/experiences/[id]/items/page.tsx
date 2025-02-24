'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Experience, ExperienceItemToBring } from '@/types';
import { ExperiencesService } from '@/services/experiences';
import { updateExperienceItem, createExperienceItem, deleteExperienceItem } from '@/app/actions/experiences';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import {
  PlusIcon,
  ArrowLeftIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

interface ItemFormData {
  item: string;
  is_optional: boolean;
}

const initialFormData: ItemFormData = {
  item: '',
  is_optional: false,
};

export default function ExperienceItemsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [experience, setExperience] = useState<Experience | null>(null);
  const [items, setItems] = useState<ExperienceItemToBring[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedItem, setSelectedItem] = useState<ExperienceItemToBring | null>(null);
  const [itemToDelete, setItemToDelete] = useState<ExperienceItemToBring | null>(null);
  const [formData, setFormData] = useState<ItemFormData>(initialFormData);

  const loadItemsData = async () => {
    try {
      console.log('Loading items data for experience:', id);
      setIsLoading(true);
      const [experienceData, itemsData] = await Promise.all([
        ExperiencesService.getById(id),
        ExperiencesService.itemsToBring.getByExperienceId(id),
      ]);

      console.log('Experience data:', experienceData);
      console.log('Items data:', itemsData);

      if (!experienceData) {
        toast.error('Experience not found');
        router.push('/dashboard/experiences');
        return;
      }

      setExperience(experienceData);
      setItems(itemsData || []);
      console.log('Updated items state:', itemsData || []);
    } catch (error) {
      console.error('Failed to load items data:', error);
      toast.error('Failed to load items data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadItemsData();
  }, [id]);

  const handleCreate = () => {
    setSelectedItem(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const handleEdit = (item: ExperienceItemToBring) => {
    setSelectedItem(item);
    setFormData({
      item: item.item,
      is_optional: item.is_optional,
    });
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!itemToDelete) return;

    try {
      const result = await deleteExperienceItem(itemToDelete.id);
      if (result.success) {
        toast.success('Item deleted successfully');
        loadItemsData();
      } else {
        toast.error(result.error || 'Failed to delete item');
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
      toast.error('Failed to delete item. Please try again.');
    } finally {
      setItemToDelete(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setIsSaving(true);

    try {
      const itemData = {
        experience_id: id,
        item: formData.item,
        is_optional: formData.is_optional,
        sort_order: selectedItem?.sort_order || items.length,
      };

      console.log('Submitting item data:', itemData);

      let result;
      if (selectedItem) {
        const updateData = {
          item: formData.item,
          is_optional: formData.is_optional,
          sort_order: selectedItem.sort_order,
        };
        
        console.log('Updating item:', updateData);
        result = await updateExperienceItem(selectedItem.id, updateData);
      } else {
        console.log('Creating new item:', itemData);
        result = await createExperienceItem(itemData);
      }

      console.log('Save result:', result);

      if (result.success) {
        toast.success(selectedItem ? 'Item updated successfully' : 'Item added successfully');
        setModalOpen(false);
        await loadItemsData();
        console.log('Items reloaded after save');
      } else {
        console.error(selectedItem ? 'Update failed:' : 'Add failed:', result.error);
        toast.error(result.error || `Failed to ${selectedItem ? 'update' : 'add'} item. Please try again.`);
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      toast.error('Failed to save item. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleReorder = async (itemId: string, direction: 'up' | 'down') => {
    const itemIndex = items.findIndex((item) => item.id === itemId);
    if (
      (direction === 'up' && itemIndex === 0) ||
      (direction === 'down' && itemIndex === items.length - 1)
    )
      return;

    const newItems = [...items];
    const item = newItems[itemIndex];
    const swapWith = newItems[direction === 'up' ? itemIndex - 1 : itemIndex + 1];

    try {
      await Promise.all([
        ExperiencesService.itemsToBring.update(item.id, {
          sort_order: swapWith.sort_order,
        }),
        ExperiencesService.itemsToBring.update(swapWith.id, {
          sort_order: item.sort_order,
        }),
      ]);

      await loadItemsData();
      toast.success('Items reordered successfully');
    } catch (error) {
      console.error('Failed to reorder items:', error);
      toast.error('Failed to reorder items. Please try again.');
    }
  };

  const columns = [
    { 
      header: 'Item',
      accessor: 'item' as keyof ExperienceItemToBring
    },
    {
      header: 'Required',
      accessor: (item: ExperienceItemToBring) => (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            item.is_optional
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          {item.is_optional ? 'Optional' : 'Required'}
        </span>
      ),
    },
    {
      header: 'Actions',
      accessor: (item: ExperienceItemToBring) => (
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleReorder(item.id, 'up');
            }}
            disabled={items.indexOf(item) === 0}
          >
            <ArrowUpIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleReorder(item.id, 'down');
            }}
            disabled={items.indexOf(item) === items.length - 1}
          >
            <ArrowDownIcon className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(item);
            }}
          >
            Edit
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={(e) => {
              e.stopPropagation();
              setItemToDelete(item);
            }}
          >
            Delete
          </Button>
        </div>
      ),
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
                Items to Bring
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
            Add Item
          </Button>
        </div>

        {/* Main Content */}
        <div className="p-8">
          <DataTable<ExperienceItemToBring>
            columns={columns}
            data={items}
            isLoading={isLoading}
          />
        </div>

        {/* Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => !isSaving && setModalOpen(false)}
          maxWidth="2xl"
          title={
            <div className="text-center px-4 pb-6">
              <h2 className="text-3xl font-semibold text-[#342e29] mb-2">
                {selectedItem ? 'Edit Item' : 'New Item'}
              </h2>
              <p className="text-[#51514d] text-lg">
                {selectedItem ? 'Update item details' : 'Add a new item to bring'}
              </p>
            </div>
          }
        >
          <form onSubmit={handleSubmit} className="space-y-12 px-4">
            <div className="space-y-8">
              <div className="bg-[#fdfbf7] rounded-2xl p-8">
                <h3 className="text-xl font-semibold text-[#342e29] mb-8">Item Details</h3>
                
                <div className="space-y-8">
                  <Input
                    label="Item Name"
                    value={formData.item}
                    onChange={(e) => setFormData({ ...formData, item: e.target.value })}
                    required
                    className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4 placeholder:text-[#51514d]"
                    placeholder="Enter the item name"
                  />

                  <div className="flex items-center gap-3 bg-white/80 rounded-xl p-6 shadow-sm">
                    <input
                      type="checkbox"
                      id="is_optional"
                      checked={formData.is_optional}
                      onChange={(e) => setFormData({ ...formData, is_optional: e.target.checked })}
                      className="h-5 w-5 rounded-md border-[#e7e4df] text-[#344736] focus:ring-[#344736] transition-colors cursor-pointer"
                    />
                    <label
                      htmlFor="is_optional"
                      className="text-sm font-medium text-[#342e29] cursor-pointer select-none"
                    >
                      Optional Item
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
                  {selectedItem ? 'Update Item' : 'Add Item'}
                </Button>
              </div>
            </div>
          </form>
        </Modal>

        <ConfirmDialog
          isOpen={!!itemToDelete}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleDelete}
          title="Delete Item"
          description="Are you sure you want to delete this item? This action cannot be undone."
          confirmText="Delete"
          isDestructive
        />
      </div>
    </div>
  );
}
