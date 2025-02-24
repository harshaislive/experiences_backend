import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Image from 'next/image';
import { Button } from './Button';
import { Input } from './Input';
import { Modal } from './Modal';
import { TrashIcon, ArrowUpIcon, ArrowDownIcon, LinkIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { getServiceClient } from '@/lib/supabase';
import toast from 'react-hot-toast';

interface UploadedImage {
  id?: string;
  url: string;
  file?: File;
  order: number;
  is_hero?: boolean;
  path?: string;
}

interface ImageUploadProps {
  images: UploadedImage[];
  onImagesChange: (images: UploadedImage[]) => void;
  onDelete?: (index: number) => Promise<void>;
  maxFiles?: number;
  maxSize?: number; // in bytes
  accept?: string[];
  allowHeroSelection?: boolean;
  storageBucket?: string;
}

export function ImageUpload({
  images = [],
  onImagesChange,
  onDelete,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB default
  accept = ['image/jpeg', 'image/png', 'image/webp'],
  allowHeroSelection = false,
  storageBucket = 'images_experiences'
}: ImageUploadProps) {
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const uploadToSupabase = async (file: File): Promise<{ path: string; url: string } | null> => {
    try {
      const supabase = getServiceClient();
      if (!supabase) {
        throw new Error('Failed to initialize Supabase client');
      }

      // Log client information
      console.log('Supabase client configuration:', {
        hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
        url: process.env.NEXT_PUBLIC_SUPABASE_URL,
        usingServiceRole: supabase.auth.admin !== undefined,
        storageBucket
      });

      // Validate file
      if (!file || !(file instanceof File)) {
        throw new Error('Invalid file provided');
      }

      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type: ${file.type}. Only JPEG, PNG and WebP images are allowed.`);
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File too large: ${(file.size / 1024 / 1024).toFixed(2)}MB. Maximum size is ${maxSize / 1024 / 1024}MB.`);
      }

      // Generate a clean filename with timestamp and random string
      const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(7);
      const fileName = `${timestamp}-${randomString}.${fileExtension}`;

      // Try to list files in bucket first to verify access
      const { data: listData, error: listError } = await supabase.storage
        .from(storageBucket)
        .list();

      console.log('Storage access check:', {
        canList: !listError,
        error: listError?.message,
        filesFound: listData?.length || 0
      });

      console.log('Attempting to upload file:', {
        originalName: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(2)}MB`,
        destination: fileName,
        bucket: storageBucket
      });

      // Upload the file with explicit content type and cacheControl
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(storageBucket)
        .upload(fileName, file, {
          contentType: file.type,
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        // Log detailed error information
        console.error('Supabase upload error:', {
          message: uploadError.message,
          error: uploadError,
          name: uploadError.name,
          fileName: fileName,
          fileInfo: {
            type: file.type,
            size: file.size,
            name: file.name
          },
          clientInfo: {
            hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
            usingServiceRole: supabase.auth.admin !== undefined
          }
        });
        throw new Error(`Failed to upload file: ${uploadError.message}`);
      }

      if (!uploadData?.path) {
        throw new Error('No path returned from upload');
      }

      // Try to get a signed URL first
      const { data: signedData, error: signedError } = await supabase.storage
        .from(storageBucket)
        .createSignedUrl(uploadData.path, 31536000); // 1 year expiry

      let fileUrl;
      if (signedError || !signedData?.signedUrl) {
        console.log('Falling back to public URL due to signed URL error:', signedError);
        // Fallback to public URL
        const publicUrl = supabase.storage
          .from(storageBucket)
          .getPublicUrl(uploadData.path);
        fileUrl = publicUrl.data.publicUrl;
      } else {
        fileUrl = signedData.signedUrl;
      }

      if (!fileUrl) {
        throw new Error('Failed to get file URL');
      }

      console.log('File uploaded successfully:', {
        path: uploadData.path,
        url: fileUrl
      });

      return {
        path: uploadData.path,
        url: fileUrl
      };
    } catch (error) {
      console.error('Error in uploadToSupabase:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error',
        file: {
          name: file.name,
          type: file.type,
          size: file.size
        },
        environmentInfo: {
          hasSupabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
          hasServiceKey: !!process.env.SUPABASE_SERVICE_KEY,
          bucket: storageBucket
        }
      });
      throw error; // Re-throw to be handled by onDrop
    }
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setError(null);
    setIsUploading(true);
    
    try {
      // Check if adding new files would exceed maxFiles
      if (images.length + acceptedFiles.length > maxFiles) {
        throw new Error(`You can only upload up to ${maxFiles} images`);
      }

      // Upload each file to Supabase and get URLs
      const uploadPromises = acceptedFiles.map(async (file, index) => {
        console.log(`Processing file ${index + 1}/${acceptedFiles.length}:`, file.name);
        
        try {
          const result = await uploadToSupabase(file);
          if (!result) {
            throw new Error(`Failed to upload ${file.name}`);
          }

          return {
            url: result.url,
            path: result.path,
            order: images.length + index,
            is_hero: images.length === 0 && index === 0 // Make first image hero if no images exist
          };
        } catch (uploadError) {
          console.error(`Error uploading file ${file.name}:`, uploadError);
          throw uploadError; // Re-throw to be caught by the Promise.all
        }
      });

      const uploadedImages = await Promise.all(uploadPromises);
      console.log('All files uploaded successfully:', uploadedImages);
      
      onImagesChange([...images, ...uploadedImages]);
      toast.success('Images uploaded successfully');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to upload images';
      console.error('Upload process error:', {
        error: error instanceof Error ? {
          name: error.name,
          message: error.message,
          stack: error.stack
        } : 'Unknown error',
        details: error
      });
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsUploading(false);
    }
  }, [images, maxFiles, onImagesChange, storageBucket]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: accept.reduce((acc, curr) => ({ ...acc, [curr]: [] }), {}),
    maxSize,
    multiple: true,
    disabled: isUploading
  });

  const getImageUrl = (url: string) => {
    // If it's already a full URL (signed or public), use it directly
    if (url.startsWith('http')) {
      return url;
    }

    // If it's a relative path, use the storage URL
    if (process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL) {
      return `${process.env.NEXT_PUBLIC_SUPABASE_STORAGE_URL}/${storageBucket}/${url.replace(/^\/+/, '')}`;
    }

    // If all else fails, return the original URL
    return url;
  };

  const handleDelete = async (index: number) => {
    if (isDeleting) return;

    try {
      setIsDeleting(true);
      if (onDelete) {
        await onDelete(index);
      } else {
        const newImages = images.filter((_, i) => i !== index);
        // Reorder remaining images
        newImages.forEach((img, i) => {
          img.order = i;
        });
        onImagesChange(newImages);
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const moveImage = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === images.length - 1)
    ) {
      return;
    }

    const newImages = [...images];
    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    
    // Swap orders
    const tempOrder = newImages[index].order;
    newImages[index].order = newImages[swapIndex].order;
    newImages[swapIndex].order = tempOrder;
    
    // Swap positions in array
    [newImages[index], newImages[swapIndex]] = [newImages[swapIndex], newImages[index]];
    
    onImagesChange(newImages);
  };

  const handleHeroSelect = (index: number) => {
    const newImages = images.map((img, i) => ({
      ...img,
      is_hero: i === index
    }));
    onImagesChange(newImages);
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPreviewError(null);
    setIsPreviewLoading(true);

    try {
      // Validate URL
      if (!urlInput.startsWith('http')) {
        throw new Error('Please enter a valid URL starting with http:// or https://');
      }

      // Check if it's a Supabase URL
      if (!urlInput.includes(process.env.NEXT_PUBLIC_SUPABASE_URL || '')) {
        throw new Error('Please enter a valid Supabase storage URL');
      }

      // Add the new image
      const newImage = {
        url: urlInput,
        order: images.length,
        is_hero: images.length === 0 // Make it hero if it's the first image
      };

      onImagesChange([...images, newImage]);
      setUrlInput('');
      setShowUrlModal(false);
    } catch (error) {
      setPreviewError(error instanceof Error ? error.message : 'Failed to add image URL');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-4 mb-4">
        <div
          {...getRootProps()}
          className={`flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
            ${isDragActive ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400'}
            ${isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <input {...getInputProps()} />
          {isUploading ? (
            <div className="flex flex-col items-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
              <p className="text-gray-600 mt-2">Uploading images...</p>
            </div>
          ) : isDragActive ? (
            <p className="text-indigo-600">Drop the files here...</p>
          ) : (
            <div className="flex flex-col items-center">
              <PhotoIcon className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-gray-600">Drag and drop images here, or click to select files</p>
              <p className="text-sm text-gray-500 mt-1">
                Accepted formats: {accept.join(', ')} (Max {maxSize / 1024 / 1024}MB per file)
              </p>
            </div>
          )}
        </div>
        <Button
          onClick={() => setShowUrlModal(true)}
          className="flex items-center gap-2 whitespace-nowrap"
          variant="secondary"
          disabled={isUploading}
        >
          <LinkIcon className="h-5 w-5" />
          Add from URL
        </Button>
      </div>

      {error && (
        <p className="text-red-500 text-sm">{error}</p>
      )}

      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <div key={image.id || `new-image-${index}`} className="relative group">
              <div className="aspect-square relative rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={getImageUrl(image.url)}
                  alt={`Uploaded image ${index + 1}`}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity flex items-center justify-center opacity-0 group-hover:opacity-100">
                <div className="flex gap-1">
                  {allowHeroSelection && (
                    <Button
                      size="sm"
                      variant={image.is_hero ? "primary" : "secondary"}
                      onClick={() => handleHeroSelect(index)}
                      title={image.is_hero ? "Hero Image" : "Set as Hero"}
                    >
                      {image.is_hero ? "★" : "☆"}
                    </Button>
                  )}
                  {index > 0 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(index, 'up')}
                      title="Move up"
                    >
                      <ArrowUpIcon className="h-4 w-4" />
                    </Button>
                  )}
                  {index < images.length - 1 && (
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => moveImage(index, 'down')}
                      title="Move down"
                    >
                      <ArrowDownIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => handleDelete(index)}
                    title="Delete image"
                    isLoading={isDeleting}
                    disabled={isDeleting}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                {image.is_hero && <span className="text-yellow-400">★</span>}
                {index + 1}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal
        isOpen={showUrlModal}
        onClose={() => {
          setShowUrlModal(false);
          setUrlInput('');
          setPreviewError(null);
        }}
        title={
          <div className="text-center px-4 pb-6">
            <h2 className="text-3xl font-semibold text-[#342e29] mb-2">
              Add Image from URL
            </h2>
            <p className="text-[#51514d] text-lg">
              Paste a Supabase storage URL
            </p>
          </div>
        }
      >
        <form onSubmit={handleUrlSubmit} className="space-y-8 px-4">
          <div className="space-y-4">
            <Input
              label="Image URL"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                setPreviewError(null);
              }}
              placeholder="https://your-project.supabase.co/storage/v1/object/..."
              required
              className="rounded-xl border-[#e7e4df] focus:ring-[#344736] px-5 py-4"
            />
            {previewError && (
              <p className="text-red-500 text-sm">{previewError}</p>
            )}
            {urlInput && !previewError && (
              <div className="aspect-video relative rounded-lg overflow-hidden border border-gray-200">
                <Image
                  src={urlInput}
                  alt="URL preview"
                  fill
                  className="object-cover"
                  onError={() => setPreviewError('Failed to load image preview')}
                />
              </div>
            )}
          </div>

          <div className="flex justify-end gap-4 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowUrlModal(false);
                setUrlInput('');
                setPreviewError(null);
              }}
              className="px-8 py-3 rounded-full"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={isPreviewLoading}
              disabled={!urlInput || !!previewError}
              className="bg-[#344736] hover:bg-[#415c43] text-white px-8 py-3 rounded-full"
            >
              Add Image
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
} 