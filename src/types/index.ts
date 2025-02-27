export interface Location {
  id: string;
  slug: string;
  name: string;
  description: string;
  features: Record<string, boolean>;
  highlights: Record<string, string>;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface LocationImage {
  id: string;
  location_id: string;
  image_url: string;
  is_hero: boolean;
  order?: number;
  alt_text?: string;
  created_at?: string;
}

export type ExperienceStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';

export interface Experience {
  id: string;
  location_id: string;
  slug: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  total_capacity: number;
  current_participants: number;
  is_featured: boolean;
  status: ExperienceStatus;
  features: Record<string, boolean>;
  highlights: Record<string, string>;
  created_at?: string;
  updated_at?: string;
  experience_images?: ExperienceImage[];
}

export type PricingCategory = 'adult_member' | 'adult_non_member' | 'child_member' | 'child_non_member' | 'camping_gear';

export interface ExperiencePricing {
  id: string;
  experience_id: string;
  category: PricingCategory;
  price: number;
  description?: string;
  max_quantity?: number;
  created_at?: string;
  updated_at?: string;
}

export interface ExperienceItemToBring {
  id: string;
  experience_id: string;
  item: string;
  is_optional: boolean;
  sort_order?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Registration {
  id: string;
  user_id: string;
  experience_id: string;
  total_amount: number;
  transaction_id?: string;
  payment_status: 'pending' | 'completed' | 'failed';
  payment_date?: string;
  booking_details?: BookingDetails;
  created_at: string;
  updated_at: string;
}

export interface ExperienceImage {
  id: string;
  experience_id: string;
  image_url: string;
  is_hero: boolean;
  order: number;
  alt_text?: string;
  created_at: string;
}

export type FoodOptionType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export interface ExperienceFoodOption {
  id: string;
  experience_id: string;
  name: string;
  description?: string;
  price: number;
  max_quantity?: number;
  is_vegetarian: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BookingDetails {
  participants: number;
  special_requests?: string;
  arrival_time?: string;
  dietary_restrictions?: string[];
  accommodation_preference?: string;
}

export type Database = {
  public: {
    Tables: {
      locations: {
        Row: Location;
        Insert: Omit<Location, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Location, 'id' | 'created_at' | 'updated_at'>>;
      };
      location_images: {
        Row: LocationImage;
        Insert: Omit<LocationImage, 'id' | 'created_at'>;
        Update: Partial<Omit<LocationImage, 'id' | 'created_at'>>;
      };
      experiences: {
        Row: Experience;
        Insert: Omit<Experience, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Experience, 'id' | 'created_at' | 'updated_at'>>;
      };
      experience_pricing: {
        Row: ExperiencePricing;
        Insert: Omit<ExperiencePricing, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ExperiencePricing, 'id' | 'created_at' | 'updated_at'>>;
      };
      experience_items_to_bring: {
        Row: ExperienceItemToBring;
        Insert: Omit<ExperienceItemToBring, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ExperienceItemToBring, 'id' | 'created_at' | 'updated_at'>>;
      };
      experience_food_options: {
        Row: ExperienceFoodOption;
        Insert: Omit<ExperienceFoodOption, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<ExperienceFoodOption, 'id' | 'created_at' | 'updated_at'>>;
      };
      registrations: {
        Row: Registration;
        Insert: Omit<Registration, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Registration, 'id' | 'created_at' | 'updated_at'>>;
      };
      experience_images: {
        Row: ExperienceImage;
        Insert: Omit<ExperienceImage, 'id' | 'created_at'>;
        Update: Partial<Omit<ExperienceImage, 'id' | 'created_at'>>;
      };
    };
  };
};
