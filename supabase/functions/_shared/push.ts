// Shared helper for Web Push notifications (VAPID). Used by:
// - send-push-notification (standalone function, callable from the frontend
//   admin panel for broadcast announcements like "Flash Sale dimulai!")
// - payment-callback / provider-webhook (best-effort push right after an
//   order becomes success/failed, same pattern as notifyOrderEmail)
//
// Requires two Edge Function secrets:
//   VAPID_PUBLIC_KEY  — also exposed to the frontend as VITE_VAPID_PUBLIC_KEY
//   VAPID_PRIVATE_KEY
//   VAPID_SUBJECT     — mailto:you@yourdomain.com or https://yourdomain.com
// Generate a pair once with: npx web-push generate-vapid-keys

import webpush from 'npm:web-push@3.6.7'

let configured = false

function ensureConfigured() {
  if (configured) return
  const publicKey = Deno.env.get('VAPID_PUBLIC_KEY')
  const privateKey = Deno.env.get('VAPID_PRIVATE_KEY')
  const subject = Deno.env.get('VAPID_SUBJECT') || 'mailto:admin@alaikstore.com'
  if (!publicKey || !privateKey) {
    throw new Error('VAPID_PUBLIC_KEY / VAPID_PRIVATE_KEY belum di-set sebagai Edge Function secret')
  }
  webpush.setVapidDetails(subject, publicKey, privateKey)
  configured = true
}

/**
 * Sends one push notification to one subscription. Returns true/false instead
 * of throwing — a single dead/expired subscription must never take down a
 * broadcast to everyone else. Auto-deletes the subscription row on 404/410
 * (browser unsubscribed / endpoint expired), which is the standard Web Push
 * contract for cleaning up stale subscriptions.
 */
export async function sendPushToSubscription(supabaseAdmin: any, sub: any, payload: { title: string; body: string; url?: string; icon?: string }) {
  try {
    ensureConfigured()
    await webpush.sendNotification(
      { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } },
      JSON.stringify({ icon: '/logo-192.png', ...payload })
    )
    return true
  } catch (err: any) {
    const statusCode = err?.statusCode
    if (statusCode === 404 || statusCode === 410) {
      await supabaseAdmin.from('push_subscriptions').delete().eq('id', sub.id)
    }
    await supabaseAdmin.from('logs').insert({
      type: 'push_send_failed',
      message: String(err?.message || err),
      payload: { subscription_id: sub.id, statusCode },
    })
    return false
  }
}

/** Sends to every subscription belonging to one user (they may have several devices/browsers). */
export async function sendPushToUser(supabaseAdmin: any, userId: string, payload: { title: string; body: string; url?: string }) {
  if (!userId) return { sent: 0, failed: 0 }
  const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*').eq('user_id', userId)
  let sent = 0
  let failed = 0
  for (const sub of subs || []) {
    const ok = await sendPushToSubscription(supabaseAdmin, sub, payload)
    ok ? sent++ : failed++
  }
  return { sent, failed }
}

/** Broadcasts to every subscribed device (used for flash sale / general announcements). */
export async function broadcastPush(supabaseAdmin: any, payload: { title: string; body: string; url?: string }) {
  const { data: subs } = await supabaseAdmin.from('push_subscriptions').select('*')
  let sent = 0
  let failed = 0
  for (const sub of subs || []) {
    const ok = await sendPushToSubscription(supabaseAdmin, sub, payload)
    ok ? sent++ : failed++
  }
  return { sent, failed }
}
