import { useState, useEffect, useRef, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Menu, X, User, Loader2, ArrowRight } from 'lucide-react'
import { useAuth } from '../../context/AuthContext'
import { useDebounce } from '../../hooks/useDebounce'
import { supabase } from '../../lib/supabaseClient'
import { categories as mockCategories } from '../../data/mockData'
import GameArt from '../ui/GameArt'

const navLinks = [
  { to: '/', label: 'Beranda' },
  { to: '/promo', label: 'Promo' },
  { to: '/tools', label: 'Tools Gamer' },
  { to: '/bantuan', label: 'Bantuan' },
  { to: '/tentang-kami', label: 'Tentang Kami' },
  { to: '/hubungi-kami', label: 'Kontak' },
]

// Cached once across Navbar mounts so re-opening the search box never re-fetches.
let catalogCache = null

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [activeIdx, setActiveIdx] = useState(-1)
  const [catalog, setCatalog] = useState(catalogCache)
  const [accountOpen, setAccountOpen] = useState(false)
  const searchBoxRef = useRef(null)
  const accountBoxRef = useRef(null)
  const { user, profile, signOut } = useAuth()
  const navigate = useNavigate()
  const debouncedQuery = useDebounce(query, 200)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // Close the dropdown on outside click.
  useEffect(() => {
    const onClick = (e) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target)) setFocused(false)
      if (accountBoxRef.current && !accountBoxRef.current.contains(e.target)) setAccountOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  // Lazy-load a lightweight catalog (once) the moment someone starts typing,
  // so instant search doesn't cost a network round-trip per keystroke.
  useEffect(() => {
    if (catalogCache || !debouncedQuery.trim()) return
    supabase
      .from('games')
      .select('slug, name, publisher, thumbnail_url, is_hot')
      .eq('is_active', true)
      .then(({ data, error }) => {
        catalogCache = !error && data && data.length > 0
          ? data.map((g) => ({ slug: g.slug, name: g.name, publisher: g.publisher, image: g.thumbnail_url, hot: g.is_hot }))
          : mockCategories.map((c) => ({ slug: c.slug, name: c.name, publisher: c.publisher, hot: c.hot }))
        setCatalog(catalogCache)
      })
  }, [debouncedQuery])

  const results = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase()
    if (!q || !catalog) return []
    return catalog
      .filter((c) => c.name.toLowerCase().includes(q) || c.publisher?.toLowerCase().includes(q))
      .sort((a, b) => (b.hot ? 1 : 0) - (a.hot ? 1 : 0))
      .slice(0, 6)
  }, [catalog, debouncedQuery])

  const isSearching = query.trim() && debouncedQuery !== query
  const showDropdown = focused && query.trim().length > 0

  const goToResult = (slug) => {
    setFocused(false)
    setQuery('')
    navigate(`/produk/${slug}`)
  }

  const submitSearch = (e) => {
    e.preventDefault()
    if (activeIdx >= 0 && results[activeIdx]) {
      goToResult(results[activeIdx].slug)
      return
    }
    if (query.trim()) {
      setFocused(false)
      navigate(`/?q=${encodeURIComponent(query.trim())}`)
    }
  }

  useEffect(() => setActiveIdx(-1), [debouncedQuery])

  const onKeyDown = (e) => {
    if (!showDropdown || results.length === 0) return
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx((i) => (i + 1) % results.length) }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx((i) => (i - 1 + results.length) % results.length) }
    else if (e.key === 'Escape') setFocused(false)
  }

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-base-950/80 backdrop-blur-xl border-b border-white/10 shadow-glass' : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <img src="/logo.png" alt="Alaikstore" className="w-9 h-9 object-contain" />
          <span className="font-display font-bold text-lg tracking-tight">
            Alaik<span className="text-neon-light">store</span>
          </span>
        </Link>

        <form onSubmit={submitSearch} className="hidden md:flex flex-1 max-w-md relative" ref={searchBoxRef}>
          <div className="relative w-full">
            {isSearching ? (
              <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neon-light animate-spin" />
            ) : (
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            )}
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onKeyDown={onKeyDown}
              placeholder="Cari game atau produk..."
              className="input-glass pl-10 py-2 text-sm transition-shadow duration-300 focus:shadow-neon"
            />
          </div>

          <AnimatePresence>
            {showDropdown && (
              <motion.div
                initial={{ opacity: 0, y: -8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -8, scale: 0.98 }}
                transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
                className="absolute top-full mt-2 w-full glass-premium rounded-2xl p-2 z-50 overflow-hidden"
              >
                {results.length === 0 ? (
                  <p className="text-white/40 text-xs px-3 py-3">
                    {debouncedQuery !== query ? 'Mencari...' : 'Tidak ada produk yang cocok.'}
                  </p>
                ) : (
                  <>
                    {results.map((r, i) => (
                      <button
                        type="button"
                        key={r.slug}
                        onClick={() => goToResult(r.slug)}
                        onMouseEnter={() => setActiveIdx(i)}
                        className={`w-full flex items-center gap-3 p-2 rounded-xl text-left transition-colors duration-150 ${
                          i === activeIdx ? 'bg-neon/15' : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                          <GameArt slug={r.slug} name={r.name} imageUrl={r.image} bannerMode />
                        </div>
                        <span className="flex-1 min-w-0">
                          <span className="block text-sm text-white truncate">{r.name}</span>
                          <span className="block text-[11px] text-white/40 truncate">{r.publisher}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 text-white/30" />
                      </button>
                    ))}
                    <button
                      type="submit"
                      className="w-full text-center text-xs text-neon-light py-2 hover:underline"
                    >
                      Lihat semua hasil untuk "{query}"
                    </button>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </form>

        <nav className="hidden lg:flex items-center gap-6 text-sm text-white/70">
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} className="relative group/nav py-1 hover:text-neon-light transition-colors duration-200">
              {l.label}
              <span className="absolute left-0 -bottom-0.5 h-px w-0 bg-gradient-to-r from-neon to-accent-violet transition-all duration-300 ease-premium group-hover/nav:w-full" />
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="relative" ref={accountBoxRef}>
              <button
                onClick={() => setAccountOpen((v) => !v)}
                className="flex items-center gap-2 glass px-3 py-2 rounded-xl text-sm hover:border-neon/40 transition-colors"
              >
                <User className="w-4 h-4 text-neon-light" />
                {profile?.full_name || 'Akun'}
              </button>
              <AnimatePresence>
                {accountOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.15 }}
                    className="absolute right-0 mt-2 w-48 glass-card p-2 z-50"
                  >
                    <Link to="/" onClick={() => setAccountOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">Beranda</Link>
                    <Link to="/dashboard" onClick={() => setAccountOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">Dashboard</Link>
                    <Link to="/riwayat-transaksi" onClick={() => setAccountOpen(false)} className="block px-3 py-2 rounded-lg text-sm hover:bg-white/5">Riwayat Transaksi</Link>
                    {profile?.role === 'admin' && (
                      <Link to="/admin" onClick={() => setAccountOpen(false)} className="block px-3 py-2 rounded-lg text-sm text-neon-light font-semibold hover:bg-neon/10">
                        ⚡ Dashboard Admin
                      </Link>
                    )}
                    <button onClick={() => { setAccountOpen(false); signOut() }} className="w-full text-left px-3 py-2 rounded-lg text-sm text-red-400 hover:bg-white/5">
                      Keluar
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn-outline text-sm py-2">Masuk</Link>
              <Link to="/register" className="btn-neon text-sm py-2">Daftar</Link>
            </>
          )}
        </div>

        <button className="lg:hidden" onClick={() => setOpen(!open)}>
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="lg:hidden bg-base-950/95 backdrop-blur-xl border-t border-white/10 px-4 py-4 space-y-3 overflow-hidden"
        >
          <form onSubmit={submitSearch} className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari game atau produk..."
              className="input-glass pl-10 py-2 text-sm"
            />
          </form>
          {navLinks.map((l) => (
            <Link key={l.to} to={l.to} onClick={() => setOpen(false)} className="block text-white/80 py-1">
              {l.label}
            </Link>
          ))}
          <div className="flex flex-col gap-3 pt-2">
            {user ? (
              <>
                <div className="flex gap-3">
                  <Link to="/dashboard" onClick={() => setOpen(false)} className="btn-outline flex-1 text-center text-sm">Dashboard</Link>
                  <button onClick={() => { setOpen(false); signOut() }} className="btn-neon flex-1 text-sm">Keluar</button>
                </div>
                {profile?.role === 'admin' && (
                  <Link to="/admin" onClick={() => setOpen(false)} className="btn-outline text-center text-sm border-neon/40 text-neon-light">
                    ⚡ Dashboard Admin
                  </Link>
                )}
              </>
            ) : (
              <div className="flex gap-3">
                <Link to="/login" className="btn-outline flex-1 text-center text-sm">Masuk</Link>
                <Link to="/register" className="btn-neon flex-1 text-center text-sm">Daftar</Link>
              </div>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>
    </header>
  )
}
