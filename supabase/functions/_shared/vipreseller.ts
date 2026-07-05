// VIP Reseller (VIPayment) integration — https://vip-reseller.co.id/page/api/game-feature
// Endpoint: POST https://vip-reseller.co.id/api/game-feature
// Signature: md5(API_ID + API_KEY), sent as `sign`; `key` param carries the raw API key.
// Webhook signature: header X-Client-Signature: md5(API_ID + API_KEY)

import { md5Hex, safeEqual } from './crypto2.ts'
import type { ProviderResult } from './digiflazz.ts'

const BASE_URL = 'https://vip-reseller.co.id/api/game-feature'

export async function topupVipReseller(order: any, serviceCode: string): Promise<ProviderResult> {
  const apiId = Deno.env.get('VIP_RESELLER_API_ID')
  const apiKey = Deno.env.get('VIP_RESELLER_API_KEY')
  if (!apiId || !apiKey) throw new Error('VIP Reseller credentials are not configured')

  const sign = await md5Hex(`${apiId}${apiKey}`)

  const body = new URLSearchParams({
    key: apiKey,
    sign,
    type: 'order',
    service: serviceCode,
    data_no: order.user_game_id,
    ...(order.server_id ? { data_zone: order.server_id } : {}),
  })

  const res = await fetch(BASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const json = await res.json()
  if (!json.result) throw new Error(json.message || 'VIP Reseller: order failed')

  const d = json.data
  const status = d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'pending'
  return { ref: d.trxid, status, sn: d.data || null, message: json.message, raw: d }
}

/** VIP Reseller webhook signature check (header X-Client-Signature: md5(API_ID+API_KEY)) */
export async function verifyVipResellerSignature(headerSignature: string | null): Promise<boolean> {
  if (!headerSignature) return false
  const apiId = Deno.env.get('VIP_RESELLER_API_ID')
  const apiKey = Deno.env.get('VIP_RESELLER_API_KEY')
  if (!apiId || !apiKey) return false
  const expected = await md5Hex(`${apiId}${apiKey}`)
  return safeEqual(expected, headerSignature)
}

// ---------------------------------------------------------------------------
// Price list — `type: 'services'` returns every service VIP Reseller offers,
// grouped by game/category. Used by sync-provider-stock for auto price/stock
// updates instead of manual entry. Response shape groups services under
// category keys, so we flatten every group into one flat array.
// ---------------------------------------------------------------------------
import type { PriceListItem } from './digiflazz.ts'

export async function getVipResellerPriceList(): Promise<PriceListItem[]> {
  const apiId = Deno.env.get('VIP_RESELLER_API_ID')
  const apiKey = Deno.env.get('VIP_RESELLER_API_KEY')
  if (!apiId || !apiKey) throw new Error('VIP Reseller credentials are not configured')

  const sign = await md5Hex(`${apiId}${apiKey}`)
  const body = new URLSearchParams({ key: apiKey, sign, type: 'services' })

  const res = await fetch(BASE_URL, { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body })
  const json = await res.json()
  if (!json.result) throw new Error(json.message || 'VIP Reseller: price-list failed')

  // json.data is typically { "<Game Name>": [ { id/service, name, price, status }, ... ], ... }
  const groups = json.data && typeof json.data === 'object' ? Object.values(json.data) : []
  const flat: any[] = groups.flat ? (groups as any[]).flat() : ([] as any[]).concat(...(groups as any[]))

  return flat.map((item: any) => ({
    sku_code: String(item.service ?? item.id),
    price: Number(item.price),
    in_stock: item.status === true || item.status === 'available' || item.status === 'ready',
  }))
}
