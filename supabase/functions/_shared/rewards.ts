// Shared helpers for the Cashback and Affiliate programs. Both run right after
// an order is marked "success" in payment-callback (alongside the existing
// referral bonus in referral.ts). Both are idempotent (unique constraint on
// order_id) so a duplicate webhook delivery never double-credits anyone.

import { creditBalance } from './referral.ts'

/**
 * Cashback: a percentage of the order amount is credited straight back to the
 * BUYER's own balance, right after a successful purchase. The percentage
 * depends on the buyer's price tier (public/member/reseller) — see the
 * `cashback_rates` row in the `settings` table (editable from Dashboard Admin).
 * Deposit-saldo orders are excluded (cashback applies to real purchases only).
 */
export async function maybeGrantCashback(supabaseAdmin: any, order: any) {
  if (order.product_slug === 'deposit-saldo') return

  const { data: buyer } = await supabaseAdmin.from('users').select('price_tier').eq('id', order.user_id).maybeSingle()
  if (!buyer) return

  const { data: setting } = await supabaseAdmin.from('settings').select('value').eq('key', 'cashback_rates').maybeSingle()
  const rates = setting?.value || { public: 0, member: 1, reseller: 2 }
  const rate = Number(rates[buyer.price_tier] || 0)
  if (rate <= 0) return

  const amount = Math.round((Number(order.amount) * rate) / 100)
  if (amount <= 0) return

  const { error: insertError } = await supabaseAdmin
    .from('cashback_transactions')
    .insert({ user_id: order.user_id, order_id: order.id, amount, rate })
  if (insertError) return // unique(order_id) violation = already credited, or table missing — fail silently

  await creditBalance(supabaseAdmin, order.user_id, amount)
  await supabaseAdmin.from('logs').insert({
    type: 'cashback_credit',
    message: `Cashback ${rate}% (Rp${amount}) untuk ${order.user_id} dari order ${order.id}`,
    payload: { user_id: order.user_id, order_id: order.id, amount, rate },
  })
}

/**
 * Affiliate: whoever's affiliate link (?aff=KODE) the buyer clicked before
 * checking out earns an ongoing commission on EVERY successful order the
 * buyer makes (unlike the one-time Referral bonus). The code is captured by
 * the frontend (src/lib/affiliate.js) and sent to create-order, which stores
 * it on the order row.
 */
export async function maybeGrantAffiliateCommission(supabaseAdmin: any, order: any) {
  if (order.product_slug === 'deposit-saldo') return
  if (!order.affiliate_code) return

  const { data: affiliate } = await supabaseAdmin
    .from('users')
    .select('id, is_affiliate, affiliate_rate')
    .eq('affiliate_code', order.affiliate_code)
    .maybeSingle()
  if (!affiliate || !affiliate.is_affiliate) return
  if (affiliate.id === order.user_id) return // no self-referral abuse

  const rate = Number(affiliate.affiliate_rate || 0)
  if (rate <= 0) return

  const amount = Math.round((Number(order.amount) * rate) / 100)
  if (amount <= 0) return

  const { error: insertError } = await supabaseAdmin
    .from('affiliate_commissions')
    .insert({ affiliate_user_id: affiliate.id, order_id: order.id, buyer_id: order.user_id, amount, rate })
  if (insertError) return // unique(order_id) violation = already credited

  await creditBalance(supabaseAdmin, affiliate.id, amount)
  await supabaseAdmin.from('logs').insert({
    type: 'affiliate_commission',
    message: `Komisi affiliate ${rate}% (Rp${amount}) untuk ${affiliate.id} dari order ${order.id} (pembeli ${order.user_id})`,
    payload: { affiliate_id: affiliate.id, buyer_id: order.user_id, order_id: order.id, amount, rate },
  })
}
