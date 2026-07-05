import axios from 'axios'
import { supabase } from './supabaseClient'

const functionsBase = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`

export const api = axios.create({
  baseURL: functionsBase,
  headers: { 'Content-Type': 'application/json' },
})

// Attach current user's access token automatically to every request
api.interceptors.request.use(async (config) => {
  const { data } = await supabase.auth.getSession()
  const token = data?.session?.access_token
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

/**
 * ---- API helper functions ----
 * These call Supabase Edge Functions (see /supabase/functions) which hold the
 * real secret keys for Tripay / Midtrans / Xendit and the top-up providers
 * (VIP Reseller, Digiflazz, APIGames, Tokovoucher). The frontend never talks
 * to those providers directly.
 */

// Create a new order + payment transaction
export async function createOrder(payload) {
  const { data } = await api.post('/create-order', payload)
  return data
}

// Check the live status of an order (also mirrored via Supabase Realtime)
export async function checkOrderStatus(orderId) {
  const { data } = await api.get(`/order-status/${orderId}`)
  return data
}

// Manually poll a provider that has no push webhook (currently: MedanPedia).
// No-op (returns the order's current status) for providers that push their own
// updates via provider-webhook.
export async function pollProviderStatus(orderId) {
  const { data } = await api.post('/provider-status-check', { order_id: orderId })
  return data
}

// Validate a promo/voucher code against current cart total
export async function validatePromo(code, subtotal) {
  const { data } = await api.post('/validate-promo', { code, subtotal })
  return data
}

export default api
