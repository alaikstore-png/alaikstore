// Supabase Edge Function: provider-status-check
// Deploy: supabase functions deploy provider-status-check
//
// MedanPedia (and any other provider without a documented push webhook) never
// tells us proactively when an order finishes — we have to ask. Call this with
// { order_id } from the "Cek Status Pesanan" page (manual refresh button) or on
// a schedule via Supabase's pg_cron + pg_net for orders stuck in "processing".
// Providers with a real webhook (Digiflazz / VIP Reseller / Tokovoucher) don't
// need this — they push updates to provider-webhook instead.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { getMedanPediaStatus } from '../_shared/medanpedia.ts'
import { maybeGrantReferralBonus } from '../_shared/referral.ts'
import { sendEmail, getUserEmail, paymentSuccessEmailTemplate, paymentFailedEmailTemplate } from '../_shared/email.ts'
import { sendPushToUser } from '../_shared/push.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

serve(async (req) => {
  const { order_id } = await req.json()
  const { data: order } = await supabase.from('orders').select('*').eq('id', order_id).single()
  if (!order) return json({ error: 'order not found' }, 404)

  if (order.status !== 'processing') {
    return json({ status: order.status, message: 'Nothing to poll — order is not in processing state' })
  }
  if (order.provider_name !== 'MedanPedia' || !order.provider_ref) {
    return json({ status: order.status, message: 'This provider reports status via webhook, not polling' })
  }

  try {
    const result = await getMedanPediaStatus(order.provider_ref)
    if (result.status === 'pending') {
      return json({ status: 'processing', provider_status: result.message })
    }

    const finalStatus = result.status === 'success' ? 'success' : 'failed'
    await supabase.from('orders').update({ status: finalStatus }).eq('id', order.id)
    await supabase.from('logs').insert({ type: 'provider_status_check', message: `MedanPedia -> ${finalStatus}`, payload: { order_id: order.id, raw: result.raw } })

    if (finalStatus === 'success') {
      await maybeGrantReferralBonus(supabase, order.user_id, order.id)
    }
    await notifyOrderEmail(order, finalStatus)
    await notifyOrderPush(order, finalStatus)

    return json({ status: finalStatus })
  } catch (err) {
    await supabase.from('logs').insert({ type: 'provider_status_check_error', message: String(err), payload: { order_id: order.id } })
    return json({ error: String(err) }, 502)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}

// Same best-effort pattern as payment-callback/provider-webhook: an email
// failure here must never affect the order-status update above.
async function notifyOrderEmail(order: any, kind: 'success' | 'failed') {
  try {
    const email = await getUserEmail(supabase, order.user_id)
    if (!email) return

    const html = kind === 'success' ? paymentSuccessEmailTemplate(order) : paymentFailedEmailTemplate(order, 'failed')
    const subject = kind === 'success' ? 'Pembayaran berhasil - Alaikstore' : 'Pembayaran gagal/kedaluwarsa - Alaikstore'
    const result = await sendEmail({ to: email, subject, html })

    await supabase.from('logs').insert({
      type: result.ok ? `order_email_${kind}_sent` : `order_email_${kind}_failed`,
      message: result.ok ? `Order email (${kind}) sent to ${email}` : String(result.error),
      payload: { order_id: order.id, email },
    })
  } catch (err) {
    await supabase.from('logs').insert({ type: 'order_email_error', message: String(err), payload: { order_id: order?.id } })
  }
}

// Push counterpart, same best-effort contract.
async function notifyOrderPush(order: any, kind: 'success' | 'failed') {
  try {
    const title = kind === 'success' ? '✅ Pembayaran Berhasil' : '❌ Pembayaran Gagal'
    const body =
      kind === 'success'
        ? `Pesanan ${order.product_slug || ''} kamu sudah diproses. Terima kasih!`
        : `Pesanan ${order.product_slug || ''} gagal. Cek riwayat transaksi untuk detail.`
    const result = await sendPushToUser(supabase, order.user_id, { title, body, url: `/riwayat-transaksi` })
    await supabase.from('logs').insert({
      type: `order_push_${kind}`,
      message: `Push ${kind}: sent=${result.sent} failed=${result.failed}`,
      payload: { order_id: order.id },
    })
  } catch (err) {
    await supabase.from('logs').insert({ type: 'order_push_error', message: String(err), payload: { order_id: order?.id } })
  }
}
