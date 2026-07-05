import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Swords, Sparkles, Star, ArrowRight } from 'lucide-react'

const tools = [
  {
    to: '/tools/kalkulator-winrate',
    icon: Swords,
    title: 'Kalkulator Winrate',
    desc: 'Hitung persentase kemenangan dan berapa kali kamu harus menang beruntun untuk mencapai target rank.',
  },
  {
    to: '/tools/kalkulator-zodiak',
    icon: Star,
    title: 'Kalkulator Zodiak Gamer',
    desc: 'Cek zodiakmu dan dapatkan rekomendasi game seru untuk dimainkan hari ini.',
  },
  {
    to: '/tools/magic-wheel',
    icon: Sparkles,
    title: 'Magic Wheel',
    desc: 'Putar roda keberuntungan dan menangkan kode voucher diskon untuk top up berikutnya.',
  },
]

export default function ToolsHub() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Tools Gamer</h1>
        <p className="text-white/50 text-sm">Fitur seru untuk menemani waktu ngegamemu, gratis dan tanpa perlu login.</p>
      </motion.div>

      <div className="grid sm:grid-cols-3 gap-5">
        {tools.map((t, i) => (
          <motion.div
            key={t.to}
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.35, delay: i * 0.08 }}
          >
            <Link to={t.to} className="glass-card group block p-6 h-full">
              <div className="w-12 h-12 rounded-xl bg-neon/15 border border-neon/30 flex items-center justify-center mb-4">
                <t.icon className="w-6 h-6 text-neon-light" />
              </div>
              <h3 className="font-semibold mb-2 group-hover:text-neon-light transition-colors">{t.title}</h3>
              <p className="text-sm text-white/50 mb-4 leading-relaxed">{t.desc}</p>
              <span className="text-sm text-neon-light flex items-center gap-1">
                Coba sekarang <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </span>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
