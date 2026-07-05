// APIGames integration — https://docs.apigames.id
// Endpoint: POST https://v1.apigames.id/v2/transaksi
// Signature formula is documented as md5-based but the exact concatenation order
// is not published verbatim in the public docs at time of writing. The convention
// used across third-party integrations (and consistent with APIGames' other signed
// endpoints such as cek-username) is md5(merchant_id + ref_id + secret).
// >>> Verify this against your APIGames dashboard / support before going live <<<

import { md5Hex } from './crypto2.ts'
import type { ProviderResult } from './digiflazz.ts'

const BASE_URL = 'https://v1.apigames.id/v2'

export async function topupApiGames(order: any, productCode: string): Promise<ProviderResult> {
  const merchantId = Deno.env.get('APIGAMES_MERCHANT_ID')
  const secret = Deno.env.get('APIGAMES_SECRET')
  if (!merchantId || !secret) throw new Error('APIGames credentials are not configured')

  const refId = order.id
  const signature = await md5Hex(`${merchantId}${refId}${secret}`)

  const res = await fetch(`${BASE_URL}/transaksi`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ref_id: refId,
      merchant_id: merchantId,
      produk: productCode,
      tujuan: order.user_game_id,
      server_id: order.server_id || '',
      signature,
    }),
  })
  const json = await res.json()
  if (json.status !== 1 || !json.data) throw new Error(json.error_msg || json.message || 'APIGames: order failed')

  const d = json.data
  const status = d.status === 'Sukses' ? 'success' : d.status === 'Gagal' ? 'failed' : 'pending'
  return { ref: d.trx_id, status, sn: d.sn || null, message: d.message, raw: d }
}

// ---------------------------------------------------------------------------
// Price list — used by sync-provider-stock for auto price/stock updates.
// Same caveat as the topup signature above: APIGames' exact list endpoint
// and field names aren't nailed down in public docs at time of writing.
// >>> Verify the endpoint path and response fields against your APIGames
// dashboard/support before relying on this in production. <<<
// ---------------------------------------------------------------------------
import type { PriceListItem } from './digiflazz.ts'

export async function getApiGamesPriceList(): Promise<PriceListItem[]> {
  const merchantId = Deno.env.get('APIGAMES_MERCHANT_ID')
  const secret = Deno.env.get('APIGAMES_SECRET')
  if (!merchantId || !secret) throw new Error('APIGames credentials are not configured')

  const signature = await md5Hex(`${merchantId}pricelist${secret}`)
  const res = await fetch(`${BASE_URL}/list-produk?merchant_id=${merchantId}&signature=${signature}`, {
    method: 'GET',
  })
  const json = await res.json()
  const list = json.data
  if (!Array.isArray(list)) throw new Error(json.error_msg || json.message || 'APIGames: product-list failed')

  return list.map((item: any) => ({
    sku_code: String(item.produk ?? item.kode),
    price: Number(item.harga ?? item.price),
    in_stock: item.status === 'normal' || item.status === 1 || item.status === true,
  }))
}
