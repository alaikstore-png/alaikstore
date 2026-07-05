// Tripay integration — https://tripay.co.id/developer
// Tripay is a "closed payment" aggregator: one API covers QRIS, e-wallets,
// virtual accounts, and retail outlets via different `method` channel codes.

import { hmacSha256Hex, safeEqual } from './crypto.ts'

const BASE_URL =
  Deno.env.get('TRIPAY_MODE') === 'production'
    ? 'https://tripay.co.id/api'
    : 'https://tripay.co.id/api-sandbox'

// Our internal payment_method id -> Tripay payment channel code.
// Confirm exact codes enabled for your merchant account in the Tripay dashboard
// (Channel availability varies by merchant; QRIS is the universal fallback).
const CHANNEL_MAP: Record<string, string> = {
  qris: 'QRIS',
  dana: 'QRIS',
  ovo: 'OVO',
  gopay: 'QRIS',
  shopeepay: 'QRIS',
  linkaja: 'QRIS',
  bca_va: 'BCAVA',
  mandiri_va: 'MANDIRIVA',
  bni_va: 'BNIVA',
  bri_va: 'BRIVA',
  alfamart: 'ALFAMART',
  indomaret: 'INDOMARET',
}

export interface GatewayResult {
  reference: string
  checkout_url: string | null
  qr_url: string | null
  va_number: string | null
  expired_at: string | null
  raw: unknown
}

export async function createTripayTransaction(order: any): Promise<GatewayResult> {
  const merchantCode = Deno.env.get('TRIPAY_MERCHANT_CODE')
  const apiKey = Deno.env.get('TRIPAY_API_KEY')
  const privateKey = Deno.env.get('TRIPAY_PRIVATE_KEY')
  if (!merchantCode || !apiKey || !privateKey) {
    throw new Error('Tripay credentials are not configured (TRIPAY_MERCHANT_CODE / TRIPAY_API_KEY / TRIPAY_PRIVATE_KEY)')
  }

  const method = CHANNEL_MAP[order.payment_method] || 'QRIS'
  const merchantRef = order.id
  const amount = Math.round(Number(order.amount))

  // Tripay's create-transaction signature: HMAC-SHA256(merchant_code + merchant_ref + amount, private_key)
  const signature = await hmacSha256Hex(privateKey, `${merchantCode}${merchantRef}${amount}`)

  const body = {
    method,
    merchant_ref: merchantRef,
    amount,
    customer_name: order.user_game_id || 'Pelanggan Alaikstore',
    customer_email: order.customer_email || 'customer@alaikstore.id',
    order_items: [
      {
        sku: order.product_slug,
        name: `${order.product_slug} - ${order.denomination}`,
        price: amount,
        quantity: 1,
      },
    ],
    callback_url: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback?gateway=tripay`,
    return_url: Deno.env.get('APP_BASE_URL')
      ? `${Deno.env.get('APP_BASE_URL')}/cek-pesanan?order=${order.id}`
      : undefined,
    expired_time: Math.floor(Date.now() / 1000) + 3600,
    signature,
  }

  const res = await fetch(`${BASE_URL}/transaction/create`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || !json.success) {
    throw new Error(json?.message || `Tripay transaction failed (HTTP ${res.status})`)
  }

  const d = json.data
  return {
    reference: d.reference,
    checkout_url: d.checkout_url || null,
    qr_url: d.qr_url || null,
    va_number: d.pay_code || null, // Tripay returns `pay_code` for VA numbers and retail payment codes
    expired_at: d.expired_time ? new Date(d.expired_time * 1000).toISOString() : null,
    raw: d,
  }
}

/**
 * Tripay webhook signature check.
 * Header: X-Callback-Signature
 * Signature = HMAC-SHA256(raw_request_body, private_key)
 * IMPORTANT: must be computed over the exact raw body string, before JSON.parse.
 */
export async function verifyTripaySignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false
  const privateKey = Deno.env.get('TRIPAY_PRIVATE_KEY')
  if (!privateKey) return false
  const expected = await hmacSha256Hex(privateKey, rawBody)
  return safeEqual(expected, signatureHeader)
}

/** Maps Tripay's callback status field to our internal order status. */
export function mapTripayStatus(status: string): 'paid' | 'failed' | 'pending' {
  if (status === 'PAID') return 'paid'
  if (status === 'EXPIRED' || status === 'FAILED') return 'failed'
  return 'pending'
}
