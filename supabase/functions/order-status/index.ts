// Supabase Edge Function: order-status/:id
// Simple status lookup — the frontend also subscribes to Supabase Realtime
// directly for live updates, this endpoint is for one-off polling / sharing links.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!)

serve(async (req) => {
  const id = new URL(req.url).pathname.split('/').pop()
  const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 404 })
  return new Response(JSON.stringify(data), { status: 200, headers: { 'Content-Type': 'application/json' } })
})
