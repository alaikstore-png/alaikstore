// Supabase Edge Function: send-push-notification
// Deploy: supabase functions deploy send-push-notification
//
// Called from Dashboard Admin (e.g. "Kelola Flash Sale" -> Umumkan Sekarang,
// or a future generic "Kirim Notifikasi" panel). Requires the caller to be an
// authenticated admin — this is NOT public, since it lets you push to every
// device in push_subscriptions.
//
// Body:
//   { broadcast: true, title, body, url? }             -> everyone subscribed
//   { user_id: '<uuid>', title, body, url? }            -> one user's devices
//   { flash_sale_id: '<uuid>' }                          -> auto-builds the
//                                                          message from the
//                                                          flash sale's title/product

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { broadcastPush, sendPushToUser } from '../_shared/push.ts'

serve(async (req) => {
  try {
    const authHeader = req.headers.get('Authorization') ?? ''
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )
    const supabaseAdmin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!)

    const { data: userData } = await supabase.auth.getUser()
    if (!userData?.user) return json({ error: 'unauthorized' }, 401)

    const { data: profile } = await supabaseAdmin.from('users').select('role').eq('id', userData.user.id).maybeSingle()
    if (profile?.role !== 'admin') return json({ error: 'forbidden — admin only' }, 403)

    const body = await req.json()
    let { broadcast, user_id, title, body: message, url, flash_sale_id } = body

    if (flash_sale_id) {
      const { data: fs } = await supabaseAdmin
        .from('flash_sales')
        .select('title, ends_at, products(name, games(slug))')
        .eq('id', flash_sale_id)
        .maybeSingle()
      if (!fs) return json({ error: 'flash sale tidak ditemukan' }, 404)
      title = `⚡ ${fs.title}`
      message = `${fs.products?.name || 'Produk pilihan'} lagi diskon gede — buruan sebelum kehabisan!`
      url = fs.products?.games?.slug ? `/produk/${fs.products.games.slug}` : '/'
      broadcast = true
    }

    if (!title || !message) return json({ error: 'title dan body wajib diisi' }, 400)

    const result = broadcast
      ? await broadcastPush(supabaseAdmin, { title, body: message, url })
      : await sendPushToUser(supabaseAdmin, user_id, { title, body: message, url })

    return json({ ok: true, ...result })
  } catch (err) {
    return json({ error: String(err) }, 500)
  }
})

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } })
}
