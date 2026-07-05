// Supabase Edge Function: create-order
// Called from the frontend (src/lib/api.js -> createOrder) when the user taps
// "Bayar Sekarang". Creates the order row, opens a real transaction with the
// configured payment gateway (Tripay / Midtrans / Xendit), stores the payment
// record, and returns everything the UI needs to show QR / VA / checkout link.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { createTripayTransaction } from '../_shared/tripay.ts'
import { createMidtransTransaction } from '../_shared/midtrans.ts'
import { createXenditTransaction } from '../_shared/xendit.ts'
import { createDuitkuTransaction } from '../_shared/duitku.ts'

// Which gateway handles new transactions. Set PAYMENT_GATEWAY as an Edge Function
// secret to 'tripay' | 'midtrans' | 'xendit' | 'duitku'. Defaults to tripay (covers
// every listed payment method — QRIS, e-wallets, bank VA, Alfamart/Indomaret — via one API).
const GATEWAY = (Deno.env.get('PAYMENT_GATEWAY') || 'tripay') as 'tripay' | 'midtrans' | 'xendit' | 'duitku'

serve(async (req) => {
  const authHeader = req.headers.get('Authorization') ?? ''

  // Client bound to the caller's JWT so RLS applies normally for the insert.
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  )
  // Service-role client for writes that must bypass RLS (payments table, order update after gateway call).
  const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

  const { data: userData } = await supabase.auth.getUser()
  if (!userData?.user) return json({ error: 'unauthorized' }, 401)

  const body = await req.json()
  const { product_slug, product_id, user_game_id, server_id, denomination, amount, payment_method, promo_code, affiliate_code } = body

  if (!product_slug || !user_game_id || !denomination || !amount || !payment_method) {
    return json({ error: 'missing required fields' }, 400)
  }

  // ---- Authoritative pricing (tiered: public / member / reseller) ----
  // Never trust the `amount` the client sends for real, catalog-backed products —
  // resolve it server-side from the buyer's price_tier so editing the request
  // body can't get anyone a cheaper price. `amount` is only used as-is for
  // deposit-saldo (a free-form top-up amount) or demo/mock products that
  // haven't been seeded into Supabase yet (no valid product_id to resolve).
  let finalAmount = Number(amount)
  const isRealProduct = product_slug !== 'deposit-saldo' && isUuid(product_id)

  if (isRealProduct) {
    const { data: buyerProfile } = await supabaseAdmin.from('users').select('price_tier').eq('id', userData.user.id).maybeSingle()
    const tier = buyerProfile?.price_tier || 'public'
    const { data: resolvedPrice, error: priceError } = await supabaseAdmin.rpc('resolve_price', {
      p_product_id: product_id,
      p_tier: tier,
    })
    if (!priceError && resolvedPrice != null) finalAmount = Number(resolvedPrice)

    // ---- Flash sale stock claim ----
    // If there's a currently-running flash sale on this product, resolve_price
    // above already used its discounted price. We must also atomically claim
    // one unit of its limited stock — otherwise two buyers checking out in the
    // same second could both get the flash price after the quota is gone.
    // claim_flash_sale_stock returns false both when there's no flash sale at
    // all AND when one exists but is sold out, so we only treat it as a hard
    // stop when we can independently confirm a flash sale is actually live.
    const { data: flashPrice } = await supabaseAdmin.rpc('active_flash_sale_price', { p_product_id: product_id })
    if (flashPrice != null) {
      const { data: claimed } = await supabaseAdmin.rpc('claim_flash_sale_stock', { p_product_id: product_id })
      if (!claimed) {
        return json({ error: 'Yah, kuota flash sale untuk produk ini baru saja habis. Silakan refresh halaman.' }, 409)
      }
    }
  }

  // ---- Promo/voucher discount (also recomputed server-side, same rules as validate-promo) ----
  let discountAmount = 0
  if (promo_code && product_slug !== 'deposit-saldo') {
    const { data: promo } = await supabaseAdmin.from('promos').select('*').eq('code', String(promo_code).toUpperCase()).eq('is_active', true).maybeSingle()
    if (promo) {
      const notExpired = !promo.expires_at || new Date(promo.expires_at) >= new Date()
      const underLimit = !promo.usage_limit || promo.used_count < promo.usage_limit
      const meetsMin = finalAmount >= (promo.min_purchase || 0)
      if (notExpired && underLimit && meetsMin) {
        discountAmount = promo.discount_type === 'percent' ? (finalAmount * promo.discount_value) / 100 : promo.discount_value
        if (promo.max_discount) discountAmount = Math.min(discountAmount, promo.max_discount)
        discountAmount = Math.min(discountAmount, finalAmount)
        await supabaseAdmin.from('promos').update({ used_count: (promo.used_count || 0) + 1 }).eq('id', promo.id)
      }
    }
  }
  finalAmount = Math.max(Math.round(finalAmount - discountAmount), 0)

  const { data: order, error: insertError } = await supabase
    .from('orders')
    .insert({
      user_id: userData.user.id,
      product_id: isRealProduct ? product_id : null,
      product_slug,
      denomination,
      user_game_id,
      server_id,
      amount: finalAmount,
      discount_amount: discountAmount,
      payment_method,
      payment_gateway: GATEWAY,
      promo_code,
      affiliate_code: affiliate_code || null,
      status: 'pending',
    })
    .select()
    .single()

  if (insertError) return json({ error: insertError.message }, 400)

  try {
    let gatewayResult
    if (GATEWAY === 'tripay') gatewayResult = await createTripayTransaction(order)
    else if (GATEWAY === 'midtrans') gatewayResult = await createMidtransTransaction(order)
    else if (GATEWAY === 'duitku') gatewayResult = await createDuitkuTransaction(order)
    else gatewayResult = await createXenditTransaction(order)

    await supabaseAdmin.from('payments').insert({
      order_id: order.id,
      gateway: GATEWAY,
      gateway_ref: gatewayResult.reference,
      method: payment_method,
      amount: order.amount,
      qr_url: gatewayResult.qr_url,
      va_number: gatewayResult.va_number,
      status: 'pending',
      raw_callback: gatewayResult.raw,
    })

    return json({
      order,
      payment: {
        gateway: GATEWAY,
        reference: gatewayResult.reference,
        checkout_url: gatewayResult.checkout_url,
        qr_url: gatewayResult.qr_url,
        va_number: gatewayResult.va_number,
        expired_at: gatewayResult.expired_at,
      },
    })
  } catch (err) {
    // Gateway call failed — mark the order failed instead of leaving it stuck "pending" forever.
    await supabaseAdmin.from('orders').update({ status: 'failed' }).eq('id', order.id)
    await supabaseAdmin.from('logs').insert({ type: 'create_order_gateway_error', message: String(err), payload: { order_id: order.id, gateway: GATEWAY } })
    return json({ error: `Gagal membuat transaksi pembayaran: ${String(err)}` }, 502)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

function isUuid(value: unknown): value is string {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
}
