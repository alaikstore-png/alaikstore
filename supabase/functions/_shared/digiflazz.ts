// Digiflazz integration — https://developer.digiflazz.com
// Endpoint: POST https://api.digiflazz.com/v1/transaction
// Signature: md5(username + api_key + ref_id)
// Webhook signature: header X-Hub-Signature: sha1=HMAC-SHA1(raw_body, webhook_secret)

import { md5Hex, hmacSha1Hex, safeEqual } from './crypto2.ts'

const BASE_URL = 'https://api.digiflazz.com/v1'

export interface ProviderResult {
  ref: string
  status: 'pending' | 'success' | 'failed'
  sn: string | null
  message: string
  raw: unknown
}

export async function topupDigiflazz(order: any, buyerSkuCode: string): Promise<ProviderResult> {
  const username = Deno.env.get('DIGIFLAZZ_USERNAME')
  const apiKey = Deno.env.get('DIGIFLAZZ_API_KEY')
  if (!username || !apiKey) throw new Error('Digiflazz credentials are not configured')

  const refId = order.id
  const sign = await md5Hex(`${username}${apiKey}${refId}`)

  const res = await fetch(`${BASE_URL}/transaction`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      username,
      buyer_sku_code: buyerSkuCode,
      customer_no: order.server_id ? `${order.user_game_id}${order.server_id}` : order.user_game_id,
      ref_id: refId,
      sign,
    }),
  })
  const json = await res.json()
  const d = json.data
  if (!d) throw new Error(json.message || 'Digiflazz: unexpected response')

  const status = d.status === 'Sukses' ? 'success' : d.status === 'Gagal' ? 'failed' : 'pending'
  return { ref: d.ref_id, status, sn: d.sn || null, message: d.message, raw: d }
}

/** Digiflazz webhook signature check (X-Hub-Signature: sha1=...) */
export async function verifyDigiflazzSignature(rawBody: string, signatureHeader: string | null): Promise<boolean> {
  if (!signatureHeader) return false
  const secret = Deno.env.get('DIGIFLAZZ_WEBHOOK_SECRET')
  if (!secret) return false
  const expected = `sha1=${await hmacSha1Hex(secret, rawBody)}`
  return safeEqual(expected, signatureHeader)
}

// ---------------------------------------------------------------------------
// Price list — used by the sync-provider-stock function to auto-update
// `product_provider_links.provider_price` and stock availability, instead of
// admins having to type prices in by hand.
// Docs: POST /v1/price-list, sign = md5(username + api_key + 'pricelist')
// ---------------------------------------------------------------------------
export interface PriceListItem {
  sku_code: string
  price: number
  in_stock: boolean
}

export async function getDigiflazzPriceList(): Promise<PriceListItem[]> {
  const username = Deno.env.get('DIGIFLAZZ_USERNAME')
  const apiKey = Deno.env.get('DIGIFLAZZ_API_KEY')
  if (!username || !apiKey) throw new Error('Digiflazz credentials are not configured')

  const sign = await md5Hex(`${username}${apiKey}pricelist`)
  const res = await fetch(`${BASE_URL}/price-list`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ cmd: 'prepaid', username, sign }),
  })
  const json = await res.json()
  const list = json.data
  if (!Array.isArray(list)) throw new Error(json.message || 'Digiflazz: unexpected price-list response')

  return list.map((item: any) => ({
    sku_code: item.buyer_sku_code,
    price: Number(item.price),
    in_stock: Boolean(item.buyer_product_status) && Boolean(item.seller_product_status) &&
      (Boolean(item.unlimited_stock) || Number(item.stock || 0) > 0),
  }))
}
