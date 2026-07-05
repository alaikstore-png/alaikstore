// Supabase Edge Function: payment-callback
// Deploy: supabase functions deploy payment-callback --no-verify-jwt
// Set as the webhook/callback URL in each gateway's dashboard, with ?gateway=
// query param matching the sender:
//   Tripay:    .../payment-callback?gateway=tripay
//   Midtrans:  .../payment-callback?gateway=midtrans
//   Xendit:    .../payment-callback?gateway=xendit
//   Duitku:    .../payment-callback?gateway=duitku
//
// Flow: gateway confirms payment -> verify signature (real, per-gateway) ->
//   - if the order is a balance deposit ("deposit-saldo"): credit the user's
//     balance directly and mark the order success
//   - otherwise: mark "processing" -> call provider-topup -> mark success/failed
// Either way, a first-ever successful order triggers the referrer's bonus (if any).

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { verifyTripaySignature, mapTripayStatus } from '../_shared/tripay.ts'
import { verifyMidtransSignature, mapMidtransStatus } from '../_shared/midtrans.ts'
import { verifyXenditToken, mapXenditStatus } from '../_shared/xendit.ts'
import { verifyDuitkuCallback, mapDuitkuStatus } from '../_shared/duitku.ts'
import { creditBalance, maybeGrantReferralBonus } from '../_shared/referral.ts'
import { maybeGrantCashback, maybeGrantAffiliateCommission } from '../_shared/rewards.ts'
import { sendEmail, getUserEmail, paymentSuccessEmailTemplate, paymentFailedEmailTemplate } from '../_shared/email.ts'
import { sendPushToUser } from '../_shared/push.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')! // service role: bypasses RLS, server-side only
)

serve(async (req) => {
  const gateway = new URL(req.url).searchParams.get('gateway')
  const rawBody = await req.text() // read raw text FIRST — Tripay's signature is computed over the exact raw bytes

  try {
    let orderId: string | null = null
    let paymentStatus: 'paid' | 'failed' | 'pending' = 'pending'
    let gatewayRef: string | null = null
    let payload: any = {}

    if (gateway === 'tripay') {
      const signature = req.headers.get('X-Callback-Signature')
      const valid = await verifyTripaySignature(rawBody, signature)
      if (!valid) return await reject('invalid tripay signature', rawBody)

      payload = JSON.parse(rawBody)
      orderId = payload.merchant_ref
      paymentStatus = mapTripayStatus(payload.status)
      gatewayRef = payload.reference
    } else if (gateway === 'midtrans') {
      payload = JSON.parse(rawBody)
      const valid = await verifyMidtransSignature(payload)
      if (!valid) return await reject('invalid midtrans signature', rawBody)

      orderId = payload.order_id
      paymentStatus = mapMidtransStatus(payload.transaction_status, payload.fraud_status)
      gatewayRef = payload.transaction_id
    } else if (gateway === 'xendit') {
      const token = req.headers.get('x-callback-token')
      if (!verifyXenditToken(token)) return await reject('invalid xendit callback token', rawBody)

      payload = JSON.parse(rawBody)
      orderId = payload.reference_id || payload.external_id
      paymentStatus = mapXenditStatus(payload.event, payload.status)
      gatewayRef = payload.id
    } else if (gateway === 'duitku') {
      // Duitku posts application/x-www-form-urlencoded, not JSON.
      const fields = new URLSearchParams(rawBody)
      const valid = await verifyDuitkuCallback(fields)
      if (!valid) return await reject('invalid duitku signature', rawBody)

      payload = Object.fromEntries(fields.entries())
      orderId = fields.get('merchantOrderId')
      paymentStatus = mapDuitkuStatus(fields.get('resultCode'))
      gatewayRef = fields.get('reference')
    } else {
      return new Response('unknown gateway', { status: 400 })
    }

    if (!orderId) return new Response('missing order id', { status: 400 })

    await supabase
      .from('payments')
      .update({ status: paymentStatus, gateway_ref: gatewayRef, raw_callback: payload, paid_at: paymentStatus === 'paid' ? new Date().toISOString() : null })
      .eq('order_id', orderId)
      .eq('gateway', gateway)

    if (paymentStatus === 'failed') {
      const { data: failedOrder } = await supabase.from('orders').update({ status: 'failed' }).eq('id', orderId).select('*').single()
      // Gateways collapse both "declined" and "timed out waiting for payment"
      // into this same branch, so the email covers "gagal/expired" together.
      if (failedOrder) await notifyOrderEmail(failedOrder, 'failed')
      return okResponse(gateway)
    }
    if (paymentStatus === 'pending') {
      return okResponse(gateway) // wait for the eventual paid/failed callback
    }

    // paymentStatus === 'paid' from here on
    const { data: order } = await supabase.from('orders').select('*').eq('id', orderId).single()
    if (!order) return new Response('order not found', { status: 404 })

    if (order.product_slug === 'deposit-saldo') {
      // Balance top-up: credit directly, no top-up provider involved.
      await creditBalance(supabase, order.user_id, Number(order.amount))
      await supabase.from('orders').update({ status: 'success' }).eq('id', orderId)
      await maybeGrantReferralBonus(supabase, order.user_id, orderId)
      await notifyOrderEmail(order, 'success')
      // Deposit ke saldo sendiri sengaja TIDAK memicu cashback/komisi affiliate
      // (mencegah orang deposit berulang cuma untuk memanen cashback).
      return okResponse(gateway)
    }

    // Regular game/product top-up: hand off to the top-up provider
    await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId)

    const topupRes = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/provider-topup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')}`,
      },
      body: JSON.stringify({ order_id: orderId }),
    })
    const result = await topupRes.json()

    if (result.keep_processing) {
      // Order stays "processing" — provider (MedanPedia) has no webhook to confirm
      // the real outcome later, so we don't optimistically mark it "success".
      await supabase.from('orders').update({ provider_ref: result.provider_ref || null }).eq('id', orderId)
      return okResponse(gateway)
    }

    const finalStatus = result.success ? 'success' : 'failed'
    await supabase.from('orders').update({ status: finalStatus, provider_ref: result.provider_ref || null }).eq('id', orderId)

    if (finalStatus === 'success') {
      await maybeGrantReferralBonus(supabase, order.user_id, orderId)
      await maybeGrantCashback(supabase, order)
      await maybeGrantAffiliateCommission(supabase, order)
    }
    await notifyOrderEmail(order, finalStatus)
    await notifyOrderPush(order, finalStatus)

    return okResponse(gateway)
  } catch (err) {
    await supabase.from('logs').insert({ type: 'payment_callback_error', message: String(err), payload: { gateway, rawBody: rawBody.slice(0, 2000) } })
    return new Response('error', { status: 500 })
  }
})

async function reject(reason: string, rawBody: string) {
  await supabase.from('logs').insert({ type: 'payment_callback_rejected', message: reason, payload: { rawBody: rawBody.slice(0, 2000) } })
  return new Response(reason, { status: 401 })
}

// Emails the buyer that their order succeeded or failed. Best-effort: a
// missing RESEND_API_KEY, an unfindable email, or a Resend API error must
// never fail the payment/order flow above, so every failure just gets logged.
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

// Push notification counterpart to notifyOrderEmail — same best-effort
// contract (never throws, always logged). Fires alongside the email so users
// who enabled push get the instant heads-up while email still serves as the
// durable receipt/record.
async function notifyOrderPush(order: any, kind: 'success' | 'failed') {
  try {
    const title = kind === 'success' ? '✅ Pembayaran Berhasil' : '❌ Pembayaran Gagal'
    const body =
      kind === 'success'
        ? `Pesanan ${order.product_slug || ''} kamu sudah diproses. Terima kasih!`
        : `Pesanan ${order.product_slug || ''} gagal/kedaluwarsa. Cek riwayat transaksi untuk detail.`

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

// Duitku's docs ask the callback endpoint to reply with the literal body "SUCCESS"
// (it otherwise retries the callback up to 5 times); the other gateways don't care
// about body content as long as the HTTP status is 200.
function okResponse(gateway: string | null) {
  return new Response(gateway === 'duitku' ? 'SUCCESS' : 'ok', { status: 200 })
}
