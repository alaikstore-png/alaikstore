// Supabase Edge Function: provider-topup
// Deploy: supabase functions deploy provider-topup
// Called internally by payment-callback once a payment is confirmed "paid".
//
// UPDATED: now supports multiple providers per product (table
// `product_provider_links`). For each order it:
//   1. Loads every ACTIVE provider link for the product, cheapest first
//      (tie-broken by manual `priority`).
//   2. Tries them IN ORDER, calling the real provider API for each.
//   3. On the first one that doesn't throw and isn't `status: 'failed'`,
//      stops and records which provider actually fulfilled the order.
//   4. If a candidate throws (network/credential error) or comes back
//      `failed`, it logs the failure and automatically moves on to the
//      next cheapest provider — instead of giving up immediately.
//   5. If the product has no rows in `product_provider_links` yet (store
//      still on the old single-provider setup), falls back to the legacy
//      `products.provider_id`/`sku_code`, then to `DEFAULT_PROVIDER` +
//      `order.denomination` for pure demo data.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { topupDigiflazz } from '../_shared/digiflazz.ts'
import { topupVipReseller } from '../_shared/vipreseller.ts'
import { topupApiGames } from '../_shared/apigames.ts'
import { topupTokovoucher } from '../_shared/tokovoucher.ts'
import { orderMedanPedia } from '../_shared/medanpedia.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

// Fallback provider if the product catalog hasn't been fully configured yet
// (e.g. still running on the demo mock catalog with no real `products` rows,
// or no `product_provider_links` rows for this product).
const DEFAULT_PROVIDER = Deno.env.get('DEFAULT_PROVIDER') || 'Digiflazz'

interface Candidate {
  providerName: string
  skuCode: string
  providerPrice: number | null
}

// Single dispatch point so both the multi-provider loop and the legacy
// fallback path share the exact same call logic.
async function callProvider(providerName: string, order: any, skuCode: string) {
  switch (providerName) {
    case 'Digiflazz':
      return await topupDigiflazz(order, skuCode)
    case 'VIP Reseller':
      return await topupVipReseller(order, skuCode)
    case 'APIGames':
      return await topupApiGames(order, skuCode)
    case 'Tokovoucher':
      return await topupTokovoucher(order, skuCode)
    case 'MedanPedia':
      // SMM panel — skuCode here is MedanPedia's numeric service id.
      return await orderMedanPedia(order, skuCode)
    default:
      throw new Error(`Unknown provider: ${providerName}`)
  }
}

serve(async (req) => {
  const { order_id } = await req.json()

  const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).single()
  if (!order) return json({ success: false, error: 'order not found' }, 404)

  // Find the product row for this order (by name — orders store the
  // denomination label, not a normalized product_id in older rows).
  const { data: product } = await supabase
    .from('products')
    .select('id, sku_code, provider_id, providers(name)')
    .eq('name', order.denomination)
    .limit(1)
    .maybeSingle()

  let candidates: Candidate[] = []

  if (product?.id) {
    // Multi-provider path: every active provider link for this product,
    // cheapest (and highest-priority) first.
    const { data: links } = await supabase
      .from('product_provider_links')
      .select('sku_code, provider_price, priority, providers!inner(name, is_active)')
      .eq('product_id', product.id)
      .eq('is_active', true)
      .eq('providers.is_active', true)
      .order('priority', { ascending: true })
      .order('provider_price', { ascending: true })

    if (links && links.length > 0) {
      candidates = links.map((l: any) => ({
        providerName: l.providers.name,
        skuCode: l.sku_code,
        providerPrice: l.provider_price,
      }))
    }
  }

  // Legacy fallback: no multi-provider links configured yet for this
  // product — use the single provider_id/sku_code the product already has,
  // or DEFAULT_PROVIDER + denomination if the catalog isn't filled in at all.
  if (candidates.length === 0) {
    const skuCode = product?.sku_code || order.denomination
    const providerName = product?.providers?.name || order.provider_name || DEFAULT_PROVIDER
    candidates = [{ providerName, skuCode, providerPrice: null }]
  }

  const attempts: Array<{ provider: string; error: string }> = []

  for (const candidate of candidates) {
    try {
      const result = await callProvider(candidate.providerName, order, candidate.skuCode)

      if (result.status === 'failed') {
        attempts.push({ provider: candidate.providerName, error: result.message || 'provider returned failed' })
        await supabase.from('logs').insert({
          type: 'provider_topup_failed',
          message: result.message,
          payload: { order_id, provider: candidate.providerName, sku_code: candidate.skuCode, raw: result.raw },
        })
        continue // try the next cheapest provider instead of giving up
      }

      // Success or pending — this provider is the one that actually
      // fulfilled (or is fulfilling) the order. Record it, including the
      // price it cost us, so admin reporting on margin stays accurate.
      await supabase
        .from('orders')
        .update({
          provider_name: candidate.providerName,
          provider_ref: result.ref,
          provider_cost: candidate.providerPrice,
        })
        .eq('id', order.id)

      if (attempts.length > 0) {
        await supabase.from('logs').insert({
          type: 'provider_topup_failover',
          message: `Fulfilled by ${candidate.providerName} after ${attempts.length} cheaper provider(s) failed`,
          payload: { order_id, failed_attempts: attempts, used_provider: candidate.providerName },
        })
      }

      // Providers with a real webhook (Digiflazz/VIP Reseller/Tokovoucher) can safely be marked
      // "success" optimistically here — their webhook will correct it later if it actually failed.
      // MedanPedia has no such webhook, so a 'pending' result must keep the order in "processing"
      // (surfaced via the manual "Cek Status" button / provider-status-check) rather than jumping
      // straight to "success" with no way to ever correct a false positive.
      if (candidate.providerName === 'MedanPedia' && result.status === 'pending') {
        return json({
          success: true,
          keep_processing: true,
          provider_ref: result.ref,
          provider_status: result.status,
          provider_used: candidate.providerName,
        })
      }

      return json({
        success: true,
        provider_ref: result.ref,
        provider_status: result.status,
        provider_used: candidate.providerName,
        tried_before_success: attempts.length,
      })
    } catch (err) {
      // Network error, missing credentials, etc. — don't blow up the whole
      // order, just log it and fail over to the next cheapest candidate.
      attempts.push({ provider: candidate.providerName, error: String(err) })
      await supabase.from('logs').insert({
        type: 'provider_topup_error',
        message: String(err),
        payload: { order_id, provider: candidate.providerName, sku_code: candidate.skuCode },
      })
    }
  }

  // Every candidate provider failed (or threw).
  await supabase.from('logs').insert({
    type: 'provider_topup_all_failed',
    message: `All ${candidates.length} provider candidate(s) failed for order ${order_id}`,
    payload: { order_id, attempts },
  })

  return json({ success: false, error: 'All provider candidates failed', attempts })
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
