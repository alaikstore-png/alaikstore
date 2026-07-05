import { motion } from 'framer-motion'
import { Tag, Copy } from 'lucide-react'

const promos = [
  { code: 'ALAIK10', desc: 'Diskon 10% untuk semua produk Mobile Game', expiry: '31 Jul 2026' },
  { code: 'WEEKEND15', desc: 'Diskon 15% khusus top up di akhir pekan', expiry: '31 Jul 2026' },
  { code: 'NEWUSER20', desc: 'Diskon 20% untuk transaksi pertama pengguna baru', expiry: '31 Agu 2026' },
  { code: 'VOUCHERFREE', desc: 'Gratis biaya admin untuk pembayaran QRIS', expiry: '15 Jul 2026' },
]

export default function Promo() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <h1 className="font-display text-2xl font-bold mb-2">Promo & Voucher</h1>
      <p className="text-white/50 text-sm mb-8">Gunakan kode voucher berikut saat checkout untuk mendapatkan diskon tambahan.</p>

      <div className="grid sm:grid-cols-2 gap-5">
        {promos.map((p, i) => (
          <motion.div
            key={p.code}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.06 }}
            className="glass-card p-5 relative overflow-hidden"
          >
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-neon-light" />
              <code className="font-mono font-bold text-neon-light">{p.code}</code>
            </div>
            <p className="text-sm text-white/70 mb-3">{p.desc}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs text-white/30">Berlaku hingga {p.expiry}</span>
              <button
                onClick={() => navigator.clipboard.writeText(p.code)}
                className="btn-outline text-xs py-1.5 flex items-center gap-1"
              >
                <Copy className="w-3 h-3" /> Salin
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
