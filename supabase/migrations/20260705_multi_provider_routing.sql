-- =========================================================
-- Alaikstore — Multi-provider routing (cheapest / failover)
-- Run this AFTER schema.sql + the two 20260704* migrations.
-- =========================================================

-- ---------- PRODUCT ⇄ PROVIDER LINKS ----------
-- One product (e.g. "86 Diamonds" Mobile Legends) can now be fulfilled by
-- several providers, each with its own sku_code and cost price. This lets
-- provider-topup pick the cheapest active option automatically, and fall
-- back to the next one if the cheapest fails or is out of stock.
create table if not exists public.product_provider_links (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid not null references public.products(id) on delete cascade,
  provider_id uuid not null references public.providers(id) on delete cascade,
  sku_code text not null,                 -- code/service-id to send to THIS provider
  provider_price numeric(14,2) not null,  -- cost price from this provider (for comparison)
  priority int not null default 0,        -- manual override: lower tried first, ties broken by price
  is_active boolean not null default true,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  unique (product_id, provider_id)
);

alter table public.product_provider_links enable row level security;

create policy "product_provider_links_admin_only" on public.product_provider_links
  for all using (public.is_admin()) with check (public.is_admin());

create policy "product_provider_links_read_all" on public.product_provider_links
  for select using (true);

-- Backfill: for every existing product that already has a single
-- provider_id/sku_code assigned (the old single-provider model), create a
-- matching row here so nothing breaks for stores that haven't set up
-- multiple providers per product yet.
insert into public.product_provider_links (product_id, provider_id, sku_code, provider_price, priority, is_active)
select p.id, p.provider_id, coalesce(p.sku_code, p.name), p.base_price, 0, true
from public.products p
where p.provider_id is not null
on conflict (product_id, provider_id) do nothing;

-- Convenience view: cheapest ACTIVE provider per product, only counting
-- providers that are themselves marked active in `providers`.
create or replace view public.product_cheapest_provider as
select distinct on (l.product_id)
  l.product_id,
  l.provider_id,
  pr.name as provider_name,
  l.sku_code,
  l.provider_price,
  l.priority
from public.product_provider_links l
join public.providers pr on pr.id = l.provider_id
where l.is_active and pr.is_active
order by l.product_id, l.priority asc, l.provider_price asc;

comment on table public.product_provider_links is
  'Maps one product to N possible top-up providers with per-provider price, so the system can auto-pick the cheapest available and fail over if it errors out.';

-- ---------- ORDERS: record which provider actually fulfilled it, at what cost ----------
-- provider_name/provider_ref already existed; provider_cost is new so admin
-- margin reporting stays accurate even when the cheapest provider changes
-- per-order (unlike the old fixed provider_id-per-product setup).
alter table public.orders add column if not exists provider_cost numeric(14,2);

