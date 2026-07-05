-- =========================================================
-- Alaikstore — Seed Data
-- Run AFTER schema.sql. Safe to re-run for providers/categories/games/products/
-- promos/settings (guarded by unique constraints). The `banners` insert has no
-- unique constraint on title, so re-running the script will add duplicate
-- banner rows — delete old ones from the admin dashboard if you reseed.
-- Populates enough real catalog data for the storefront, admin dashboard,
-- and provider-topup SKU lookups to work end-to-end out of the box.
-- =========================================================

-- ---------- PROVIDERS ----------
insert into public.providers (name, base_url, is_active) values
  ('Digiflazz', 'https://api.digiflazz.com/v1', true),
  ('VIP Reseller', 'https://vip-reseller.co.id/api', true),
  ('APIGames', 'https://v1.apigames.id/v2', true),
  ('Tokovoucher', 'https://api.tokovoucher.net/v1', true),
  ('MedanPedia', 'https://api.medanpedia.co.id', false) -- SMM panel (followers/likes/views), not game top-up; enable only if you add a social-media product category
on conflict do nothing;

-- ---------- CATEGORIES (top-level groups used by the storefront filter) ----------
insert into public.categories (name, slug, sort_order) values
  ('Mobile Game', 'mobile-game', 1),
  ('PC Game', 'pc-game', 2),
  ('Voucher', 'voucher', 3),
  ('Produk Digital', 'produk-digital', 4),
  ('Pulsa & Data', 'pulsa-data', 5),
  ('Token & Tagihan', 'token-tagihan', 6),
  ('Top Up E-Wallet', 'topup-ewallet', 7)
on conflict (slug) do nothing;

-- ---------- GAMES (20 items per the requested catalog) ----------
insert into public.games (category_id, name, slug, publisher, thumbnail_url, is_hot, needs_server_id, is_active, sort_order)
select c.id, g.name, g.slug, g.publisher, g.thumbnail_url, g.is_hot, g.needs_server_id, true, g.sort_order
from (values
  ('mobile-game', 'Mobile Legends', 'mobile-legends', 'Moonton', 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400', true, true, 1),
  ('mobile-game', 'Free Fire', 'free-fire', 'Garena', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', true, false, 2),
  ('mobile-game', 'PUBG Mobile', 'pubg-mobile', 'Krafton', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', true, false, 3),
  ('mobile-game', 'Honor of Kings', 'honor-of-kings', 'TiMi Studio', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', false, false, 4),
  ('mobile-game', 'Blood Strike', 'blood-strike', 'NetEase', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', false, false, 5),
  ('mobile-game', 'Call of Duty Mobile', 'cod-mobile', 'Activision', 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400', false, false, 6),
  ('mobile-game', 'Arena Breakout', 'arena-breakout', 'Proxima Beta', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', false, false, 7),
  ('mobile-game', 'Magic Chess Go Go', 'magic-chess', 'Moonton', 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400', false, true, 8),
  ('mobile-game', 'Ragnarok X: Next Generation', 'ragnarok-x', 'Gravity', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', false, false, 9),
  ('pc-game', 'Valorant', 'valorant', 'Riot Games', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', true, false, 10),
  ('pc-game', 'Point Blank', 'point-blank', 'Zepetto', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', false, false, 11),
  ('pc-game', 'League of Legends', 'league-of-legends', 'Riot Games', 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400', false, false, 12),
  ('voucher', 'Steam Wallet', 'steam-wallet', 'Valve', 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400', false, false, 13),
  ('voucher', 'PlayStation Network', 'psn', 'Sony', 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400', false, false, 14),
  ('voucher', 'Google Play', 'google-play', 'Google', 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=400', false, false, 15),
  ('voucher', 'Garena Shell', 'garena-shell', 'Garena', 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400', false, false, 16),
  ('produk-digital', 'Roblox', 'roblox', 'Roblox Corp', 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400', true, false, 17),
  ('produk-digital', 'Genshin Impact', 'genshin-impact', 'HoYoverse', 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400', true, false, 18),
  ('produk-digital', 'Honkai Star Rail', 'honkai-star-rail', 'HoYoverse', 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400', false, false, 19),
  ('produk-digital', 'Zenless Zone Zero', 'zenless-zone-zero', 'HoYoverse', 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400', false, false, 20),

  -- Pulsa & Paket Data (per operator)
  ('pulsa-data', 'Telkomsel', 'pulsa-telkomsel', 'Pulsa & Paket Data', null, true, false, 21),
  ('pulsa-data', 'Indosat Ooredoo', 'pulsa-indosat', 'Pulsa & Paket Data', null, true, false, 22),
  ('pulsa-data', 'XL Axiata', 'pulsa-xl', 'Pulsa & Paket Data', null, false, false, 23),
  ('pulsa-data', 'AXIS', 'pulsa-axis', 'Pulsa & Paket Data', null, false, false, 24),
  ('pulsa-data', 'Tri (3)', 'pulsa-tri', 'Pulsa & Paket Data', null, false, false, 25),
  ('pulsa-data', 'Smartfren', 'pulsa-smartfren', 'Pulsa & Paket Data', null, false, false, 26),

  -- Token & Tagihan
  ('token-tagihan', 'Token Listrik PLN Prabayar', 'token-listrik-pln', 'PT PLN (Persero)', null, true, false, 27),
  ('token-tagihan', 'Tagihan Listrik PLN Pascabayar', 'tagihan-listrik-pln', 'PT PLN (Persero)', null, false, false, 28),
  ('token-tagihan', 'BPJS Kesehatan', 'bpjs-kesehatan', 'BPJS', null, false, false, 29),

  -- Top Up E-Wallet
  ('topup-ewallet', 'DANA', 'topup-dana', 'Top Up Saldo E-Wallet', null, true, false, 30),
  ('topup-ewallet', 'OVO', 'topup-ovo', 'Top Up Saldo E-Wallet', null, true, false, 31),
  ('topup-ewallet', 'GoPay', 'topup-gopay', 'Top Up Saldo E-Wallet', null, true, false, 32),
  ('topup-ewallet', 'ShopeePay', 'topup-shopeepay', 'Top Up Saldo E-Wallet', null, false, false, 33),
  ('topup-ewallet', 'LinkAja', 'topup-linkaja', 'Top Up Saldo E-Wallet', null, false, false, 34)
) as g(category_slug, name, slug, publisher, thumbnail_url, is_hot, needs_server_id, sort_order)
join public.categories c on c.slug = g.category_slug
on conflict (slug) do nothing;

-- ---------- PRODUCTS (denominations) ----------
-- SKU codes below follow each provider's real naming convention where publicly documented
-- (e.g. Digiflazz buyer_sku_code style). Verify against your own provider dashboard —
-- exact codes depend on which seller/operator you're connected to.

-- Mobile Legends -> Digiflazz
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('mlbb86',  '86 Diamonds',  20500, 22000, false),
  ('mlbb172', '172 Diamonds', 41000, 44000, false),
  ('mlbb257', '257 Diamonds', 61500, 66000, false),
  ('mlbb344', '344 Diamonds', 82000, 88000, false),
  ('mlbb429', '429 Diamonds (Populer)', 102500, 110000, true),
  ('mlbb514', '514 Diamonds', 123000, 132000, false),
  ('mlbbwdp', 'Weekly Diamond Pass', 27000, 29000, false),
  ('mlbbtp',  'Twilight Pass', 139000, 149000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'mobile-legends' and p.name = 'Digiflazz'
on conflict do nothing;

-- Free Fire -> Digiflazz
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('ff5',    '5 Diamond',    900,   1200,  false),
  ('ff12',   '12 Diamond',   2100,  2500,  false),
  ('ff50',   '50 Diamond',   8200,  9000,  false),
  ('ff70',   '70 Diamond',   11400, 12500, true),
  ('ff140',  '140 Diamond',  22600, 24500, false),
  ('ff355',  '355 Diamond',  55500, 59000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'free-fire' and p.name = 'Digiflazz'
on conflict do nothing;

-- PUBG Mobile -> Digiflazz
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('pubg60',   '60 UC',   14500, 16000, false),
  ('pubg325',  '325 UC',  73000, 78000, true),
  ('pubg660',  '660 UC',  146000, 155000, false),
  ('pubg1800', '1800 UC', 365000, 385000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'pubg-mobile' and p.name = 'Digiflazz'
on conflict do nothing;

-- Genshin Impact -> Tokovoucher
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('gi60',   '60 Genesis Crystal',   13500, 15000, false),
  ('gi300',  '300 + 30 Genesis Crystal', 65000, 70000, true),
  ('gi980',  '980 + 110 Genesis Crystal', 205000, 219000, false),
  ('gi1980', '1980 + 260 Genesis Crystal', 405000, 429000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'genshin-impact' and p.name = 'Tokovoucher'
on conflict do nothing;

-- Steam Wallet -> VIP Reseller
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('STEAM45',  'Steam Wallet Rp 45.000',  45500, 48000, false),
  ('STEAM60',  'Steam Wallet Rp 60.000',  60500, 63500, true),
  ('STEAM120', 'Steam Wallet Rp 120.000', 120500, 126000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'steam-wallet' and p.name = 'VIP Reseller'
on conflict do nothing;

-- Google Play -> APIGames
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('gplay10', 'Google Play Rp 10.000', 10300, 11000, false),
  ('gplay20', 'Google Play Rp 20.000', 20300, 21500, false),
  ('gplay50', 'Google Play Rp 50.000', 50300, 52500, true),
  ('gplay100','Google Play Rp 100.000',100300, 104000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'google-play' and p.name = 'APIGames'
on conflict do nothing;

-- Pulsa & Paket Data -> Digiflazz (one block per operator; same nominal structure)
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('TSEL5',   'Pulsa 5.000',  6000,  6500,  false),
  ('TSEL10',  'Pulsa 10.000', 11000, 11500, false),
  ('TSEL20',  'Pulsa 20.000', 20000, 21000, false),
  ('TSEL50',  'Pulsa 50.000 (Populer)', 49000, 50500, true),
  ('TSEL100', 'Pulsa 100.000', 97000, 99500, false),
  ('TSELD1',  'Paket Data 1GB / 30 Hari', 15000, 16000, false),
  ('TSELD3',  'Paket Data 3GB / 30 Hari', 30000, 32000, false),
  ('TSELD10', 'Paket Data 10GB / 30 Hari', 74000, 78000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'pulsa-telkomsel' and p.name = 'Digiflazz'
on conflict do nothing;

insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('ISAT5',   'Pulsa 5.000',  5900,  6300,  false),
  ('ISAT10',  'Pulsa 10.000', 10800, 11200, false),
  ('ISAT25',  'Pulsa 25.000', 25200, 26000, false),
  ('ISAT50',  'Pulsa 50.000 (Populer)', 48500, 50000, true),
  ('ISATD3',  'Paket Data 3GB / 30 Hari', 29500, 31500, false),
  ('ISATD10', 'Paket Data 10GB / 30 Hari', 73000, 77500, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'pulsa-indosat' and p.name = 'Digiflazz'
on conflict do nothing;

insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('XL10',  'Pulsa 10.000', 10800, 11200, false),
  ('XL25',  'Pulsa 25.000', 25200, 26000, false),
  ('XL50',  'Pulsa 50.000 (Populer)', 48500, 50200, true),
  ('XLD5',  'Paket Data 5GB / 30 Hari', 43000, 44700, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'pulsa-xl' and p.name = 'Digiflazz'
on conflict do nothing;

-- Token Listrik PLN Prabayar -> Digiflazz
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('PLN20',  'Token Listrik 20.000',  21500, 22500, false),
  ('PLN50',  'Token Listrik 50.000',  51000, 52500, false),
  ('PLN100', 'Token Listrik 100.000 (Populer)', 100500, 102500, true),
  ('PLN200', 'Token Listrik 200.000', 200500, 202500, false),
  ('PLN500', 'Token Listrik 500.000', 500000, 502500, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'token-listrik-pln' and p.name = 'Digiflazz'
on conflict do nothing;

-- Top Up E-Wallet -> Tokovoucher
insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('DANA10',  'Saldo 10.000', 10800, 11500, false),
  ('DANA50',  'Saldo 50.000 (Populer)', 50000, 51500, true),
  ('DANA100', 'Saldo 100.000', 100000, 102000, false),
  ('DANA200', 'Saldo 200.000', 200000, 202000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'topup-dana' and p.name = 'Tokovoucher'
on conflict do nothing;

insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('OVO10',  'Saldo 10.000', 10800, 11500, false),
  ('OVO50',  'Saldo 50.000 (Populer)', 50000, 51500, true),
  ('OVO100', 'Saldo 100.000', 100000, 102000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'topup-ovo' and p.name = 'Tokovoucher'
on conflict do nothing;

insert into public.products (game_id, provider_id, sku_code, name, base_price, sell_price, is_popular, is_active)
select g.id, p.id, v.sku_code, v.name, v.base_price, v.sell_price, v.is_popular, true
from public.games g, public.providers p,
(values
  ('GOPAY10',  'Saldo 10.000', 10800, 11500, false),
  ('GOPAY50',  'Saldo 50.000 (Populer)', 50000, 51500, true),
  ('GOPAY100', 'Saldo 100.000', 100000, 102000, false)
) as v(sku_code, name, base_price, sell_price, is_popular)
where g.slug = 'topup-gopay' and p.name = 'Tokovoucher'
on conflict do nothing;

-- ---------- BANNERS ----------
-- Note: `image_url` here doubles as a product **slug** reference (e.g. 'mobile-legends'),
-- which the storefront's BannerSlider uses to render its branded GameArt background —
-- it is not an actual image file URL.
insert into public.banners (title, subtitle, image_url, link_url, sort_order, is_active) values
  ('Top Up Mobile Legends', 'Diskon hingga 15% untuk Diamond hari ini', 'mobile-legends', '/produk/mobile-legends', 1, true),
  ('Genshin Impact x Alaikstore', 'Bonus Genesis Crystal setiap pembelian di atas 500rb', 'genshin-impact', '/produk/genshin-impact', 2, true),
  ('Pulsa & Paket Data Semua Operator', 'Proses instan, harga bersahabat untuk semua nominal', 'pulsa-telkomsel', '/produk/pulsa-telkomsel', 3, true),
  ('Voucher Google Play & Steam', 'Instan, aman, dan harga paling bersahabat', 'google-play', '/produk/google-play', 4, true)
on conflict do nothing;

-- ---------- PROMOS ----------
insert into public.promos (code, description, discount_type, discount_value, min_purchase, max_discount, usage_limit, expires_at, is_active) values
  ('ALAIK10', 'Diskon 10% untuk semua produk Mobile Game', 'percent', 10, 0, 20000, 1000, '2026-07-31', true),
  ('WEEKEND15', 'Diskon 15% khusus top up di akhir pekan', 'percent', 15, 20000, 30000, 500, '2026-07-31', true),
  ('NEWUSER20', 'Diskon 20% untuk transaksi pertama pengguna baru', 'percent', 20, 0, 25000, null, '2026-08-31', true),
  ('VOUCHERFREE', 'Gratis biaya admin untuk pembayaran QRIS', 'fixed', 2500, 0, null, null, '2026-07-15', true)
on conflict (code) do nothing;

-- ---------- SETTINGS ----------
insert into public.settings (key, value) values
  ('site_name', '"Alaikstore"'),
  ('default_gateway', '"tripay"'),
  ('maintenance_mode', 'false')
on conflict (key) do nothing;
