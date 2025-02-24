create table public.experience_itinerary (
  id uuid not null default extensions.uuid_generate_v4 (),
  experience_id uuid null,
  time time without time zone not null,
  activity text not null,
  description text null,
  duration interval null,
  "order" integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint event_itinerary_pkey primary key (id),
  constraint event_itinerary_experience_id_fkey foreign KEY (experience_id) references experiences (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_event_itinerary_event on public.experience_itinerary using btree (experience_id) TABLESPACE pg_default;