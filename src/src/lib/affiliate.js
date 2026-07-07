// Affiliate link attribution. Anyone can share a link like
// https://alaikstore.com/?aff=AFF-ABC123 (works from any page, not just Home).
// When a visitor lands via that link, we remember the code in localStorage for
// 30 days. If that visitor later completes a successful order, the affiliate
// earns an ongoing commission (see supabase/functions/_shared/rewards.ts) —
// unlike Referral, this isn't a one-time bonus and doesn't require sign-up
// with a code.
import { supabase } from './supabaseClient'

const STORAGE_KEY = 'alaikstore_aff'
const TTL_DAYS = 30

export function captureAffiliateCode(search) {
  try {
    const params = new URLSearchParams(search)
    const code = params.get('aff')
    if (!code) return
    const upper = code.trim().toUpperCase()
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ code: upper, expires: Date.now() + TTL_DAYS * 86400000 }))
    logAffiliateClick(upper)
  } catch {
    // localStorage unavailable (private mode, SSR, etc.) — attribution simply won't persist
  }
}

export function getAffiliateCode() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const { code, expires } = JSON.parse(raw)
    if (Date.now() > expires) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return code
  } catch {
    return null
  }
}

// Best-effort click log for the affiliate's stats tab — never blocks navigation.
function logAffiliateClick(code) {
  supabase.from('affiliate_clicks').insert({ affiliate_code: code, landing_path: window.location.pathname }).then(
    () => {},
    () => {}
  )
}
