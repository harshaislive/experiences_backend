create table public.locations (
  id uuid not null default extensions.uuid_generate_v4 (),
  slug text not null,
  name text not null,
  description text null,
  features jsonb null,
  highlights jsonb null,
  is_active boolean null default true,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint locations_pkey primary key (id),
  constraint locations_slug_key unique (slug)
) TABLESPACE pg_default;

create index IF not exists idx_locations_slug on public.locations using btree (slug) TABLESPACE pg_default;

create trigger update_locations_updated_at BEFORE
update on locations for EACH row
execute FUNCTION update_updated_at_column ();