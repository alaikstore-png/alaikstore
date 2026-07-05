-- =========================================================
-- Alaikstore — Supabase Schema
-- Run this in the Supabase SQL editor (or via `supabase db push`)
-- =========================================================

create extension if not exists "uuid-ossp";

-- ---------- USERS ----------
-- Mirrors auth.users with app-specific profile fields.
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  role text not null default 'user' check (role in ('user','admin')),
  balance numeric(14,2) not null default 0,
  referral_code text unique,
  referred_by text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- CATEGORIES ----------
create table if not exists public.categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  icon text,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- ---------- GAMES ----------
create table if not exists public.games (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  slug text unique not null,
  publisher text,
  banner_url text,
  thumbnail_url text,
  is_hot boolean default false,
  needs_server_id boolean default false,
  is_active boolean default true,
  sort_order int default 0,
  created_at timestamptz not null default now()
);

-- ---------- PROVIDERS ----------
create table if not exists public.providers (
  id uuid primary key default uuid_generate_v4(),
  name text not null unique check (name in ('VIP Reseller','Digiflazz','APIGames','Tokovoucher','MedanPedia')),
  base_url text,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- ---------- PRODUCTS (denominations / SKUs per game) ----------
create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid references public.games(id) on delete cascade,
  provider_id uuid references public.providers(id) on delete set null,
  sku_code text,                 -- code sent to top-up provider
  name text not null,            -- e.g. "86 Diamonds"
  base_price numeric(14,2) not null,   -- cost price from provider
  sell_price numeric(14,2) not null,   -- price shown to customer
  margin numeric(14,2) generated always as (sell_price - base_price) stored,
  discount_price numeric(14,2),
  is_popular boolean default false,
  stock_status text default 'available' check (stock_status in ('available','empty')),
  is_active boolean default true,
  created_at timestamptz not null default now(),
  unique (game_id, sku_code)
);

-- ---------- BANNERS ----------
create table if not exists public.banners (
  id uuid primary key default uuid_generate_v4(),
  title text,
  subtitle text,
  image_url text not null,
  link_url text,
  sort_order int default 0,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- ---------- PROMOS / VOUCHERS ----------
create table if not exists public.promos (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null,
  description text,
  discount_type text not null check (discount_type in ('percent','fixed')),
  discount_value numeric(14,2) not null,
  min_purchase numeric(14,2) default 0,
  max_discount numeric(14,2),
  usage_limit int,
  used_count int default 0,
  expires_at timestamptz,
  is_active boolean default true,
  created_at timestamptz not null default now()
);

-- ---------- ORDERS ----------
create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  product_id uuid references public.products(id),
  product_slug text,               -- denormalized for quick display
  denomination text,
  user_game_id text not null,
  server_id text,
  amount numeric(14,2) not null,
  promo_code text,
  discount_amount numeric(14,2) default 0,
  payment_method text not null,
  payment_gateway text check (payment_gateway in ('tripay','midtrans','xendit','duitku')),
  provider_name text check (provider_name in ('VIP Reseller','Digiflazz','APIGames','Tokovoucher','MedanPedia')),
  provider_ref text,               -- reference id returned by top-up provider
  status text not null default 'pending' check (status in ('pending','paid','processing','success','failed','expired')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------- PAYMENTS (gateway transaction records) ----------
create table if not exists public.payments (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade,
  gateway text not null check (gateway in ('tripay','midtrans','xendit','duitku')),
  gateway_ref text,                -- transaction/reference id from gateway
  method text not null,
  amount numeric(14,2) not null,
  fee numeric(14,2) default 0,
  qr_url text,
  va_number text,
  status text not null default 'pending' check (status in ('pending','paid','failed','expired')),
  paid_at timestamptz,
  raw_callback jsonb,
  created_at timestamptz not null default now()
);

-- ---------- SETTINGS (key/value app config) ----------
create table if not exists public.settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------- LOGS (audit / webhook / error logs) ----------
create table if not exists public.logs (
  id uuid primary key default uuid_generate_v4(),
  type text not null,              -- e.g. 'payment_callback', 'provider_callback', 'admin_action'
  message text,
  payload jsonb,
  created_at timestamptz not null default now()
);

-- ---------- WISHLISTS ----------
create table if not exists public.wishlists (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  game_id uuid not null references public.games(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, game_id)
);

-- =========================================================
-- TRIGGERS
-- =========================================================

-- Auto-create a public.users row whenever someone signs up via Supabase Auth
-- (email/password OR Google OAuth — Google populates full_name/avatar_url under
-- slightly different keys depending on the flow, hence the coalesce fallbacks).
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, phone, referral_code, referred_by, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    'ALAIK-' || upper(substring(new.id::text, 1, 6)),
    nullif(new.raw_user_meta_data->>'referred_by', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Atomically increments a user's balance (used for deposits & referral bonuses).
-- security definer + fixed search_path so it can be safely called from edge
-- functions with the service role, bypassing RLS in a controlled, single-purpose way.
create or replace function public.increment_balance(uid uuid, amount numeric)
returns void as $$
begin
  update public.users set balance = balance + amount, updated_at = now() where id = uid;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Keep updated_at fresh on orders
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists orders_set_updated_at on public.orders;
create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.games enable row level security;
alter table public.products enable row level security;
alter table public.providers enable row level security;
alter table public.banners enable row level security;
alter table public.promos enable row level security;
alter table public.orders enable row level security;
alter table public.payments enable row level security;
alter table public.settings enable row level security;
alter table public.logs enable row level security;
alter table public.wishlists enable row level security;

-- Helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean as $$
  select exists (
    select 1 from public.users where id = auth.uid() and role = 'admin'
  );
$$ language sql stable security definer;

-- USERS: users can read/update their own row; admins can read/update all
create policy "users_select_own_or_admin" on public.users
  for select using (auth.uid() = id or public.is_admin());
create policy "users_update_own_or_admin" on public.users
  for update using (auth.uid() = id or public.is_admin());

-- PUBLIC READ tables: catalog data anyone can browse
create policy "categories_public_read" on public.categories for select using (true);
create policy "games_public_read" on public.games for select using (is_active = true or public.is_admin());
create policy "products_public_read" on public.products for select using (is_active = true or public.is_admin());
create policy "banners_public_read" on public.banners for select using (is_active = true or public.is_admin());
create policy "promos_public_read" on public.promos for select using (is_active = true or public.is_admin());

-- ADMIN-ONLY write access to catalog tables
create policy "categories_admin_write" on public.categories for all using (public.is_admin()) with check (public.is_admin());
create policy "games_admin_write" on public.games for all using (public.is_admin()) with check (public.is_admin());
create policy "products_admin_write" on public.products for all using (public.is_admin()) with check (public.is_admin());
create policy "banners_admin_write" on public.banners for all using (public.is_admin()) with check (public.is_admin());
create policy "promos_admin_write" on public.promos for all using (public.is_admin()) with check (public.is_admin());
create policy "providers_admin_only" on public.providers for all using (public.is_admin()) with check (public.is_admin());
create policy "settings_admin_only" on public.settings for all using (public.is_admin()) with check (public.is_admin());
create policy "logs_admin_read" on public.logs for select using (public.is_admin());

-- ORDERS: users see/create their own orders; admins see/manage all
create policy "orders_select_own_or_admin" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());
create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);
create policy "orders_update_admin_only" on public.orders
  for update using (public.is_admin());

-- PAYMENTS: users see payments linked to their own orders; admins see all
create policy "payments_select_own_or_admin" on public.payments
  for select using (
    public.is_admin() or
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );
create policy "payments_admin_write" on public.payments
  for all using (public.is_admin()) with check (public.is_admin());

-- WISHLISTS: users fully manage their own rows only
create policy "wishlists_select_own" on public.wishlists
  for select using (auth.uid() = user_id);
create policy "wishlists_insert_own" on public.wishlists
  for insert with check (auth.uid() = user_id);
create policy "wishlists_delete_own" on public.wishlists
  for delete using (auth.uid() = user_id);

-- =========================================================
-- REALTIME
-- =========================================================
-- Enable realtime so order status updates push instantly to the client
-- (Dashboard > Database > Replication, or via SQL below)
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.payments;

-- =========================================================
-- STORAGE
-- =========================================================
-- Create buckets for banners/game thumbnails/user avatars (run once)
insert into storage.buckets (id, name, public) values ('banners', 'banners', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('games', 'games', true) on conflict do nothing;
insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true) on conflict do nothing;

create policy "public_read_banners" on storage.objects for select using (bucket_id = 'banners');
create policy "public_read_games" on storage.objects for select using (bucket_id = 'games');
create policy "public_read_avatars" on storage.objects for select using (bucket_id = 'avatars');
create policy "admin_write_banners" on storage.objects for insert with check (bucket_id = 'banners' and public.is_admin());
create policy "admin_write_games" on storage.objects for insert with check (bucket_id = 'games' and public.is_admin());
create policy "user_write_own_avatar" on storage.objects for insert with check (bucket_id = 'avatars' and auth.uid() is not null);
