// Midtrans integration — https://docs.midtrans.com/reference/core-api-overview
// Uses the Core API `/v2/charge` endpoint so we can pick the exact channel
// (QRIS, GoPay, ShopeePay, bank transfer VA, or convenience store) per order.

import { sha512Hex, safeEqual } from './crypto.ts'
import type { GatewayResult } from './tripay.ts'

const BASE_URL =
  Deno.env.get('MIDTRANS_MODE') === 'production'
    ? 'https://api.midtrans.com'
    : 'https://api.sandbox.midtrans.com'

const BANK_MAP: Record<string, string> = {
  bca_va: 'bca',
  bni_va: 'bni',
  bri_va: 'bri',
}

export async function createMidtransTransaction(order: any): Promise<GatewayResult> {
  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
  if (!serverKey) throw new Error('MIDTRANS_SERVER_KEY is not configured')
  const auth = btoa(`${serverKey}:`)

  const orderId = order.id
  const amount = Math.round(Number(order.amount))
  const returnUrl = `${Deno.env.get('APP_BASE_URL') || ''}/cek-pesanan?order=${orderId}`

  const payload: Record<string, unknown> = {
    transaction_details: { order_id: orderId, gross_amount: amount },
  }

  if (order.payment_method === 'qris') {
    payload.payment_type = 'qris'
    payload.qris = { acquirer: 'gopay' }
  } else if (order.payment_method === 'gopay') {
    payload.payment_type = 'gopay'
    payload.gopay = { enable_callback: true, callback_url: returnUrl }
  } else if (order.payment_method === 'shopeepay') {
    payload.payment_type = 'shopeepay'
    payload.shopeepay = { callback_url: returnUrl }
  } else if (order.payment_method === 'mandiri_va') {
    // Mandiri Bill Payment uses the separate `echannel` payment type in Midtrans
    payload.payment_type = 'echannel'
    payload.echannel = { bill_info1: 'Pembayaran', bill_info2: order.product_slug }
  } else if (BANK_MAP[order.payment_method]) {
    payload.payment_type = 'bank_transfer'
    payload.bank_transfer = { bank: BANK_MAP[order.payment_method] }
  } else if (order.payment_method === 'alfamart' || order.payment_method === 'indomaret') {
    payload.payment_type = 'cstore'
    payload.cstore = { store: order.payment_method === 'alfamart' ? 'alfamart' : 'indomaret', message: 'Top up Alaikstore' }
  } else {
    // Fallback to QRIS for e-wallets not directly modeled (DANA, LinkAja) — Midtrans
    // routes many wallets through GoPay QRIS acceptance depending on your contract.
    payload.payment_type = 'qris'
    payload.qris = { acquirer: 'gopay' }
  }

  const res = await fetch(`${BASE_URL}/v2/charge`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(payload),
  })
  const json = await res.json()
  if (json.status_code && !['200', '201'].includes(String(json.status_code))) {
    throw new Error(json.status_message || `Midtrans transaction failed (${json.status_code})`)
  }

  const qrAction = (json.actions || []).find((a: any) => a.name === 'generate-qr-code' || a.name === 'deeplink-redirect')

  return {
    reference: json.transaction_id,
    checkout_url: json.redirect_url || qrAction?.url || null,
    qr_url: json.actions?.find((a: any) => a.name === 'generate-qr-code')?.url || null,
    va_number: json.va_numbers?.[0]?.va_number || json.permata_va_number || json.bill_key || json.payment_code || null,
    expired_at: json.expiry_time || null,
    raw: json,
  }
}

/**
 * Midtrans webhook (HTTP notification) signature check.
 * signature_key = SHA512(order_id + status_code + gross_amount + ServerKey)
 */
export async function verifyMidtransSignature(payload: any): Promise<boolean> {
  const serverKey = Deno.env.get('MIDTRANS_SERVER_KEY')
  if (!serverKey) return false
  const { order_id, status_code, gross_amount, signature_key } = payload
  if (!order_id || !status_code || !gross_amount || !signature_key) return false
  const expected = await sha512Hex(`${order_id}${status_code}${gross_amount}${serverKey}`)
  return safeEqual(expected, signature_key)
}

export function mapMidtransStatus(transactionStatus: string, fraudStatus?: string): 'paid' | 'failed' | 'pending' {
  if (transactionStatus === 'capture') return fraudStatus === 'accept' ? 'paid' : 'pending'
  if (transactionStatus === 'settlement') return 'paid'
  if (['deny', 'cancel', 'expire', 'failure'].includes(transactionStatus)) return 'failed'
  return 'pending'
}
