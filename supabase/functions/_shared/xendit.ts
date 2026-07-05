// Xendit integration — https://developers.xendit.co
// Xendit splits payment types across separate endpoints (QR Codes, E-Wallets,
// Virtual Accounts, Fixed Payment Code for retail outlets), unlike Tripay's
// single unified endpoint, so each channel is a distinct request below.

import { safeEqual } from './crypto.ts'
import type { GatewayResult } from './tripay.ts'

const BASE_URL = 'https://api.xendit.co'

function authHeader() {
  const secretKey = Deno.env.get('XENDIT_SECRET_KEY')
  if (!secretKey) throw new Error('XENDIT_SECRET_KEY is not configured')
  return `Basic ${btoa(`${secretKey}:`)}`
}

export async function createXenditTransaction(order: any): Promise<GatewayResult> {
  const amount = Math.round(Number(order.amount))
  const orderId = order.id
  const returnUrl = `${Deno.env.get('APP_BASE_URL') || ''}/cek-pesanan?order=${orderId}`

  if (order.payment_method === 'qris') {
    const res = await fetch(`${BASE_URL}/qr_codes`, {
      method: 'POST',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({ reference_id: orderId, type: 'DYNAMIC', currency: 'IDR', amount }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Xendit QR creation failed')
    return { reference: json.id, checkout_url: null, qr_url: json.qr_string, va_number: null, expired_at: json.expires_at ?? null, raw: json }
  }

  const ewalletChannelMap: Record<string, string> = { dana: 'DANA', ovo: 'OVO', shopeepay: 'SHOPEEPAY', linkaja: 'LINKAJA', gopay: 'GOPAY' }
  if (ewalletChannelMap[order.payment_method]) {
    const res = await fetch(`${BASE_URL}/ewallets/charges`, {
      method: 'POST',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        reference_id: orderId,
        currency: 'IDR',
        amount,
        checkout_method: 'ONE_TIME_PAYMENT',
        channel_code: ewalletChannelMap[order.payment_method],
        channel_properties: { success_redirect_url: returnUrl, failure_redirect_url: returnUrl },
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Xendit e-wallet charge failed')
    return {
      reference: json.id,
      checkout_url: json.actions?.desktop_web_checkout_url || json.actions?.mobile_web_checkout_url || json.actions?.mobile_deeplink_checkout_url || null,
      qr_url: json.actions?.qr_checkout_string || null,
      va_number: null,
      expired_at: null,
      raw: json,
    }
  }

  const vaBankMap: Record<string, string> = { bca_va: 'BCA', mandiri_va: 'MANDIRI', bni_va: 'BNI', bri_va: 'BRI' }
  if (vaBankMap[order.payment_method]) {
    const res = await fetch(`${BASE_URL}/callback_virtual_accounts`, {
      method: 'POST',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_id: orderId,
        bank_code: vaBankMap[order.payment_method],
        name: order.user_game_id || 'Alaikstore Customer',
        expected_amount: amount,
        is_closed: true,
        expiration_date: new Date(Date.now() + 3600 * 1000).toISOString(),
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Xendit VA creation failed')
    return { reference: json.id, checkout_url: null, qr_url: null, va_number: json.account_number, expired_at: json.expiration_date ?? null, raw: json }
  }

  if (order.payment_method === 'alfamart' || order.payment_method === 'indomaret') {
    const res = await fetch(`${BASE_URL}/fixed_payment_code`, {
      method: 'POST',
      headers: { Authorization: authHeader(), 'Content-Type': 'application/json' },
      body: JSON.stringify({
        external_id: orderId,
        retail_outlet_name: order.payment_method === 'alfamart' ? 'ALFAMART' : 'INDOMARET',
        name: order.user_game_id || 'Alaikstore Customer',
        expected_amount: amount,
      }),
    })
    const json = await res.json()
    if (!res.ok) throw new Error(json.message || 'Xendit retail outlet code creation failed')
    return { reference: json.id, checkout_url: null, qr_url: null, va_number: json.payment_code, expired_at: json.expiration_date ?? null, raw: json }
  }

  throw new Error(`Unsupported payment_method for Xendit: ${order.payment_method}`)
}

/**
 * Xendit webhook verification: compares the `x-callback-token` header against
 * the verification token shown in Xendit Dashboard > Settings > Webhooks.
 */
export function verifyXenditToken(headerToken: string | null): boolean {
  const expected = Deno.env.get('XENDIT_CALLBACK_TOKEN')
  if (!expected || !headerToken) return false
  return safeEqual(expected, headerToken)
}

export function mapXenditStatus(event: string, status?: string): 'paid' | 'failed' | 'pending' {
  const s = (status || event || '').toUpperCase()
  if (['PAID', 'SUCCEEDED', 'COMPLETED', 'ACTIVE'].includes(s)) return 'paid'
  if (['EXPIRED', 'FAILED', 'VOIDED'].includes(s)) return 'failed'
  return 'pending'
}
