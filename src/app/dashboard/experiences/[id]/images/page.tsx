'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Experience, ExperienceImage } from '@/types';
import { ExperiencesService } from '@/services/experiences';
import { uploadExperienceImage, addExperienceImage, deleteExperienceImage, updateExperienceImage } from '@/app/actions/experiences';
import { Button } from '@/components/ui/Button';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getServiceClient } from '@/lib/supabase';

export default function ExperienceImagesPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [experience, setExperience] = useState<Experience | null>(null);
  const [images, setImages] = useState<Array<{ id?: string; url: string; file?: File; order: number; is_hero?: boolean; path?: string }>>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [experienceData, setExperienceData] = useState<Experience | null>(null);

  const loadImagesData = async () => {
    try {
      setIsLoading(true);
      const data = await ExperiencesService.getById(id);

      if (!data) {
        toast.error('Experience not found');
        router.push('/dashboard/experiences');
        return;
      }

      setExperienceData(data);
      setExperience(data);
      if (data.experience_images) {
        const supabase = getServiceClient();
        console.log('Loading images:', data.experience_images);
        
        const signedImages = await Promise.all(
          data.experience_images
            .filter((img: { id: string; image_url: string; order: number; is_hero: boolean }) => img.image_url)
            .map(async (img: { id: string; image_url: string; order: number; is_hero: boolean }) => {
              try {
                console.log('Processing image:', {
                  id: img.id,
                  original_url: img.image_url,
                  order: img.order,
                  is_hero: img.is_hero
                });

                // If it's already a signed URL with token, use it directly
                if (img.image_url.includes('?token=')) {
                  console.log('Using existing signed URL:', img.image_url);
                  return {
                    id: img.id,
                    url: img.image_url,
                    order: img.order,
                    is_hero: img.is_hero,
                    path: img.image_url
                  };
                }

                // First, try to list files to verify the path exists
                let imagePath = img.image_url;
                
                // Clean up the path
                imagePath = img.image_url
                  .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(public|sign)\//, '') // Remove storage URL prefix
                  .replace(/^images_experiences\//, '') // Remove bucket prefix
                  .replace(/^\/+/, '') // Remove leading slashes
                  .split('?')[0]; // Remove query parameters

                console.log('Attempting to use path:', imagePath);

                // Try to get a public URL first
                const publicUrl = supabase.storage
                  .from('images_experiences')
                  .getPublicUrl(imagePath);

                console.log('Public URL result:', publicUrl);

                // Then try to get a signed URL
                const { data: signedData, error: signedError } = await supabase.storage
                  .from('images_experiences')
                  .createSignedUrl(imagePath, 31536000); // 1 year in seconds

                if (signedError) {
                  console.error('Error getting signed URL:', {
                    error: signedError,
                    path: imagePath,
                    originalUrl: img.image_url
                  });

                  // If signed URL fails, use public URL as fallback
                  return {
                    id: img.id,
                    url: publicUrl.data.publicUrl,
                    order: img.order,
                    is_hero: img.is_hero,
                    path: imagePath
                  };
                }

                console.log('Successfully got signed URL:', {
                  path: imagePath,
                  signedUrl: signedData.signedUrl
                });

                return {
                  id: img.id,
                  url: signedData.signedUrl,
                  order: img.order,
                  is_hero: img.is_hero,
                  path: imagePath
                };
              } catch (error) {
                console.error('Error processing image:', {
                  error,
                  image: img,
                  stack: error instanceof Error ? error.stack : undefined
                });

                // Return with public URL as fallback
                const fallbackPath = img.image_url
                  .replace(/^https?:\/\/[^/]+\/storage\/v1\/object\/(public|sign)\//, '')
                  .replace(/^images_experiences\//, '')
                  .replace(/^\/+/, '')
                  .split('?')[0];

                const publicUrl = supabase.storage
                  .from('images_experiences')
                  .getPublicUrl(fallbackPath);
                
                return {
                  id: img.id,
                  url: publicUrl.data.publicUrl,
                  order: img.order,
                  is_hero: img.is_hero,
                  path: fallbackPath
                };
              }
            })
        );

        // Filter out any null values and sort by order
        const validImages = signedImages
          .filter(img => img !== null)
          .sort((a, b) => (a?.order || 0) - (b?.order || 0));
        
        console.log('Final processed images:', validImages);
        setImages(validImages);
      }
    } catch (error) {
      console.error('Failed to load images data:', error);
      toast.error('Failed to load images data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadImagesData();
  }, [id]);

  const handleImagesChange = async (newImages: Array<{ id?: string; url: string; file?: File; order: number; is_hero?: boolean; path?: string }>) => {
    console.log('Images changed:', newImages.map(img => ({
      id: img.id,
      hasFile: !!img.file,
      fileName: img.file?.name,
      url: img.url,
      order: img.order,
      is_hero: img.is_hero
    })));
    
    // Ensure all new images (ones without IDs) have their file property set
    const processedImages = newImages.map(img => {
      if (!img.id && !img.file && img.url.startsWith('blob:')) {
        // This is a new image from file upload but file property might be missing
        return {
          ...img,
          file: new File([img.url], 'image.jpg', { type: 'image/jpeg' })
        };
      }
      return img;
    });

    console.log('Processed images:', processedImages.map(img => ({
      id: img.id,
      hasFile: !!img.file,
      fileName: img.file?.name,
      url: img.url,
      order: img.order,
      is_hero: img.is_hero
    })));

    setImages(processedImages);
  };

  const handleDeleteImage = async (index: number) => {
    const image = images[index];
    if (!image.id) {
      // Remove local image
      const newImages = images.filter((_, i) => i !== index);
      newImages.forEach((img, i) => {
        img.order = i;
      });
      setImages(newImages);
      return;
    }

    try {
      // Get the original path from the database
      const experienceData = await ExperiencesService.getById(id);
      const originalImage = experienceData.experience_images.find((img: { id: string; image_url: string }) => img.id === image.id);
      if (!originalImage) {
        throw new Error('Original image not found');
      }

      // Delete the image
      const result = await deleteExperienceImage(image.id, originalImage.image_url);
      if (!result.success) {
        throw new Error(result.error);
      }
      toast.success('Image deleted successfully');
      
      // Remove the deleted image from the state
      const newImages = images.filter((_, i) => i !== index);
      newImages.forEach((img, i) => {
        img.order = i;
      });
      setImages(newImages);
    } catch (error) {
      console.error('Failed to delete image:', error);
      toast.error('Failed to delete image');
    }
  };

  const handleSave = async () => {
    setIsUploading(true);
    const newImages = images.filter(img => !img.id);
    const changedExistingImages = images.filter(img => 
      img.id && experienceData?.experience_images?.find((dbImg: ExperienceImage) => 
        dbImg.id === img.id && dbImg.is_hero !== img.is_hero
      )
    );

    console.log('New images to upload:', newImages.length);
    console.log('Existing images with changes:', changedExistingImages.length);

    if (newImages.length === 0 && changedExistingImages.length === 0) {
      toast.error('No changes to save');
      setIsUploading(false);
      return;
    }

    try {
      // First update existing images if hero status changed
      for (const image of changedExistingImages) {
        if (!image.id) continue; // Skip if no ID
        console.log('Updating hero status for image:', image.id);
        const updateResult = await updateExperienceImage(image.id, {
          is_hero: !!image.is_hero
        });
        
        if (!updateResult.success) {
          console.error('Failed to update image:', updateResult.error);
          toast.error(`Failed to update image: ${updateResult.error}`);
        }
      }

      // Then process new images
      for (const [index, image] of newImages.entries()) {
        // Create a file from the image URL if needed
        let fileToUpload = image.file;
        if (!fileToUpload && image.url) {
          try {
            const response = await fetch(image.url);
            const blob = await response.blob();
            fileToUpload = new File([blob], 'image.jpg', { type: blob.type });
          } catch (error) {
            console.error('Failed to create file from URL:', error);
            continue;
          }
        }

        if (!fileToUpload) {
          console.error('No file found for image:', image);
          continue;
        }

        console.log(`Processing image ${index + 1}/${newImages.length}:`, {
          fileName: fileToUpload.name,
          size: fileToUpload.size,
          type: fileToUpload.type,
          isHero: image.is_hero
        });

        // Generate a clean filename
        const fileExtension = fileToUpload.name.split('.').pop()?.toLowerCase() || 'jpg';
        const timestamp = Date.now();
        const randomString = Math.random().toString(36).substring(7);
        const fileName = `${id}/${timestamp}-${randomString}.${fileExtension}`;

        // Upload to storage
        const uploadResult = await uploadExperienceImage(fileToUpload, fileName);
        console.log('Upload result:', {
          success: uploadResult.success,
          data: uploadResult.data,
          error: uploadResult.error,
          fileName: fileName
        });

        if (!uploadResult.success || !uploadResult.data) {
          console.error('Upload failed:', uploadResult.error);
          toast.error(`Failed to upload ${fileToUpload.name}: ${uploadResult.error}`);
          continue;
        }

        // Log the URL we're about to use
        console.log('URL to be stored in database:', {
          publicUrl: uploadResult.data.publicUrl,
          path: uploadResult.data.path
        });

        // Add to database with correct order and public URL
        const imageRecord = {
          experience_id: id,
          image_url: uploadResult.data.publicUrl,
          is_hero: !!image.is_hero,
          order: image.order || 0,
          alt_text: ''
        };

        console.log('Adding image record to database:', {
          ...imageRecord,
          fileInfo: {
            name: fileToUpload.name,
            size: fileToUpload.size,
            type: fileToUpload.type
          }
        });

        const addResult = await addExperienceImage(imageRecord);
        console.log('Database add result:', {
          success: addResult.success,
          data: addResult.data,
          error: addResult.error
        });

        if (!addResult.success) {
          console.error('Failed to add image to database:', addResult.error);
          toast.error(`Failed to save ${fileToUpload.name} to database: ${addResult.error}`);
          continue;
        }
      }

      // Reload images after all processing is done
      await loadImagesData();
      toast.success('Images updated successfully');
    } catch (error) {
      console.error('Error in handleSave:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to save images');
    } finally {
      setIsUploading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#FBFBFD] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0071E3] mx-auto"></div>
          <p className="mt-4 text-[#86868B]">Loading...</p>
        </div>
      </div>
    );
  }

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
                Images
              </h1>
              <p className="mt-2 text-lg text-[#51514d]">
                {experience?.title}
              </p>
            </div>
          </div>
          <Button 
            onClick={handleSave}
            isLoading={isUploading}
            disabled={!images.some(img => !img.id || (
              img.id && experienceData?.experience_images?.find((dbImg: ExperienceImage) => 
                dbImg.id === img.id && dbImg.is_hero !== img.is_hero
              )
            ))}
            className="bg-[#344736] hover:bg-[#415c43] text-white px-6 py-2.5 rounded-full text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
          >
            Save Changes
          </Button>
        </div>

        {/* Main Content */}
        <div className="bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_2px_20px_rgba(0,0,0,0.04)] overflow-hidden">
          <div className="p-8">
            <div className="bg-[#fdfbf7] rounded-2xl p-8">
              <ImageUpload
                images={images}
                onImagesChange={handleImagesChange}
                onDelete={handleDeleteImage}
                maxFiles={10}
                maxSize={5 * 1024 * 1024} // 5MB
                allowHeroSelection={true}
              />
              <p className="mt-4 text-sm text-[#51514d]">
                Upload high-quality images that showcase your experience. Select a hero image that will be featured prominently.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 