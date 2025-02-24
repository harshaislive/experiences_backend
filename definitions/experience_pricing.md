create table public.experience_pricing (
  id uuid not null default extensions.uuid_generate_v4 (),
  experience_id uuid null,
  category text null,
  price numeric not null,
  description text null,
  max_quantity integer null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint event_pricing_pkey primary key (id),
  constraint event_pricing_experience_id_fkey foreign KEY (experience_id) references experiences (id) on delete CASCADE,
  constraint event_pricing_category_check check (
    (
      category = any (
        array[
          'adult'::text,
          'child'::text,
          'camping_gear'::text,
          'Member Adult'::text,
          'Member Kid'::text,
          'Non-Member Adult'::text,
          'Non-Member Kid'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;