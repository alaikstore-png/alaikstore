// Supabase Edge Function: validate-promo
// Checks a promo code's validity (active, not expired, usage limit, min purchase)
// and returns the computed discount amount for the given subtotal.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)

serve(async (req) => {
  const { code, subtotal } = await req.json()

  const { data: promo, error } = await supabase
    .from('promos')
    .select('*')
    .eq('code', code?.toUpperCase())
    .eq('is_active', true)
    .single()

  if (error || !promo) {
    return new Response(JSON.stringify({ valid: false, reason: 'Kode tidak ditemukan atau sudah tidak aktif' }), { status: 200 })
  }

  if (promo.expires_at && new Date(promo.expires_at) < new Date()) {
    return new Response(JSON.stringify({ valid: false, reason: 'Voucher sudah kedaluwarsa' }), { status: 200 })
  }
  if (promo.usage_limit && promo.used_count >= promo.usage_limit) {
    return new Response(JSON.stringify({ valid: false, reason: 'Kuota voucher sudah habis' }), { status: 200 })
  }
  if (subtotal < (promo.min_purchase || 0)) {
    return new Response(JSON.stringify({ valid: false, reason: `Minimal pembelian Rp ${promo.min_purchase}` }), { status: 200 })
  }

  let discount = promo.discount_type === 'percent' ? (subtotal * promo.discount_value) / 100 : promo.discount_value
  if (promo.max_discount) discount = Math.min(discount, promo.max_discount)

  return new Response(JSON.stringify({ valid: true, discount }), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
