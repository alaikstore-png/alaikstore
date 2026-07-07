import { useMemo, useRef, useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { categories as mockCategories, categoryGroups } from '../../data/mockData'
import { supabase } from '../../lib/supabaseClient'
import ProductCard from '../ui/ProductCard'
import { ProductGridSkeleton } from '../ui/Skeleton'

const PAGE_SIZE = 10
const GROUP_TO_CATEGORY_SLUG = {
  'Mobile Game': 'mobile-game',
  'PC Game': 'pc-game',
  Voucher: 'voucher',
  'Produk Digital': 'produk-digital',
  'Pulsa & Data': 'pulsa-data',
  'Token & Tagihan': 'token-tagihan',
  'Top Up E-Wallet': 'topup-ewallet',
}

export default function CategoryGrid({ searchQuery = '', initialGroup = 'Semua' }) {
  const [activeGroup, setActiveGroup] = useState(categoryGroups.includes(initialGroup) ? initialGroup : 'Semua')
  const [games, setGames] = useState(null) // null = not yet loaded from Supabase
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [loading, setLoading] = useState(false)
  const loaderRef = useRef(null)

  // Keep in sync if the parent changes the requested group (e.g. clicking a
  // different Quick Access shortcut while already on the homepage).
  useEffect(() => {
    if (categoryGroups.includes(initialGroup)) setActiveGroup(initialGroup)
  }, [initialGroup])

  // Pull the real catalog from Supabase (`games` joined to `categories`) once on mount.
  // Falls back to the bundled demo catalog if the table is empty / not seeded yet,
  // so the storefront still renders before you run supabase/seed.sql.
  useEffect(() => {
    let cancelled = false
    supabase
      .from('games')
      .select('id, slug, name, publisher, thumbnail_url, is_hot, categories(slug)')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (cancelled) return
        if (error || !data || data.length === 0) {
          setGames(
            mockCategories.map((c) => ({ slug: c.slug, name: c.name, publisher: c.publisher, image: c.image, hot: c.hot, group: c.group }))
          )
        } else {
          const groupBySlug = Object.fromEntries(Object.entries(GROUP_TO_CATEGORY_SLUG).map(([g, s]) => [s, g]))
          setGames(
            data.map((g) => ({
              id: g.id,
              slug: g.slug,
              name: g.name,
              publisher: g.publisher,
              image: g.thumbnail_url,
              hot: g.is_hot,
              group: groupBySlug[g.categories?.slug] || 'Produk Digital',
            }))
          )
        }
      })
    return () => { cancelled = true }
  }, [])

  const filtered = useMemo(() => {
    if (!games) return []
    return games.filter((c) => {
      const matchGroup = activeGroup === 'Semua' || c.group === activeGroup
      const matchSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase())
      return matchGroup && matchSearch
    })
  }, [games, activeGroup, searchQuery])

  const visible = filtered.slice(0, visibleCount)

  // Infinite scroll via IntersectionObserver
  useEffect(() => {
    const el = loaderRef.current
    if (!el) return
    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && visibleCount < filtered.length && !loading) {
        setLoading(true)
        setTimeout(() => {
          setVisibleCount((v) => v + PAGE_SIZE)
          setLoading(false)
        }, 500)
      }
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [filtered.length, visibleCount, loading])

  useEffect(() => setVisibleCount(PAGE_SIZE), [activeGroup, searchQuery])

  return (
    <div>
      <div className="sticky top-16 z-20 -mx-4 px-4 py-2 mb-6 bg-base-950/70 backdrop-blur-xl">
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          {categoryGroups.map((g) => (
            <button
              key={g}
              onClick={() => setActiveGroup(g)}
              className={`relative shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-colors duration-200 ${
                activeGroup === g ? 'text-white' : 'glass text-white/60 hover:text-white hover:border-neon/30'
              }`}
            >
              {activeGroup === g && (
                <motion.span
                  layoutId="active-category-pill"
                  transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-gradient-to-r from-neon to-accent-violet shadow-neon"
                />
              )}
              <span className="relative z-10">{g}</span>
            </button>
          ))}
        </div>
      </div>

      {games === null ? (
        <ProductGridSkeleton count={10} />
      ) : filtered.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-white/50 text-sm py-10 text-center"
        >
          Produk tidak ditemukan.
        </motion.p>
      ) : (
        <AnimatePresence mode="popLayout">
          <motion.div
            key={activeGroup + searchQuery}
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4"
          >
            {visible.map((p, i) => (
              <ProductCard key={p.slug} product={p} index={i} />
            ))}
          </motion.div>
        </AnimatePresence>
      )}

      {visibleCount < filtered.length && (
        <div ref={loaderRef} className="mt-6">
          {loading && <ProductGridSkeleton count={5} />}
        </div>
      )}
    </div>
  )
}
