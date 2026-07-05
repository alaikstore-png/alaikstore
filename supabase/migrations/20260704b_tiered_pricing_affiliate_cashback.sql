-- =========================================================
-- Alaikstore — Tiered Pricing + Affiliate + Cashback
-- Run AFTER schema.sql / seed.sql (and after 20260704_add_duitku_medanpedia.sql
-- if you already have an existing database).
--
-- Adds, on top of the existing Referral system:
--   1) Sistem harga bertingkat: public / member / reseller
--   2) Affiliate: komisi berkelanjutan lewat link ?aff=KODE (beda dari Referral
--      yang cuma bonus sekali di transaksi pertama)
--   3) Cashback: persentase saldo kembali otomatis ke pembeli setiap transaksi
--      sukses, besarnya tergantung tier harga pembeli
--   4) Bonus: menutup celah keamanan RLS lama — sebelumnya user bisa UPDATE
--      baris `users` miliknya sendiri lewat client dan mengubah kolom
--      `role`/`balance` sendiri jadi admin. Ditambahkan trigger yang mengunci
--      kolom sensitif agar hanya admin/service-role yang bisa mengubahnya.
-- =========================================================

-- ---------- 1) TIERED PRICING ----------
alter table public.users
  add column if not exists price_tier text not null default 'public'
    check (price_tier in ('public','member','reseller'));

alter table public.products
  add column if not exists price_member numeric(14,2),
  add column if not exists price_reseller numeric(14,2);

comment on column public.products.sell_price is
  'Harga PUBLIC (umum). price_member/price_reseller opsional — kalau kosong, otomatis fallback ke sell_price/discount_price.';

-- Dipanggil dari Edge Function create-order supaya harga final SELALU dihitung
-- di server (client tidak bisa memanipulasi body request untuk membayar lebih murah).
create or replace function public.resolve_price(p_product_id uuid, p_tier text)
returns numeric as $$
  select case
    when p_tier = 'reseller' and price_reseller is not null then price_reseller
    when p_tier = 'member' and price_member is not null then price_member
    else coalesce(discount_price, sell_price)
  end
  from public.products where id = p_product_id;
$$ language sql stable;

-- Demo default: Member 3% lebih murah, Reseller 7% lebih murah dari harga
-- publik, untuk produk yang sudah ada. Admin bebas menimpa angka ini per
-- produk lewat Dashboard Admin > Kelola Produk & Harga.
update public.products set price_member = round(sell_price * 0.97)::numeric(14,2) where price_member is null;
update public.products set price_reseller = round(sell_price * 0.93)::numeric(14,2) where price_reseller is null;

-- ---------- 2) AFFILIATE PROGRAM ----------
alter table public.users
  add column if not exists is_affiliate boolean not null default true,
  add column if not exists affiliate_code text unique,
  add column if not exists affiliate_rate numeric(5,2) not null default 3.00; -- % komisi per transaksi, bisa diubah per-user oleh admin

alter table public.orders
  add column if not exists affiliate_code text; -- kode affiliate yang aktif (dari ?aff=) saat order dibuat

create table if not exists public.affiliate_clicks (
  id uuid primary key default uuid_generate_v4(),
  affiliate_code text not null,
  landing_path text,
  created_at timestamptz not null default now()
);

create table if not exists public.affiliate_commissions (
  id uuid primary key default uuid_generate_v4(),
  affiliate_user_id uuid not null references public.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  buyer_id uuid references public.users(id) on delete set null,
  amount numeric(14,2) not null,
  rate numeric(5,2) not null,
  status text not null default 'credited' check (status in ('credited','reversed')),
  created_at timestamptz not null default now(),
  unique (order_id) -- satu order cuma bisa menghasilkan satu komisi
);

-- ---------- 3) CASHBACK ----------
create table if not exists public.cashback_transactions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid not null references public.users(id) on delete cascade,
  order_id uuid not null references public.orders(id) on delete cascade,
  amount numeric(14,2) not null,
  rate numeric(5,2) not null,
  created_at timestamptz not null default now(),
  unique (order_id)
);

-- Pengaturan global (dibaca Edge Function & bisa diedit admin lewat tab
-- "Pengaturan Reward" di Dashboard Admin). Rate dalam persen.
insert into public.settings (key, value) values
  ('cashback_rates', '{"public":0,"member":1,"reseller":2}'::jsonb)
  on conflict (key) do nothing;
insert into public.settings (key, value) values
  ('affiliate_default_rate', '3'::jsonb)
  on conflict (key) do nothing;

-- Setiap user baru otomatis dapat affiliate_code sendiri (terpisah dari referral_code)
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.users (id, full_name, phone, referral_code, affiliate_code, referred_by, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name'),
    new.raw_user_meta_data->>'phone',
    'ALAIK-' || upper(substring(new.id::text, 1, 6)),
    'AFF-' || upper(substring(new.id::text, 1, 6)),
    nullif(new.raw_user_meta_data->>'referred_by', ''),
    coalesce(new.raw_user_meta_data->>'avatar_url', new.raw_user_meta_data->>'picture')
  );
  return new;
end;
$$ language plpgsql security definer;

-- Backfill untuk user yang sudah ada sebelum migrasi ini
update public.users set affiliate_code = 'AFF-' || upper(substring(id::text, 1, 6)) where affiliate_code is null;

-- ---------- 4) KUNCI KOLOM SENSITIF (perbaikan celah RLS lama) ----------
-- Policy lama "users_update_own_or_admin" mengizinkan user meng-update BARIS-nya
-- sendiri tanpa membatasi KOLOM mana yang boleh diubah — artinya lewat client
-- Supabase langsung (bukan lewat UI aplikasi) user bisa saja mengubah role,
-- balance, price_tier, dst pada dirinya sendiri. Trigger ini mengunci kolom-kolom
-- istimewa itu supaya hanya admin/service-role yang bisa mengubahnya.
create or replace function public.protect_privileged_user_fields()
returns trigger as $$
begin
  if auth.uid() is not null and not public.is_admin() then
    new.role := old.role;
    new.balance := old.balance;
    new.price_tier := old.price_tier;
    new.is_affiliate := old.is_affiliate;
    new.affiliate_rate := old.affiliate_rate;
    new.referral_code := old.referral_code;
    new.affiliate_code := old.affiliate_code;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists users_protect_privileged_fields on public.users;
create trigger users_protect_privileged_fields
  before update on public.users
  for each row execute procedure public.protect_privileged_user_fields();

-- ---------- RLS ----------
alter table public.affiliate_commissions enable row level security;
alter table public.cashback_transactions enable row level security;
alter table public.affiliate_clicks enable row level security;

drop policy if exists "affiliate_commissions_select_own_or_admin" on public.affiliate_commissions;
create policy "affiliate_commissions_select_own_or_admin" on public.affiliate_commissions
  for select using (auth.uid() = affiliate_user_id or public.is_admin());
drop policy if exists "affiliate_commissions_admin_write" on public.affiliate_commissions;
create policy "affiliate_commissions_admin_write" on public.affiliate_commissions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "cashback_select_own_or_admin" on public.cashback_transactions;
create policy "cashback_select_own_or_admin" on public.cashback_transactions
  for select using (auth.uid() = user_id or public.is_admin());
drop policy if exists "cashback_admin_write" on public.cashback_transactions;
create policy "cashback_admin_write" on public.cashback_transactions
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "affiliate_clicks_insert_any" on public.affiliate_clicks;
create policy "affiliate_clicks_insert_any" on public.affiliate_clicks for insert with check (true);
drop policy if exists "affiliate_clicks_select_own_or_admin" on public.affiliate_clicks;
create policy "affiliate_clicks_select_own_or_admin" on public.affiliate_clicks
  for select using (
    public.is_admin() or
    affiliate_code = (select affiliate_code from public.users where id = auth.uid())
  );
