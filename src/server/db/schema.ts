/**
 * The database tables as one piece of SQL, so the app can create them itself the first time it runs.
 *
 * This is an exact copy of supabase/schema.sql (the file you can paste into the Supabase SQL Editor).
 * A test (schema.test.ts) fails if the two ever differ.
 */
export const SCHEMA_SQL = `-- FleetDesk database schema (PostgreSQL / Supabase).
--
-- How to use it on Supabase: SQL Editor -> New query -> paste this whole file -> Run.
-- (Or just run "npm run db:setup", which applies this file and adds demo data.)
-- It is safe to run more than once.

-- Needed for the "no overlapping bookings" rule below.
create extension if not exists btree_gist;

create table if not exists vehicles (
  id            text primary key,
  name          text    not null,
  make          text    not null,
  model         text    not null,
  year          integer not null check (year between 1990 and 2100),
  category      text    not null check (category in ('compact', 'sedan', 'suv', 'van', 'luxury')),
  transmission  text    not null check (transmission in ('automatic', 'manual')),
  fuel          text    not null check (fuel in ('petrol', 'diesel', 'hybrid', 'electric')),
  seats         integer not null check (seats between 1 and 15),
  price_per_day integer not null check (price_per_day > 0),
  description   text    not null,
  features      text[]  not null default '{}',
  color         text    not null,
  -- A resized photo (data URL) or empty. For bigger galleries, move photos to Supabase Storage.
  image_url     text    not null default '',
  status        text    not null default 'available' check (status in ('available', 'maintenance')),
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

-- Booking references: FD-1001, FD-1002, ...
create sequence if not exists booking_reference_seq start 1001;

create table if not exists bookings (
  id             text primary key,
  reference      text not null unique,
  -- A vehicle that has bookings can't be deleted (keeps the revenue history correct).
  vehicle_id     text not null references vehicles (id) on delete restrict,
  customer_name  text not null,
  customer_email text not null,
  customer_phone text not null,
  start_date     date not null,
  end_date       date not null,
  total_price    integer not null check (total_price >= 0),
  status         text not null check (status in ('pending', 'confirmed', 'active', 'completed', 'cancelled')),
  payment_status text not null check (payment_status in ('unpaid', 'paid', 'refunded')),
  created_at     timestamptz not null default now(),
  check (end_date > start_date),

  -- THE double-booking guard, enforced by the database itself:
  -- the same vehicle can't have two non-cancelled bookings whose days overlap.
  -- '[)' means the return day is free, so back-to-back bookings are allowed.
  -- Even two customers clicking "Pay" in the same millisecond can't both win.
  constraint bookings_no_overlap exclude using gist (
    vehicle_id with =,
    daterange(start_date, end_date, '[)') with &&
  ) where (status <> 'cancelled')
);

create index if not exists bookings_vehicle_idx on bookings (vehicle_id);
create index if not exists bookings_start_idx   on bookings (start_date);
create index if not exists bookings_status_idx  on bookings (status);

-- One row of business settings.
create table if not exists settings (
  id            integer primary key check (id = 1),
  business_name text not null,
  support_email text not null,
  phone         text not null,
  city          text not null
);

insert into settings (id, business_name, support_email, phone, city)
values (1, 'Summit Rentals', 'hello@summitrentals.example', '+1 (555) 014-2290', 'Austin, TX')
on conflict (id) do nothing;

-- Security: switch on Row Level Security with no policies. The app talks to the database
-- through its own server connection (which is allowed), while Supabase's public "anon" API
-- can't read or change these tables.
alter table vehicles enable row level security;
alter table bookings enable row level security;
alter table settings enable row level security;
`;
