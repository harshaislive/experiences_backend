create table public.registrations (
  id uuid not null default extensions.uuid_generate_v4 (),
  user_id uuid null,
  experience_id uuid null,
  total_amount numeric not null,
  transaction_id text null,
  payment_status text null,
  payment_date timestamp with time zone null,
  booking_details jsonb null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  constraint registrations_pkey primary key (id),
  constraint registrations_transaction_id_key unique (transaction_id),
  constraint registrations_experience_id_fkey foreign KEY (experience_id) references experiences (id) on delete CASCADE,
  constraint registrations_user_id_fkey foreign KEY (user_id) references users (id) on delete CASCADE,
  constraint registrations_payment_status_check check (
    (
      payment_status = any (
        array[
          'pending'::text,
          'completed'::text,
          'failed'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_registrations_user on public.registrations using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_registrations_event on public.registrations using btree (experience_id) TABLESPACE pg_default;

create index IF not exists idx_registrations_transaction on public.registrations using btree (transaction_id) TABLESPACE pg_default;

create trigger update_registrations_updated_at BEFORE
update on registrations for EACH row
execute FUNCTION update_updated_at_column ();