create table public.experience_food_options (
  id uuid not null default extensions.uuid_generate_v4 (),
  experience_id uuid null,
  name text not null,
  description text null,
  price numeric not null,
  max_quantity integer null,
  is_vegetarian boolean null default false,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint event_food_options_pkey primary key (id),
  constraint event_food_options_experience_id_fkey foreign KEY (experience_id) references experiences (id) on delete CASCADE
) TABLESPACE pg_default;