-- =========================================================
-- Alaikstore — Laporan Laba Rugi + index pendukung Auto Sinkronisasi Stok
-- Run this AFTER 20260705_multi_provider_routing.sql
-- =========================================================

-- ---------- LAPORAN LABA RUGI (harian) ----------
-- Satu baris per hari, hanya menghitung order yang sudah 'success'. Biaya
-- provider (cogs) diambil dari orders.provider_cost (harga aktual yang
-- kepakai — diisi otomatis oleh provider-topup sejak fitur multi-provider),
-- dan fallback ke products.base_price kalau order lama belum punya
-- provider_cost. Cashback & komisi affiliate dihitung sebagai biaya juga,
-- karena keduanya nyata-nyata mengurangi laba bersih per transaksi.
create or replace view public.profit_daily as
select
  date_trunc('day', o.created_at)::date as day,
  count(*) as orders_count,
  sum(o.amount) as revenue,
  sum(coalesce(o.provider_cost, p.base_price, 0)) as cogs,
  coalesce(sum(cb.amount), 0) as cashback_paid,
  coalesce(sum(ac.amount), 0) as affiliate_paid,
  sum(o.amount) - sum(coalesce(o.provider_cost, p.base_price, 0))
    - coalesce(sum(cb.amount), 0) - coalesce(sum(ac.amount), 0) as net_profit
from public.orders o
left join public.products p on p.id = o.product_id
left join public.cashback_transactions cb on cb.order_id = o.id
left join public.affiliate_commissions ac on ac.order_id = o.id and ac.status = 'credited'
where o.status = 'success'
group by 1;

comment on view public.profit_daily is
  'Daily P&L used by Dashboard Admin -> Laporan Laba Rugi. revenue - cogs - cashback_paid - affiliate_paid = net_profit.';

-- ---------- Index pendukung ----------
-- Laporan laba rugi & sinkronisasi stok keduanya sering query/filter
-- berdasarkan tanggal dan pasangan (provider_id, sku_code).
create index if not exists idx_orders_created_at on public.orders(created_at);
create index if not exists idx_ppl_provider_sku on public.product_provider_links(provider_id, sku_code);

-- ---------------------------------------------------------------------------
-- OPSIONAL — jadwalkan sync-provider-stock otomatis tiap 15 menit lewat
-- pg_cron + pg_net (kalau extension-nya sudah diaktifkan di project Anda:
-- Database -> Extensions -> aktifkan "pg_cron" dan "pg_net"). Ganti
-- <project-ref> dan <ANON-OR-SERVICE-KEY> lalu jalankan manual di SQL Editor
-- — sengaja tidak di-run otomatis oleh migration ini karena butuh key asli.
-- ---------------------------------------------------------------------------
-- select cron.schedule(
--   'sync-provider-stock-15min',
--   '*/15 * * * *',
--   $$
--   select net.http_post(
--     url := 'https://<project-ref>.supabase.co/functions/v1/sync-provider-stock',
--     headers := '{"Authorization": "Bearer <ANON-OR-SERVICE-KEY>", "Content-Type": "application/json"}'::jsonb
--   );
--   $$
-- );
