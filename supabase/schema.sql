
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
  image_url     text    not null default '',
  status        text    not null default 'available' check (status in ('available', 'maintenance')),
  featured      boolean not null default false,
  created_at    timestamptz not null default now()
);

create sequence if not exists booking_reference_seq start 1001;

create table if not exists bookings (
  id             text primary key,
  reference      text not null unique,
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

  constraint bookings_no_overlap exclude using gist (
    vehicle_id with =,
    daterange(start_date, end_date, '[)') with &&
  ) where (status <> 'cancelled')
);

create index if not exists bookings_vehicle_idx on bookings (vehicle_id);
create index if not exists bookings_start_idx   on bookings (start_date);
create index if not exists bookings_status_idx  on bookings (status);

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

alter table vehicles enable row level security;
alter table bookings enable row level security;
alter table settings enable row level security;
