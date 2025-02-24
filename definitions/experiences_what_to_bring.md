create table public.experience_items_to_bring (
  id uuid not null default extensions.uuid_generate_v4 (),
  experience_id uuid not null,
  item text not null,
  is_optional boolean null default false,
  sort_order integer null default 0,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  constraint experience_items_to_bring_pkey primary key (id),
  constraint experience_items_to_bring_experience_id_fkey foreign KEY (experience_id) references experiences (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_experience_items_to_bring_experience_id on public.experience_items_to_bring using btree (experience_id) TABLESPACE pg_default;

create trigger set_updated_at BEFORE
update on experience_items_to_bring for EACH row
execute FUNCTION set_updated_at ();