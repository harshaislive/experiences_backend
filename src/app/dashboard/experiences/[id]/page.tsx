'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Experience } from '@/types';
import { ExperiencesService } from '@/services/experiences';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

export default function ExperienceDetailsPage() {
  const params = useParams();
  const id = params.id as string;
  const [experience, setExperience] = useState<Experience | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadExperience = async () => {
      try {
        console.log('Loading experience details for ID:', id);
        setIsLoading(true);
        const data = await ExperiencesService.getById(id);
        console.log('Experience data loaded:', data);
        console.log('Items to bring:', data?.experience_items_to_bring);
        setExperience(data);
      } catch (error) {
        console.error('Failed to load experience:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadExperience();
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" text="Loading experience..." />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fdfbf7] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-semibold text-[#342e29] mb-8">
          {experience?.title}
        </h1>
      </div>
    </div>
  );
}
