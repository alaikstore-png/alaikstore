import { useEffect, useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation, EffectFade } from 'swiper/modules'
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import 'swiper/css/effect-fade'
import { supabase } from '../../lib/supabaseClient'
import GameArt from '../ui/GameArt'

// Fallback banners shown until `public.banners` is seeded in Supabase.
// Each one links straight to a real product page and carries its own CTA,
// so the banner is a working shortcut to checkout rather than a static image.
const fallbackBanners = [
  {
    slug: 'mobile-legends',
    tag: 'Promo Hari Ini',
    title: 'Top Up Mobile Legends',
    subtitle: 'Diskon hingga 15% untuk semua nominal Diamond hari ini',
    cta: 'Top Up Sekarang',
    link: '/produk/mobile-legends',
  },
  {
    slug: 'genshin-impact',
    tag: 'Kolaborasi',
    title: 'Genshin Impact x Alaikstore',
    subtitle: 'Bonus Genesis Crystal untuk setiap pembelian di atas Rp 500.000',
    cta: 'Lihat Penawaran',
    link: '/produk/genshin-impact',
  },
  {
    slug: 'free-fire',
    tag: 'Terlaris',
    title: 'Free Fire Diamond',
    subtitle: 'Proses instan, harga bersahabat, aman tanpa perlu password',
    cta: 'Top Up Sekarang',
    link: '/produk/free-fire',
  },
  {
    slug: 'google-play',
    tag: 'Voucher Digital',
    title: 'Voucher Google Play & Steam',
    subtitle: 'Instan, aman, dan harga paling bersahabat untuk semua nominal',
    cta: 'Beli Voucher',
    link: '/produk/google-play',
  },
]

export default function BannerSlider() {
  const [banners, setBanners] = useState(fallbackBanners)
  const navigate = useNavigate()
  const prevRef = useRef(null)
  const nextRef = useRef(null)
  const paginationRef = useRef(null)

  useEffect(() => {
    let cancelled = false
    supabase
      .from('banners')
      .select('title, subtitle, link_url, image_url, sort_order, is_active')
      .eq('is_active', true)
      .order('sort_order')
      .then(({ data, error }) => {
        if (cancelled || error || !data || data.length === 0) return
        setBanners(
          data.map((b) => ({
            image: b.image_url, // real image URL, as labeled in Dashboard Admin ("URL Gambar")
            tag: 'Promo',
            title: b.title,
            subtitle: b.subtitle,
            cta: 'Lihat Selengkapnya',
            link: b.link_url || '/',
          }))
        )
      })
    return () => { cancelled = true }
  }, [])

  return (
    <div className="relative group/banner">
      <Swiper
        modules={[Autoplay, Pagination, Navigation, EffectFade]}
        effect="fade"
        fadeEffect={{ crossFade: true }}
        autoplay={{ delay: 5000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        pagination={{ el: paginationRef.current, clickable: true }}
        navigation={{ prevEl: prevRef.current, nextEl: nextRef.current }}
        onBeforeInit={(swiper) => {
          swiper.params.navigation.prevEl = prevRef.current
          swiper.params.navigation.nextEl = nextRef.current
          swiper.params.pagination.el = paginationRef.current
        }}
        loop
        className="rounded-2xl overflow-hidden border border-white/10 shadow-glass"
      >
        {banners.map((b, i) => (
          <SwiperSlide key={i}>
            <div
              role="button"
              tabIndex={0}
              onClick={() => navigate(b.link)}
              onKeyDown={(e) => e.key === 'Enter' && navigate(b.link)}
              className="relative h-56 md:h-80 w-full cursor-pointer outline-none"
            >
              <GameArt slug={b.slug} imageUrl={b.image} bannerMode className="absolute inset-0" />
              <div className="absolute inset-0 bg-gradient-to-r from-base-950/90 via-base-950/50 to-transparent" />
              <div className="absolute inset-0 flex flex-col justify-center px-6 md:px-12 max-w-lg">
                <span className="badge-discount w-fit mb-3">{b.tag}</span>
                <h2 className="font-display text-2xl md:text-4xl font-bold mb-2">{b.title}</h2>
                <p className="text-white/70 text-sm md:text-base mb-5">{b.subtitle}</p>
                <span className="btn-neon w-fit flex items-center gap-2 text-sm md:text-base">
                  {b.cta} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Custom interactive controls: prev/next arrows + clickable dots */}
      <button
        ref={prevRef}
        aria-label="Sebelumnya"
        onClick={(e) => e.stopPropagation()}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity duration-300 hover:border-neon/50 hover:text-neon-light"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        ref={nextRef}
        aria-label="Berikutnya"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-9 h-9 md:w-10 md:h-10 rounded-full glass flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-opacity duration-300 hover:border-neon/50 hover:text-neon-light"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
      <div
        ref={paginationRef}
        onClick={(e) => e.stopPropagation()}
        className="banner-pagination absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-1.5"
      />
    </div>
  )
}
