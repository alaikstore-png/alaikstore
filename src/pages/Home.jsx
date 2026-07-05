import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import Hero from '../components/home/Hero'
import BannerSlider from '../components/home/BannerSlider'
import QuickAccess from '../components/home/QuickAccess'
import CategoryGrid from '../components/home/CategoryGrid'
import HowToTopUp from '../components/home/HowToTopUp'
import FaqAccordion from '../components/home/FaqAccordion'
import Testimonials from '../components/home/Testimonials'
import FlashSaleSection from '../components/home/FlashSaleSection'
import { categories } from '../data/mockData'
import { supabase } from '../lib/supabaseClient'
import ProductCard from '../components/ui/ProductCard'
import { ProductGridSkeleton } from '../components/ui/Skeleton'

function Section({ id, title, subtitle, children }) {
  return (
    <section id={id} className="max-w-7xl mx-auto px-4 md:px-6 py-14 scroll-mt-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="mb-8"
      >
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="text-white/50 text-sm mt-1">{subtitle}</p>}
      </motion.div>
      {children}
    </section>
  )
}

export default function Home() {
  const [params] = useSearchParams()
  const query = params.get('q') || ''
  const initialGroup = params.get('kategori') || 'Semua'
  const [bestSellers, setBestSellers] = useState(null)

  useEffect(() => {
    supabase
      .from('games')
      .select('id, slug, name, publisher, thumbnail_url, is_hot')
      .eq('is_active', true)
      .eq('is_hot', true)
      .order('sort_order')
      .limit(5)
      .then(({ data, error }) => {
        if (error || !data || data.length === 0) {
          const ppobGroups = ['Pulsa & Data', 'Token & Tagihan', 'Top Up E-Wallet']
          setBestSellers(categories.filter((c) => c.hot && !ppobGroups.includes(c.group)))
        } else {
          setBestSellers(data.map((g) => ({ id: g.id, slug: g.slug, name: g.name, publisher: g.publisher, image: g.thumbnail_url, hot: g.is_hot })))
        }
      })
  }, [])

  return (
    <div>
      <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 space-y-8">
        {!query && <Hero />}
        <BannerSlider />
        <QuickAccess />
      </div>

      {!query && (
        <Section title="Game Terlaris" subtitle="Produk paling banyak dibeli minggu ini">
          {bestSellers === null ? (
            <ProductGridSkeleton count={5} />
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
              {bestSellers.map((p, i) => (
                <ProductCard key={p.slug} product={p} index={i} />
              ))}
            </div>
          )}
        </Section>
      )}

      {!query && <FlashSaleSection />}

      <Section id="kategori-produk" title={query ? `Hasil pencarian "${query}"` : 'Semua Kategori Produk'} subtitle="Pulsa, paket data, token listrik, e-wallet, game, dan voucher digital lainnya">
        <CategoryGrid searchQuery={query} initialGroup={initialGroup} />
      </Section>

      <Section title="Cara Top Up" subtitle="Hanya 4 langkah mudah untuk mendapatkan item favoritmu">
        <HowToTopUp />
      </Section>

      <Section title="Apa Kata Mereka" subtitle="Ribuan pemain sudah merasakan kemudahan top up di Alaikstore">
        <Testimonials />
      </Section>

      <Section title="Pertanyaan Umum">
        <FaqAccordion />
      </Section>
    </div>
  )
}
