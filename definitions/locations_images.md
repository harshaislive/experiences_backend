create table public.location_images (
  id uuid not null default extensions.uuid_generate_v4 (),
  location_id uuid null,
  image_url text not null,
  is_hero boolean null default false,
  "order" integer null,
  alt_text text null,
  created_at timestamp with time zone null default now(),
  constraint location_images_pkey primary key (id),
  constraint location_images_location_id_fkey foreign KEY (location_id) references locations (id) on delete CASCADE
) TABLESPACE pg_default;