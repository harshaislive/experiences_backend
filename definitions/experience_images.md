create table public.experience_images (
  id uuid not null default extensions.uuid_generate_v4 (),
  experience_id uuid null,
  image_url text not null,
  is_hero boolean null default false,
  "order" integer null,
  alt_text text null,
  created_at timestamp with time zone null default now(),
  constraint event_images_pkey primary key (id),
  constraint event_images_experience_id_fkey foreign KEY (experience_id) references experiences (id) on delete CASCADE
) TABLESPACE pg_default;