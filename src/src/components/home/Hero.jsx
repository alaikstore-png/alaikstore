import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Clock3, Users } from 'lucide-react'

const stats = [
  { icon: Users, value: 250000, suffix: '+', label: 'Pengguna Aktif' },
  { icon: Zap, value: 1200000, suffix: '+', label: 'Transaksi Sukses' },
  { icon: Clock3, value: 24, suffix: '/7', label: 'Proses Instan' },
  { icon: ShieldCheck, value: 99.9, suffix: '%', label: 'Uptime Layanan' },
]

function Counter({ value, suffix }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const isFloat = value % 1 !== 0
    const duration = 1200
    const start = performance.now()
    let raf
    const tick = (now) => {
      const p = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - p, 3)
      setDisplay(isFloat ? +(value * eased).toFixed(1) : Math.floor(value * eased))
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [value])

  return (
    <span className="font-display text-2xl md:text-3xl font-bold text-white">
      {display.toLocaleString('id-ID')}
      <span className="text-neon-light">{suffix}</span>
    </span>
  )
}

export default function Hero() {
  return (
    <section className="relative overflow-hidden rounded-3xl glass-premium">
      {/* animated aurora background */}
      <div className="absolute inset-0 aurora-bg" />
      <div className="blob w-72 h-72 bg-neon/40 -top-16 -left-10" />
      <div className="blob w-64 h-64 bg-accent-violet/40 top-10 right-0" style={{ animationDelay: '-4s' }} />
      <div className="blob w-56 h-56 bg-accent-cyan/30 bottom-0 left-1/3" style={{ animationDelay: '-8s' }} />
      <div className="noise-overlay" />

      <div className="relative z-10 px-6 md:px-14 py-14 md:py-20 flex flex-col items-center text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="glass px-4 py-1.5 rounded-full text-xs font-medium text-white/80 mb-5 flex items-center gap-2"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse-slow" />
          Top up tercepat & teraman di Indonesia
        </motion.span>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="font-display text-3xl md:text-5xl lg:text-6xl font-bold leading-tight max-w-3xl"
        >
          Top Up Game & Produk Digital,<br className="hidden md:block" />
          <span className="gradient-text">Instan Tanpa Ribet</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-4 text-white/60 text-sm md:text-base max-w-xl"
        >
          Diamond, UC, voucher, pulsa, token listrik, hingga top up e-wallet — semua dalam satu tempat,
          harga bersahabat, proses rata-rata di bawah 1 menit.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
        >
          <a href="#kategori-produk" className="btn-neon flex items-center gap-2">
            <Zap className="w-4 h-4" /> Mulai Top Up
          </a>
          <a href="/cek-pesanan" className="btn-outline">Cek Status Pesanan</a>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 w-full max-w-3xl"
        >
          {stats.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5 glass rounded-2xl py-4 px-2">
              <s.icon className="w-4 h-4 text-neon-light mb-1" />
              <Counter value={s.value} suffix={s.suffix} />
              <span className="text-[11px] text-white/50">{s.label}</span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  )
}
