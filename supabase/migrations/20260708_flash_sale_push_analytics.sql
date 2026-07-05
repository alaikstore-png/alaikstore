-- =========================================================
-- Alaikstore — Flash Sale, Push Notification, Dashboard Analitik Mendalam
-- Run this AFTER 20260707_whatsapp_contact_settings.sql
-- =========================================================

-- =========================================================
-- 1) FLASH SALE
-- =========================================================
-- Satu baris = satu event flash sale untuk satu produk. Harga flash dihitung
-- dari discount_type/discount_value (sama pola dengan promos), dibatasi
-- waktu (starts_at/ends_at) dan kuota (stock_limit + sold_count).
create table if not exists public.flash_sales (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  title text not null default 'Flash Sale',
  discount_type text not null default 'percent' check (discount_type in ('percent','fixed')),
  discount_value numeric(14,2) not null,
  stock_limit int not null check (stock_limit > 0),
  sold_count int not null default 0,
  starts_at timestamptz not null default now(),
  ends_at timestamptz not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create index if not exists idx_flash_sales_product on public.flash_sales(product_id);
create index if not exists idx_flash_sales_window on public.flash_sales(starts_at, ends_at) where is_active = true;

alter table public.flash_sales enable row level security;

create policy "flash_sales_public_read" on public.flash_sales
  for select using (is_active = true or public.is_admin());
create policy "flash_sales_admin_write" on public.flash_sales
  for all using (public.is_admin()) with check (public.is_admin());

-- Harga flash sale untuk sebuah produk SAAT INI, atau null kalau tidak ada
-- flash sale yang sedang berjalan / stoknya sudah habis. `stable` (bukan
-- `immutable`) karena bergantung pada now().
create or replace function public.active_flash_sale_price(p_product_id uuid)
returns numeric as $$
  select case
    when fs.discount_type = 'percent' then greatest(round(p.sell_price - (p.sell_price * fs.discount_value / 100)), 0)
    else greatest(p.sell_price - fs.discount_value, 0)
  end
  from public.flash_sales fs
  join public.products p on p.id = fs.product_id
  where fs.product_id = p_product_id
    and fs.is_active = true
    and now() between fs.starts_at and fs.ends_at
    and fs.sold_count < fs.stock_limit
  order by fs.created_at desc
  limit 1;
$$ language sql stable;

-- Flash sale price selalu menang dari harga tier publik/member/reseller
-- (flash sale berlaku untuk semua orang, dan biasanya lebih murah dari
-- harga reseller sekalipun). Kalau tidak ada flash sale aktif, jatuh
-- kembali ke logika tier lama persis seperti sebelumnya.
create or replace function public.resolve_price(p_product_id uuid, p_tier text)
returns numeric as $$
  select coalesce(
    public.active_flash_sale_price(p_product_id),
    case
      when p_tier = 'reseller' and price_reseller is not null then price_reseller
      when p_tier = 'member' and price_member is not null then price_member
      else coalesce(discount_price, sell_price)
    end
  )
  from public.products where id = p_product_id;
$$ language sql stable;

-- Klaim satu unit stok flash sale secara atomik (mencegah race condition saat
-- banyak orang checkout bersamaan di detik-detik terakhir). Mengembalikan
-- true kalau berhasil diklaim, false kalau flash sale tidak aktif/habis —
-- create-order harus membatalkan order kalau ini mengembalikan false.
create or replace function public.claim_flash_sale_stock(p_product_id uuid)
returns boolean as $$
declare
  v_claimed boolean := false;
begin
  update public.flash_sales
  set sold_count = sold_count + 1
  where product_id = p_product_id
    and is_active = true
    and now() between starts_at and ends_at
    and sold_count < stock_limit
  returning true into v_claimed;

  return coalesce(v_claimed, false);
end;
$$ language plpgsql;

comment on function public.claim_flash_sale_stock is
  'Dipanggil oleh create-order SETELAH resolve_price. Kalau return false, order harus dibatalkan (stok flash sale habis duluan oleh pembeli lain).';

-- =========================================================
-- 2) PUSH NOTIFICATION (Web Push, VAPID)
-- =========================================================
-- Satu baris per browser/device yang mengizinkan notifikasi. user_id boleh
-- null (izin diberikan sebelum login), tapi biasanya diisi begitu user login
-- supaya kita bisa kirim notifikasi status order ke device yang tepat.
create table if not exists public.push_subscriptions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade,
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now()
);

create index if not exists idx_push_subs_user on public.push_subscriptions(user_id);

alter table public.push_subscriptions enable row level security;

-- User mengelola subscription miliknya sendiri; admin bisa baca semua (perlu
-- untuk kirim broadcast, misal pengumuman flash sale, dari Dashboard Admin).
create policy "push_subs_select_own_or_admin" on public.push_subscriptions
  for select using (auth.uid() = user_id or public.is_admin());
create policy "push_subs_insert_own" on public.push_subscriptions
  for insert with check (auth.uid() = user_id or user_id is null);
create policy "push_subs_delete_own_or_admin" on public.push_subscriptions
  for delete using (auth.uid() = user_id or public.is_admin());

-- =========================================================
-- 3) DASHBOARD ANALITIK — VIEW TAMBAHAN
-- =========================================================
-- Semua view di bawah hanya menghitung order 'success', selaras dengan
-- profit_daily (migration 20260706) supaya angka omzet di semua panel konsisten.

-- ---- Penjualan per produk per hari (untuk Top Produk & breakdown kategori) ----
create or replace view public.sales_by_product_daily as
select
  date_trunc('day', o.created_at)::date as day,
  o.product_id,
  coalesce(p.name, o.product_slug, 'Lainnya') as product_name,
  g.name as game_name,
  g.category_id,
  c.name as category_name,
  count(*) as qty,
  sum(o.amount) as revenue
from public.orders o
left join public.products p on p.id = o.product_id
left join public.games g on g.id = p.game_id
left join public.categories c on c.id = g.category_id
where o.status = 'success'
group by 1, 2, 3, 4, 5, 6;

comment on view public.sales_by_product_daily is
  'Dipakai Dashboard Admin -> Analitik untuk Top Produk (bar chart) dan Penjualan per Kategori (pie chart). Frontend agregasi ulang per rentang tanggal yang dipilih.';

-- ---- Breakdown metode pembayaran per hari ----
create or replace view public.payment_method_daily as
select
  date_trunc('day', o.created_at)::date as day,
  coalesce(o.payment_gateway::text, 'lainnya') as gateway,
  coalesce(o.payment_method, 'lainnya') as method,
  count(*) as qty,
  sum(o.amount) as revenue
from public.orders o
where o.status = 'success'
group by 1, 2, 3;

comment on view public.payment_method_daily is
  'Dipakai untuk pie chart metode pembayaran favorit pelanggan.';

-- ---- Pelanggan baru vs pelanggan yang kembali, per hari ----
-- "Baru" = hari itu adalah transaksi sukses pertama user tsb sepanjang masa.
create or replace view public.customer_daily_stats as
select
  d.day,
  count(*) filter (where d.day = fo.first_day) as new_customers,
  count(*) filter (where d.day <> fo.first_day) as returning_customers,
  count(*) as active_customers
from (
  select date_trunc('day', o.created_at)::date as day, o.user_id
  from public.orders o
  where o.status = 'success' and o.user_id is not null
  group by 1, 2
) d
join (
  select user_id, min(date_trunc('day', created_at))::date as first_day
  from public.orders
  where status = 'success' and user_id is not null
  group by user_id
) fo on fo.user_id = d.user_id
group by d.day;

comment on view public.customer_daily_stats is
  'Pelanggan baru vs kembali per hari. new_customers = user yang hari itu melakukan transaksi sukses pertamanya.';

-- ---- Distribusi jam order (30 hari terakhir, rolling) ----
-- Bukan per-hari (supaya cukup 1 query ringan), berguna untuk tahu jam ramai
-- pembeli agar admin bisa jadwalkan flash sale / promo di jam yang tepat.
create or replace view public.orders_by_hour_30d as
select
  extract(hour from o.created_at)::int as hour_of_day,
  count(*) as orders_count,
  sum(o.amount) as revenue
from public.orders o
where o.status = 'success' and o.created_at >= now() - interval '30 days'
group by 1
order by 1;

comment on view public.orders_by_hour_30d is
  'Jam berapa pelanggan paling sering checkout (30 hari terakhir, rolling). Dipakai untuk saran jadwal flash sale.';

-- ---- Statistik ringkas flash sale (untuk kartu di tab Analitik & Kelola Flash Sale) ----
create or replace view public.flash_sale_performance as
select
  fs.id,
  fs.product_id,
  fs.title,
  p.name as product_name,
  fs.discount_type,
  fs.discount_value,
  fs.stock_limit,
  fs.sold_count,
  fs.starts_at,
  fs.ends_at,
  fs.is_active,
  (fs.is_active and now() between fs.starts_at and fs.ends_at and fs.sold_count < fs.stock_limit) as is_currently_live,
  round(fs.sold_count::numeric / nullif(fs.stock_limit, 0) * 100, 1) as sold_pct
from public.flash_sales fs
join public.products p on p.id = fs.product_id
order by fs.starts_at desc;

comment on view public.flash_sale_performance is
  'Ringkasan tiap flash sale (terjual berapa % dari kuota, masih live atau tidak) untuk ditampilkan di Dashboard Admin.';
