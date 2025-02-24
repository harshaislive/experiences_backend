create table public.experiences (
  id uuid not null default extensions.uuid_generate_v4 (),
  location_id uuid null,
  slug text not null,
  title text not null,
  description text null,
  start_date timestamp with time zone not null,
  end_date timestamp with time zone not null,
  total_capacity integer not null,
  current_participants integer null default 0,
  is_featured boolean null default false,
  status text null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint events_pkey primary key (id),
  constraint events_slug_key unique (slug),
  constraint events_location_id_fkey foreign KEY (location_id) references locations (id) on delete CASCADE,
  constraint events_status_check check (
    (
      status = any (
        array[
          'upcoming'::text,
          'ongoing'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_events_slug on public.experiences using btree (slug) TABLESPACE pg_default;

create index IF not exists idx_events_location on public.experiences using btree (location_id) TABLESPACE pg_default;

create index IF not exists idx_events_status on public.experiences using btree (status) TABLESPACE pg_default;

create trigger update_events_updated_at BEFORE
update on experiences for EACH row
execute FUNCTION update_updated_at_column ();