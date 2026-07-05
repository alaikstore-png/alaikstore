// MedanPedia integration — https://medanpedia.co.id (base API: https://api.medanpedia.co.id)
//
// IMPORTANT — MedanPedia is an SMM panel (social media marketing: followers, likes,
// views, etc.), NOT a game-topup/PPOB provider like Digiflazz or VIP Reseller. It
// follows the common "SMM panel API" convention shared by most Indonesian reseller
// panels: POST form fields { api_id, api_key, action, ... } to a single endpoint,
// where `action` picks the operation (profile / services / order / status / refill).
// Wire this up as a provider if/when Alaikstore sells social-media boost products
// (e.g. an "Sosial Media" category) — for game diamonds/pulsa/PLN keep using
// Digiflazz / VIP Reseller / Tokovoucher. There is no publicly documented push
// webhook for MedanPedia, so order status must be polled via `getMedanPediaStatus`
// (e.g. a periodic cron calling provider-topup's status-check, or on-demand from
// the Cek Status Pesanan page) rather than relying on provider-webhook.

const BASE_URL = 'https://api.medanpedia.co.id'

export interface ProviderResult {
  ref: string
  status: 'pending' | 'success' | 'failed'
  sn: string | null
  message: string
  raw: unknown
}

function credentials() {
  const apiId = Deno.env.get('MEDANPEDIA_API_ID')
  const apiKey = Deno.env.get('MEDANPEDIA_API_KEY')
  if (!apiId || !apiKey) throw new Error('MedanPedia credentials are not configured (MEDANPEDIA_API_ID / MEDANPEDIA_API_KEY)')
  return { apiId, apiKey }
}

async function post(path: string, params: Record<string, string>) {
  const { apiId, apiKey } = credentials()
  const body = new URLSearchParams({ api_id: apiId, api_key: apiKey, ...params })
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  const json = await res.json()
  return json
}

/**
 * Places an order. `serviceId` is MedanPedia's numeric service id (map this per
 * product via `sku_code` in the `products` table, same as other providers).
 * `target` is the target of the service — e.g. a username/link/game-ID, whatever
 * the mapped service expects.
 */
export async function orderMedanPedia(order: any, serviceId: string): Promise<ProviderResult> {
  const json = await post('/order', {
    service: serviceId,
    target: order.user_game_id,
    quantity: String(order.quantity || 1),
    custom_id: order.id, // stored so provider-webhook / status polling can map back to our order
  })

  if (json.status !== true || !json.data?.id) {
    throw new Error(json?.data?.msg || json?.msg || 'MedanPedia: order failed')
  }

  return { ref: String(json.data.id), status: 'pending', sn: null, message: 'Order diteruskan ke MedanPedia', raw: json }
}

/** Polls order status. Map MedanPedia's status strings to our internal set. */
export async function getMedanPediaStatus(providerRef: string): Promise<ProviderResult> {
  const json = await post('/status', { id: providerRef })
  const d = json?.data
  if (!d) throw new Error(json?.msg || 'MedanPedia: status check failed')

  const raw = String(d.status || '').toLowerCase()
  const status = raw === 'completed' ? 'success' : raw === 'canceled' || raw === 'error' ? 'failed' : 'pending'
  return { ref: providerRef, status, sn: null, message: d.status || 'pending', raw: json }
}

export async function getMedanPediaBalance(): Promise<{ balance: number; raw: unknown }> {
  const json = await post('/profile', {})
  return { balance: Number(json?.data?.balance || 0), raw: json }
}
