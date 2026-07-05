import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

// Fallback used if the `settings` row (key = 'whatsapp_contact') hasn't been
// seeded yet or fails to load — keeps every WhatsApp link on the site working
// even before the migration/admin panel is set up. Admin can change the real
// number/message anytime from Dashboard Admin -> Kontak & Live Chat, no code
// change or redeploy needed.
const FALLBACK_NUMBER = '6285173487538' // 085173487538 in international format
const FALLBACK_MESSAGE = 'Halo Alaikstore, saya ingin bertanya seputar top up game.'

export function useWhatsAppContact() {
  const [contact, setContact] = useState({ number: FALLBACK_NUMBER, message: FALLBACK_MESSAGE })

  useEffect(() => {
    let active = true
    supabase
      .from('settings')
      .select('value')
      .eq('key', 'whatsapp_contact')
      .maybeSingle()
      .then(({ data }) => {
        if (active && data?.value?.number) {
          setContact({
            number: data.value.number,
            message: data.value.message || FALLBACK_MESSAGE,
          })
        }
      })
      .catch(() => {}) // offline/blocked fetch -> keep the fallback, never hide contact options
    return () => { active = false }
  }, [])

  const linkWithText = (text) => `https://wa.me/${contact.number}?text=${encodeURIComponent(text)}`

  return { ...contact, linkWithText }
}
