// Tokovoucher integration — https://docs.tokovoucher.net
// Endpoint: POST https://api.tokovoucher.net/v1/transaksi
// Signature: md5(MEMBER_CODE:SECRET:REF_ID)

import { md5Hex, safeEqual } from './crypto2.ts'
import type { ProviderResult } from './digiflazz.ts'

const BASE_URL = 'https://api.tokovoucher.net/v1'

export async function topupTokovoucher(order: any, productCode: string): Promise<ProviderResult> {
  const memberCode = Deno.env.get('TOKOVOUCHER_MEMBER_CODE')
  const secret = Deno.env.get('TOKOVOUCHER_SECRET')
  if (!memberCode || !secret) throw new Error('Tokovoucher credentials are not configured')

  const refId = order.id
  const signature = await md5Hex(`${memberCode}:${secret}:${refId}`)

  const res = await fetch(`${BASE_URL}/transaksi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref_id: refId,
      produk: productCode,
      tujuan: order.user_game_id,
      server_id: order.server_id || '',
      member_code: memberCode,
      signature,
    }),
  })
  const json = await res.json()
  if (json.status === 0) throw new Error(json.error_msg || 'Tokovoucher: order failed')

  const status = json.status === 'sukses' ? 'success' : json.status === 'gagal' ? 'failed' : 'pending'
  return { ref: json.trx_id, status, sn: json.sn || null, message: json.message, raw: json }
}

/** Tokovoucher webhook signature check — same formula as the transaction request. */
export async function verifyTokovoucherSignature(refId: string, signature: string | null): Promise<boolean> {
  if (!signature) return false
  const memberCode = Deno.env.get('TOKOVOUCHER_MEMBER_CODE')
  const secret = Deno.env.get('TOKOVOUCHER_SECRET')
  if (!memberCode || !secret) return false
  const expected = await md5Hex(`${memberCode}:${secret}:${refId}`)
  return safeEqual(expected, signature)
}

// ---------------------------------------------------------------------------
// Price list — GET /v1/produk lists every product Tokovoucher offers with
// current price + stock flag. Used by sync-provider-stock for auto price and
// stock updates.
// ---------------------------------------------------------------------------
import type { PriceListItem } from './digiflazz.ts'

export async function getTokovoucherPriceList(): Promise<PriceListItem[]> {
  const memberCode = Deno.env.get('TOKOVOUCHER_MEMBER_CODE')
  const secret = Deno.env.get('TOKOVOUCHER_SECRET')
  if (!memberCode || !secret) throw new Error('Tokovoucher credentials are not configured')

  const signature = await md5Hex(`${memberCode}:${secret}:produk`)
  const res = await fetch(`${BASE_URL}/produk?member_code=${memberCode}&signature=${signature}`, {
    method: 'GET',
  })
  const json = await res.json()
  const list = json.data
  if (!Array.isArray(list)) throw new Error(json.message || 'Tokovoucher: product-list failed')

  return list.map((item: any) => ({
    sku_code: String(item.kode ?? item.produk),
    price: Number(item.harga ?? item.price),
    in_stock: item.status === 'available' || item.status === 1 || item.status === true,
  }))
}
