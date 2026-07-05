import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle2, Tag, Wallet, Loader2, Zap } from 'lucide-react'
import { categories, denominations as mockDenominations, denominationsBySlug, inputMetaByGroup, paymentMethods } from '../data/mockData'
import { useAuth } from '../context/AuthContext'
import { createOrder } from '../lib/api'
import { getAffiliateCode } from '../lib/affiliate'
import { supabase } from '../lib/supabaseClient'
import { TIER_LABEL, resolveTierPrice } from '../lib/pricing'
import { getLiveFlashSaleMap } from '../lib/flashSale'
import { ProductGridSkeleton } from '../components/ui/Skeleton'
import WishlistButton from '../components/ui/WishlistButton'
import GameArt from '../components/ui/GameArt'

export default function ProductDetail() {
  const { slug } = useParams()
  const navigate = useNavigate()
  const { user, profile } = useAuth()
  const tier = profile?.price_tier || 'public'

  const [product, setProduct] = useState(null) // null while loading
  const [denominations, setDenominations] = useState(null)
  const [needsServerId, setNeedsServerId] = useState(false)
  const [inputMeta, setInputMeta] = useState({ label: 'User ID', placeholder: 'Masukkan User ID', hint: null })

  // Load the real game + its denomination products from Supabase. Falls back to
  // the bundled demo data if this game hasn't been seeded yet (see supabase/seed.sql).
  useEffect(() => {
    let cancelled = false
    setProduct(null)
    setDenominations(null)

    supabase
      .from('games')
      .select('id, slug, name, publisher, thumbnail_url, needs_server_id')
      .eq('slug', slug)
      .maybeSingle()
      .then(async ({ data: game }) => {
        if (cancelled) return
        if (!game) {
          const fallback = categories.find((c) => c.slug === slug) || categories[0]
          setProduct(fallback)
          setNeedsServerId(['mobile-legends', 'magic-chess'].includes(fallback.slug))
          setDenominations(denominationsBySlug[fallback.slug] || mockDenominations)
          setInputMeta(inputMetaByGroup[fallback.group] || { label: 'User ID', placeholder: 'Masukkan User ID', hint: null })
          return
        }

        setProduct({ id: game.id, slug: game.slug, name: game.name, publisher: game.publisher, image: game.thumbnail_url })
        setNeedsServerId(game.needs_server_id)

        const { data: products } = await supabase
          .from('products')
          .select('id, name, sell_price, discount_price, price_member, price_reseller, is_popular')
          .eq('game_id', game.id)
          .eq('is_active', true)
          .order('sell_price')

        if (cancelled) return
        if (!products || products.length === 0) {
          setDenominations(mockDenominations)
        } else {
          const flashMap = await getLiveFlashSaleMap()
          if (cancelled) return
          setDenominations(
            products.map((p) => {
              const flash = flashMap[p.id]
              const tierPrice = resolveTierPrice(p, tier)
              const price = flash ? flash.flashPrice : tierPrice
              return {
                id: p.id,
                label: p.name,
                price,
                // Show the public price crossed out when flash sale or tier price beats it
                strike: price < p.sell_price ? p.sell_price : null,
                popular: p.is_popular,
                flashSale: flash ? { endsAt: flash.endsAt, soldPct: flash.soldPct } : null,
              }
            })
          )
        }
      })

    return () => { cancelled = true }
  }, [slug, tier])

  const [userId, setUserId] = useState('')
  const [serverId, setServerId] = useState('')
  const [selectedDenom, setSelectedDenom] = useState(null)
  const [selectedPayment, setSelectedPayment] = useState(null)
  const [promoCode, setPromoCode] = useState('')
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const subtotal = selectedDenom?.price || 0
  const total = Math.max(subtotal - promoDiscount, 0)

  const canSubmit = userId && (!needsServerId || serverId) && selectedDenom && selectedPayment

  // Demo promo codes — includes ALAIK10 plus the codes handed out by the
  // Magic Wheel tool, so a "win" there is actually redeemable here.
  const applyPromo = () => {
    const code = promoCode.trim().toUpperCase()
    const percentCodes = { ALAIK10: 0.1, HOKI5: 0.05, MAGIC15: 0.15 }
    const fixedCodes = { CASH5RB: 5000, BONUSDM: 3000 }

    if (percentCodes[code]) {
      setPromoDiscount(Math.round(subtotal * percentCodes[code]))
    } else if (fixedCodes[code]) {
      setPromoDiscount(Math.min(fixedCodes[code], subtotal))
    } else {
      setPromoDiscount(0)
    }
  }

  const handlePay = async () => {
    if (!user) return navigate('/login')
    if (!canSubmit) return
    setSubmitting(true)
    setError('')
    try {
      const result = await createOrder({
        product_slug: product.slug,
        product_id: selectedDenom.id,
        user_game_id: userId,
        server_id: serverId || null,
        denomination: selectedDenom.label,
        amount: total,
        payment_method: selectedPayment.id,
        promo_code: promoCode || null,
        affiliate_code: getAffiliateCode(),
      })
      navigate(`/cek-pesanan?order=${result.order.id}`)
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal membuat pesanan. Pastikan Supabase Edge Function "create-order" sudah aktif.')
    } finally {
      setSubmitting(false)
    }
  }

  if (!product) {
    return (
      <div className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
        <div className="skeleton h-48 md:h-64 rounded-2xl mb-8" />
        <ProductGridSkeleton count={8} />
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <div className="relative rounded-2xl overflow-hidden h-48 md:h-64 mb-8 border border-white/10">
        <GameArt slug={product.slug} bannerMode className="absolute inset-0" />
        <div className="absolute inset-0 bg-gradient-to-t from-base-950 via-base-950/50 to-transparent" />
        <WishlistButton gameId={product.id} className="absolute top-4 right-4" />
        <div className="absolute bottom-4 left-6">
          <h1 className="font-display text-2xl md:text-3xl font-bold">{product.name}</h1>
          <p className="text-white/50 text-sm">{product.publisher}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <section>
            <h2 className="font-semibold mb-3">1. Masukkan {inputMeta.label}</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder={inputMeta.placeholder}
                className="input-glass"
              />
              {needsServerId && (
                <input
                  value={serverId}
                  onChange={(e) => setServerId(e.target.value)}
                  placeholder="Server ID"
                  className="input-glass"
                />
              )}
            </div>
            {inputMeta.hint && <p className="text-xs text-white/40 mt-2">{inputMeta.hint}</p>}
          </section>

          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold">2. Pilih Nominal</h2>
              {tier !== 'public' && (
                <span className="badge-discount text-[11px]">Harga {TIER_LABEL[tier]}</span>
              )}
            </div>
            {!denominations ? (
              <div className="grid sm:grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => <div key={i} className="skeleton h-16 rounded-xl" />)}
              </div>
            ) : (
            <div className="grid sm:grid-cols-2 gap-3">
              {denominations.map((d) => (
                <button
                  key={d.id}
                  onClick={() => setSelectedDenom(d)}
                  className={`glass-card text-left p-4 relative transition-all ${
                    selectedDenom?.id === d.id ? 'border-neon shadow-neon' : ''
                  }`}
                >
                  {d.flashSale && (
                    <span className="badge-hot absolute top-2 right-2 flex items-center gap-1">
                      <Zap className="w-3 h-3" /> Flash Sale
                    </span>
                  )}
                  {!d.flashSale && d.popular && <span className="badge-discount absolute top-2 right-2">Populer</span>}
                  <p className="font-medium text-sm mb-1">{d.label}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-neon-light font-semibold">Rp {d.price.toLocaleString('id-ID')}</span>
                    {d.strike && (
                      <span className="text-white/30 text-xs line-through">Rp {d.strike.toLocaleString('id-ID')}</span>
                    )}
                  </div>
                </button>
              ))}
            </div>
            )}
          </section>

          <section>
            <h2 className="font-semibold mb-3">3. Pilih Metode Pembayaran</h2>
            <div className="grid sm:grid-cols-3 gap-3">
              {paymentMethods.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedPayment(m)}
                  className={`glass-card p-3 text-left transition-all ${
                    selectedPayment?.id === m.id ? 'border-neon shadow-neon' : ''
                  }`}
                >
                  <p className="text-sm font-medium">{m.name}</p>
                  <p className="text-xs text-white/40">{m.group} · {m.fee}</p>
                </button>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-semibold mb-3">4. Voucher Promo</h2>
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                <input
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                  placeholder="Masukkan kode voucher (contoh: ALAIK10)"
                  className="input-glass pl-10"
                />
              </div>
              <button onClick={applyPromo} className="btn-outline">Pakai</button>
            </div>
          </section>
        </div>

        <motion.aside
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          className="glass-card p-6 h-fit lg:sticky lg:top-24"
        >
          <h3 className="font-semibold mb-4">Ringkasan Pesanan</h3>
          <div className="space-y-2 text-sm text-white/60 mb-4">
            <div className="flex justify-between"><span>Produk</span><span className="text-white">{product.name}</span></div>
            <div className="flex justify-between"><span>Nominal</span><span className="text-white">{selectedDenom?.label || '-'}</span></div>
            <div className="flex justify-between"><span>Pembayaran</span><span className="text-white">{selectedPayment?.name || '-'}</span></div>
            <div className="flex justify-between"><span>Subtotal</span><span className="text-white">Rp {subtotal.toLocaleString('id-ID')}</span></div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-neon-light"><span>Diskon Voucher</span><span>- Rp {promoDiscount.toLocaleString('id-ID')}</span></div>
            )}
          </div>
          <div className="border-t border-white/10 pt-4 mb-5 flex justify-between items-center">
            <span className="text-white/60 text-sm">Total Bayar</span>
            <span className="font-display text-xl font-bold text-neon-light">Rp {total.toLocaleString('id-ID')}</span>
          </div>
          {error && <p className="text-red-400 text-xs mb-3">{error}</p>}
          <button
            disabled={!canSubmit || submitting}
            onClick={handlePay}
            className="btn-neon w-full flex items-center justify-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-4 h-4" />}
            {submitting ? 'Memproses...' : 'Bayar Sekarang'}
          </button>
          <p className="text-[11px] text-white/30 mt-3 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-neon-light" /> Transaksi diproses otomatis & realtime
          </p>
        </motion.aside>
      </div>
    </div>
  )
}
