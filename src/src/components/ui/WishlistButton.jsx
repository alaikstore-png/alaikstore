import { useState, useEffect } from 'react'
import { Heart } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { supabase } from '../../lib/supabaseClient'

/**
 * Heart-shaped toggle that adds/removes a game from the logged-in user's wishlist.
 * Requires a real `gameId` (uuid from the `games` table) — silently renders nothing
 * for demo/mock products that don't have one yet (i.e. before you run seed.sql).
 */
export default function WishlistButton({ gameId, className = '' }) {
  const { user } = useAuth()
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!user || !gameId) return
    supabase
      .from('wishlists')
      .select('id')
      .eq('user_id', user.id)
      .eq('game_id', gameId)
      .maybeSingle()
      .then(({ data }) => setSaved(!!data))
  }, [user, gameId])

  if (!gameId) return null

  const toggle = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return window.location.assign('/login')
    setBusy(true)
    try {
      if (saved) {
        await supabase.from('wishlists').delete().eq('user_id', user.id).eq('game_id', gameId)
        setSaved(false)
      } else {
        await supabase.from('wishlists').insert({ user_id: user.id, game_id: gameId })
        setSaved(true)
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      aria-label={saved ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}
      className={`w-8 h-8 rounded-full glass flex items-center justify-center transition-colors hover:border-neon/40 disabled:opacity-50 ${className}`}
    >
      <Heart className={`w-4 h-4 transition-colors ${saved ? 'fill-neon-light text-neon-light' : 'text-white/60'}`} />
    </button>
  )
}
