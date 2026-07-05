// Client-side Web Push helper. Handles:
// - registering /service-worker.js
// - asking browser permission
// - subscribing with our VAPID public key
// - saving/removing the subscription row in `push_subscriptions`
//
// The actual sending happens server-side (see supabase/functions/_shared/push.ts)
// via the Web Push protocol — this file only sets up the browser side.

import { supabase } from './supabaseClient'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

// Web Push requires the VAPID key as a Uint8Array, but env vars only give us
// a base64url string — this is the standard conversion snippet for that.
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = atob(base64)
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)))
}

export function isPushSupported() {
  return typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window
}

export function getPushPermission() {
  if (!isPushSupported()) return 'unsupported'
  return Notification.permission // 'default' | 'granted' | 'denied'
}

/**
 * Registers the service worker, asks for permission, subscribes to push, and
 * saves the subscription against the current user (if logged in). Safe to
 * call multiple times — Supabase upserts on the unique `endpoint` column.
 */
export async function subscribeToPush(userId) {
  if (!isPushSupported()) throw new Error('Browser ini tidak mendukung push notification.')
  if (!VAPID_PUBLIC_KEY) throw new Error('VITE_VAPID_PUBLIC_KEY belum diset di .env')

  const registration = await navigator.serviceWorker.register('/service-worker.js')
  await navigator.serviceWorker.ready

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') throw new Error('Izin notifikasi ditolak.')

  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
    })
  }

  const json = subscription.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      user_id: userId || null,
      endpoint: json.endpoint,
      p256dh: json.keys.p256dh,
      auth: json.keys.auth,
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint' }
  )
  if (error) throw error

  return subscription
}

/** Unsubscribes this browser and removes its row so it stops receiving pushes. */
export async function unsubscribeFromPush() {
  if (!isPushSupported()) return
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  if (!subscription) return

  const endpoint = subscription.endpoint
  await subscription.unsubscribe()
  await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
}

/** Quick check used by the UI to decide whether to show "Aktifkan" or "Nonaktifkan". */
export async function isSubscribedToPush() {
  if (!isPushSupported()) return false
  const registration = await navigator.serviceWorker.getRegistration()
  const subscription = await registration?.pushManager.getSubscription()
  return !!subscription
}
