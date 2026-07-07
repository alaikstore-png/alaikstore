import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Clock } from 'lucide-react'
import { getActiveFlashSales } from '../../lib/flashSale'
import GameArt from '../ui/GameArt'
import { ProductGridSkeleton } from '../ui/Skeleton'

// Ticks every second so the countdown badge on each card stays live without
// re-fetching from Supabase.
function useCountdown(endsAt) {
  const [remaining, setRemaining] = useState(() => Math.max(new Date(endsAt) - Date.now(), 0))

  useEffect(() => {
    const id = setInterval(() => {
      setRemaining(Math.max(new Date(endsAt) - Date.now(), 0))
    }, 1000)
    return () => clearInterval(id)
  }, [endsAt])

  const h = Math.floor(remaining / 3_600_000)
  const m = Math.floor((remaining % 3_600_000) / 60_000)
  const s = Math.floor((remaining % 60_000) / 1000)
  return { remaining, label: `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}` }
}

function FlashSaleCard({ flash, index }) {
  const { remaining, label } = useCountdown(flash.endsAt)
  if (remaining <= 0) return null // expired mid-session — just fade out of the list

  const discountPct = flash.originalPrice ? Math.round((1 - flash.flashPrice / flash.originalPrice) * 100) : 0

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link to={`/produk/${flash.gameSlug}`} className="glass-card group block overflow-hidden relative">
        <div className="relative aspect-square overflow-hidden">
          <div className="w-full h-full transition-transform duration-500 ease-premium group-hover:scale-110">
            <GameArt slug={flash.gameSlug} name={flash.gameName} imageUrl={flash.thumbnail} />
          </div>
          <div className="absolute inset-0 bg-shine opacity-0 group-hover:opacity-100 group-hover:animate-shine pointer-events-none" />
          <span className="absolute top-2 left-2 badge-hot flex items-center gap-1">
            <Zap className="w-3 h-3" /> -{discountPct}%
          </span>
          <span className="absolute top-2 right-2 bg-black/70 backdrop-blur text-[11px] px-2 py-1 rounded-lg flex items-center gap-1 text-neon-light font-mono">
            <Clock className="w-3 h-3" /> {label}
          </span>
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate group-hover:text-neon-light transition-colors duration-300">{flash.gameName}</h3>
          <p className="text-xs text-white/40 truncate mb-1.5">{flash.productName}</p>
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-bold text-neon-light">Rp {flash.flashPrice.toLocaleString('id-ID')}</span>
            <span className="text-[11px] text-white/30 line-through">Rp {flash.originalPrice.toLocaleString('id-ID')}</span>
          </div>
          <div className="mt-2 h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-neon to-neon-light" style={{ width: `${Math.min(flash.soldPct, 100)}%` }} />
          </div>
          <p className="text-[10px] text-white/30 mt-1">Terjual {flash.soldCount}/{flash.stockLimit}</p>
        </div>
      </Link>
    </motion.div>
  )
}

// Renders nothing at all (including the heading) when there are no live
// flash sales — no point showing an empty promo section on a quiet day.
export default function FlashSaleSection() {
  const [flashSales, setFlashSales] = useState(null)

  useEffect(() => {
    let cancelled = false
    getActiveFlashSales().then((data) => { if (!cancelled) setFlashSales(data) })
    return () => { cancelled = true }
  }, [])

  if (flashSales !== null && flashSales.length === 0) return null

  return (
    <section className="max-w-7xl mx-auto px-4 md:px-6 py-14 scroll-mt-20">
      <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: '-40px' }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }} className="mb-8">
        <h2 className="section-title flex items-center gap-2"><Zap className="w-5 h-5 text-neon-light" /> Flash Sale</h2>
        <p className="text-white/50 text-sm mt-1">Harga spesial waktu terbatas — buruan sebelum kehabisan!</p>
      </motion.div>

      {flashSales === null ? (
        <ProductGridSkeleton count={5} />
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
          {flashSales.map((f, i) => <FlashSaleCard key={f.id} flash={f} index={i} />)}
        </div>
      )}
    </section>
  )
}
