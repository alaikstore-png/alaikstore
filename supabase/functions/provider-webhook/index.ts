// Supabase Edge Function: provider-webhook
// Deploy: supabase functions deploy provider-webhook --no-verify-jwt
// Set this as the callback/report/webhook URL in each provider's dashboard:
//   .../provider-webhook?provider=digiflazz
//   .../provider-webhook?provider=vip-reseller
//   .../provider-webhook?provider=tokovoucher
//   (APIGames: poll via cek-status instead — no public webhook signature scheme confirmed)
//   (MedanPedia: no push webhook either — poll via provider-status-check instead)
//
// Providers often answer the initial order call with "Pending" and report the
// final success/failure asynchronously here — this closes the loop so `orders`
// (and the realtime-subscribed Cek Status Pesanan page) reflect the true outcome.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { verifyDigiflazzSignature } from '../_shared/digiflazz.ts'
import { verifyVipResellerSignature } from '../_shared/vipreseller.ts'
import { verifyTokovoucherSignature } from '../_shared/tokovoucher.ts'
import { maybeGrantReferralBonus } from '../_shared/referral.ts'
import { sendEmail, getUserEmail, paymentSuccessEmailTemplate, paymentFailedEmailTemplate } from '../_shared/email.ts'
import { sendPushToUser } from '../_shared/push.ts'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

serve(async (req) => {
  const provider = new URL(req.url).searchParams.get('provider')
  const rawBody = await req.text()

  try {
    let refId: string | null = null
    let status: 'success' | 'failed' | 'pending' = 'pending'
    let payload: any = {}

    if (provider === 'digiflazz') {
      const valid = await verifyDigiflazzSignature(rawBody, req.headers.get('X-Hub-Signature'))
      if (!valid) return await reject('invalid digiflazz signature', rawBody)
      payload = JSON.parse(rawBody)
      const d = payload.data
      refId = d.ref_id
      status = d.status === 'Sukses' ? 'success' : d.status === 'Gagal' ? 'failed' : 'pending'
    } else if (provider === 'vip-reseller') {
      const valid = await verifyVipResellerSignature(req.headers.get('X-Client-Signature'))
      if (!valid) return await reject('invalid vip-reseller signature', rawBody)
      payload = JSON.parse(rawBody)
      const d = payload.data
      refId = d.trxid
      status = d.status === 'success' ? 'success' : d.status === 'error' ? 'failed' : 'pending'
    } else if (provider === 'tokovoucher') {
      payload = JSON.parse(rawBody)
      const valid = await verifyTokovoucherSignature(payload.ref_id, payload.signature)
      if (!valid) return await reject('invalid tokovoucher signature', rawBody)
      refId = payload.ref_id
      status = payload.status === 'sukses' ? 'success' : payload.status === 'gagal' ? 'failed' : 'pending'
    } else {
      return new Response('unknown provider', { status: 400 })
    }

    if (!refId) return new Response('missing ref id', { status: 400 })
    if (status === 'pending') return new Response('ok', { status: 200 }) // nothing to update yet

    // ref_id was set to our order.id when the top-up request was created, so it maps directly.
    const { data: order } = await supabase.from('orders').update({ status }).eq('id', refId).select('*').maybeSingle()
    await supabase.from('logs').insert({ type: 'provider_webhook', message: `${provider} -> ${status}`, payload: { ref_id: refId, provider } })

    if (status === 'success' && order?.user_id) {
      await maybeGrantReferralBonus(supabase, order.user_id, refId)
    }
    // This is where async providers (no instant answer at order time) finally
    // confirm success/failure, so the buyer's email notification belongs here
    // too — not just in payment-callback's synchronous path.
    if (order) {
      await notifyOrderEmail(order, status as 'success' | 'failed')
      await notifyOrderPush(order, status as 'success' | 'failed')
    }

    return new Response('ok', { status: 200 })
  } catch (err) {
    await supabase.from('logs').insert({ type: 'provider_webhook_error', message: String(err), payload: { provider, rawBody: rawBody.slice(0, 2000) } })
    return new Response('error', { status: 500 })
  }
})

async function reject(reason: string, rawBody: string) {
  await supabase.from('logs').insert({ type: 'provider_webhook_rejected', message: reason, payload: { rawBody: rawBody.slice(0, 2000) } })
  return new Response(reason, { status: 401 })
}

// Same best-effort pattern as payment-callback: an email failure here must
// never affect the order-status update above.
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
