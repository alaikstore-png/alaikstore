// Duitku integration — https://docs.duitku.com/api/en/
// Request Transaction: POST {BASE}/webapi/api/merchant/v2/inquiry
//   Signature: MD5(merchantCode + merchantOrderId + paymentAmount + merchantKey)
// Callback: Duitku POSTs application/x-www-form-urlencoded to callbackUrl.
//   Signature: MD5(merchantCode + amount + merchantOrderId + merchantKey)
//   Merchant must respond with HTTP 200 body "SUCCESS" or Duitku retries up to 5x.
// Docs confirm the v2/inquiry response returns `paymentUrl` for every channel;
// VA-based channels additionally return `vaNumber`, and QRIS channels return `qrString`.

import { md5Hex, safeEqual } from './crypto2.ts'

const BASE_URL =
  Deno.env.get('DUITKU_MODE') === 'production'
    ? 'https://passport.duitku.com/webapi/api/merchant'
    : 'https://sandbox.duitku.com/webapi/api/merchant'

// Our internal payment_method id -> Duitku paymentMethod code.
// Confirm exactly which channels are enabled for your merchant account in the
// Duitku dashboard (Get Payment Method endpoint) before relying on all of these.
const CHANNEL_MAP: Record<string, string> = {
  qris: 'SP', // QRIS via ShopeePay acquirer — Duitku's most broadly-available QRIS channel
  dana: 'DA',
  ovo: 'OV',
  gopay: 'GO',
  shopeepay: 'SP',
  linkaja: 'LA',
  bca_va: 'BC',
  mandiri_va: 'M2',
  bni_va: 'I1',
  bri_va: 'BR',
  cimb_va: 'B1',
  permata_va: 'BT',
  danamon_va: 'DM',
  bsi_va: 'BV',
  alfamart: 'FT',
  indomaret: 'FT',
  credit_card: 'VC',
}

export interface GatewayResult {
  reference: string
  checkout_url: string | null
  qr_url: string | null
  va_number: string | null
  expired_at: string | null
  raw: unknown
}

export async function createDuitkuTransaction(order: any): Promise<GatewayResult> {
  const merchantCode = Deno.env.get('DUITKU_MERCHANT_CODE')
  const merchantKey = Deno.env.get('DUITKU_API_KEY')
  if (!merchantCode || !merchantKey) {
    throw new Error('Duitku credentials are not configured (DUITKU_MERCHANT_CODE / DUITKU_API_KEY)')
  }

  const paymentMethod = CHANNEL_MAP[order.payment_method] || 'SP'
  const merchantOrderId = order.id
  const paymentAmount = Math.round(Number(order.amount))

  // Duitku's request-transaction signature: MD5(merchantCode + merchantOrderId + paymentAmount + merchantKey)
  const signature = await md5Hex(`${merchantCode}${merchantOrderId}${paymentAmount}${merchantKey}`)

  const body = {
    merchantCode,
    paymentAmount,
    paymentMethod,
    merchantOrderId,
    productDetails: `${order.product_slug} - ${order.denomination}`,
    customerVaName: order.user_game_id || 'Pelanggan Alaikstore',
    email: order.customer_email || 'customer@alaikstore.id',
    phoneNumber: order.customer_phone || '08000000000',
    itemDetails: [
      { name: `${order.product_slug} - ${order.denomination}`, price: paymentAmount, quantity: 1 },
    ],
    callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/payment-callback?gateway=duitku`,
    returnUrl: Deno.env.get('APP_BASE_URL')
      ? `${Deno.env.get('APP_BASE_URL')}/cek-pesanan?order=${order.id}`
      : undefined,
    expiryPeriod: 60, // minutes
    signature,
  }

  const res = await fetch(`${BASE_URL}/v2/inquiry`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const json = await res.json()
  if (!res.ok || json.statusCode !== '00') {
    throw new Error(json?.statusMessage || json?.Message || `Duitku transaction failed (HTTP ${res.status})`)
  }

  return {
    reference: json.reference,
    checkout_url: json.paymentUrl || null,
    qr_url: json.qrString || null,
    va_number: json.vaNumber || null,
    expired_at: null, // Duitku does not return an absolute expiry timestamp here; expiryPeriod above is relative (minutes)
    raw: json,
  }
}

/**
 * Duitku sends the callback as application/x-www-form-urlencoded — parse the raw
 * body as URLSearchParams (NOT JSON.parse) before calling this.
 * Signature = MD5(merchantCode + amount + merchantOrderId + merchantKey)
 */
export async function verifyDuitkuCallback(fields: URLSearchParams): Promise<boolean> {
  const merchantCode = Deno.env.get('DUITKU_MERCHANT_CODE')
  const merchantKey = Deno.env.get('DUITKU_API_KEY')
  if (!merchantCode || !merchantKey) return false

  const amount = fields.get('amount') || ''
  const merchantOrderId = fields.get('merchantOrderId') || ''
  const signature = fields.get('signature') || ''
  if (!merchantOrderId || !signature) return false

  const expected = await md5Hex(`${merchantCode}${amount}${merchantOrderId}${merchantKey}`)
  return safeEqual(expected, signature)
}

/** Duitku's callback resultCode: "00" = success/paid, anything else = failed. */
export function mapDuitkuStatus(resultCode: string | null): 'paid' | 'failed' | 'pending' {
  if (resultCode === '00') return 'paid'
  if (resultCode === '01') return 'pending'
  return 'failed'
}
