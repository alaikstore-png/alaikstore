// Supabase Edge Function: sync-provider-stock
// Deploy: supabase functions deploy sync-provider-stock
// Trigger manually (button in Dashboard Admin → "Routing Harga Termurah") or on
// a schedule via pg_cron + pg_net (see migration 20260706 for the SQL snippet).
//
// What it does:
//   1. For every ACTIVE row in `providers`, fetches that provider's live price
//      list (Digiflazz / VIP Reseller / Tokovoucher / APIGames — MedanPedia is
//      an SMM panel and has no comparable game/PPOB price list, so it's
//      skipped here).
//   2. Matches each price-list item against `product_provider_links` by
//      (provider_id, sku_code) and updates `provider_price` (auto price
//      update) and `is_active` (auto stock sync) to match what the provider
//      actually has right now.
//   3. Any link whose sku_code no longer appears in that provider's price
//      list is marked `is_active = false` (provider delisted it) rather than
//      left stale.
//   4. Recomputes `products.stock_status`: 'available' if the product still
//      has at least one active provider link left, 'empty' otherwise — this
//      is what "Cek Status Pesanan" / storefront stock badges read from.
//   5. Logs a summary row to `logs` (type 'stock_sync') so admins can see
//      sync history and per-provider failures without digging through
//      function logs.
//
// One provider failing (bad credentials, network error, docs mismatch) never
// stops the others — each provider is fetched and applied independently.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getDigiflazzPriceList } from '../_shared/digiflazz.ts'
import { getVipResellerPriceList } from '../_shared/vipreseller.ts'
import { getTokovoucherPriceList } from '../_shared/tokovoucher.ts'
import { getApiGamesPriceList } from '../_shared/apigames.ts'
import type { PriceListItem } from '../_shared/digiflazz.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

const PRICE_LIST_FETCHERS: Record<string, () => Promise<PriceListItem[]>> = {
  Digiflazz: getDigiflazzPriceList,
  'VIP Reseller': getVipResellerPriceList,
  Tokovoucher: getTokovoucherPriceList,
  APIGames: getApiGamesPriceList,
  // MedanPedia intentionally omitted: it's an SMM panel, not a game/PPOB
  // catalog, so "price list" doesn't map onto product_provider_links here.
}

serve(async (_req) => {
  const { data: providers } = await supabase.from('providers').select('id, name').eq('is_active', true)
  if (!providers || providers.length === 0) {
    return json({ success: false, error: 'No active providers configured' })
  }

  const providerErrors: Array<{ provider: string; error: string }> = []
  const providerResults: Record<string, PriceListItem[]> = {}

  // Fetch every provider's price list independently so one failure doesn't
  // block the others.
  await Promise.all(
    providers.map(async (p) => {
      const fetcher = PRICE_LIST_FETCHERS[p.name]
      if (!fetcher) return // e.g. MedanPedia — nothing to sync here
      try {
        providerResults[p.id] = await fetcher()
      } catch (err) {
        providerErrors.push({ provider: p.name, error: String(err) })
      }
    })
  )

  const providersSynced = Object.keys(providerResults).length
  if (providersSynced === 0) {
    await supabase.from('logs').insert({
      type: 'stock_sync',
      message: 'Sync failed for every active provider',
      payload: { providerErrors },
    })
    return json({ success: false, error: 'All provider price-list fetches failed', providerErrors })
  }

  // Load every existing product_provider_links row so we know what to update.
  const { data: links } = await supabase
    .from('product_provider_links')
    .select('id, product_id, provider_id, sku_code, provider_price, is_active')

  let priceChanged = 0
  let becameActive = 0
  let becameInactive = 0
  const affectedProductIds = new Set<string>()

  for (const link of links || []) {
    const priceList = providerResults[link.provider_id]
    if (!priceList) continue // this provider wasn't synced this run (inactive or fetch failed)

    const match = priceList.find((item) => item.sku_code === link.sku_code)
    // Not found in the provider's current catalog at all -> treat as out of
    // stock/delisted rather than leaving a stale "active" row.
    const newIsActive = match ? match.in_stock : false
    const newPrice = match ? match.price : link.provider_price

    if (newIsActive !== link.is_active) {
      if (newIsActive) becameActive++
      else becameInactive++
    }
    if (match && Number(match.price) !== Number(link.provider_price)) priceChanged++

    if (match || newIsActive !== link.is_active) {
      await supabase
        .from('product_provider_links')
        .update({ provider_price: newPrice, is_active: newIsActive, last_checked_at: new Date().toISOString() })
        .eq('id', link.id)
      affectedProductIds.add(link.product_id)
    }
  }

  // Recompute stock_status per affected product: available if it still has
  // at least one active provider link (checked fresh from DB, since several
  // links per product may have just been updated above).
  for (const productId of affectedProductIds) {
    const { count } = await supabase
      .from('product_provider_links')
      .select('id', { count: 'exact', head: true })
      .eq('product_id', productId)
      .eq('is_active', true)

    await supabase
      .from('products')
      .update({ stock_status: (count || 0) > 0 ? 'available' : 'empty' })
      .eq('id', productId)
  }

  const summary = {
    providers_synced: providersSynced,
    provider_errors: providerErrors,
    links_price_changed: priceChanged,
    links_became_available: becameActive,
    links_became_out_of_stock: becameInactive,
    products_updated: affectedProductIds.size,
  }

  await supabase.from('logs').insert({ type: 'stock_sync', message: 'Provider price/stock sync completed', payload: summary })

  return json({ success: true, ...summary })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
