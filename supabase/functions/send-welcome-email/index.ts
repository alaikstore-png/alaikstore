// Supabase Edge Function: send-welcome-email
// Deploy: supabase functions deploy send-welcome-email --no-verify-jwt
//
// Trigger: a Supabase Database Webhook on INSERT to `public.users` (Dashboard
// -> Database -> Webhooks -> Create a new hook -> table `users`, event
// `Insert`, type `Supabase Edge Functions`, pick this function). This fires
// right after `handle_new_user()` (schema.sql) creates the profile row, for
// both email/password sign-up and Google OAuth sign-in.
//
// Why a webhook instead of calling this from the frontend after signUp():
// Google OAuth redirects the browser away and back, so there's no single
// reliable "just signed up" moment on the client — the DB insert is the one
// event that always happens exactly once, for either auth method.
//
// Payload shape from a Database Webhook: { type: 'INSERT', table, schema,
// record, old_record }. `record` is the new public.users row (has id,
// full_name, ...) but not the email, since that lives in auth.users — hence
// the getUserEmail() lookup below via the admin API.

import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.4'
import { sendEmail, welcomeEmailTemplate, getUserEmail } from '../_shared/email.ts'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  try {
    const body = await req.json()
    // Support both the raw Database Webhook payload and a plain
    // { id, full_name } body (handy for manual testing with curl/Postman).
    const record = body.record || body
    const userId: string | undefined = record?.id
    const fullName: string | undefined = record?.full_name

    if (!userId) return new Response('missing user id', { status: 400 })

    const email = await getUserEmail(supabase, userId)
    if (!email) {
      await supabase.from('logs').insert({ type: 'welcome_email_skipped', message: 'no email found for user', payload: { user_id: userId } })
      return new Response('no email found, skipped', { status: 200 })
    }

    const result = await sendEmail({
      to: email,
      subject: 'Selamat datang di Alaikstore 🎉',
      html: welcomeEmailTemplate(fullName),
    })

    await supabase.from('logs').insert({
      type: result.ok ? 'welcome_email_sent' : 'welcome_email_failed',
      message: result.ok ? `Welcome email sent to ${email}` : String(result.error),
      payload: { user_id: userId, email },
    })

    return new Response('ok', { status: 200 })
  } catch (err) {
    await supabase.from('logs').insert({ type: 'welcome_email_error', message: String(err), payload: {} })
    // Still respond 200 — a broken welcome email must never surface as a
    // signup failure to the user (Database Webhooks also don't retry on 5xx
    // in a way we want to rely on here).
    return new Response('error logged', { status: 200 })
  }
})
