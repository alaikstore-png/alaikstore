import { motion } from 'framer-motion'
import { ShieldCheck, Zap, Users, Globe } from 'lucide-react'

const values = [
  { icon: Zap, title: 'Cepat', desc: 'Sebagian besar transaksi diproses otomatis dalam hitungan detik.' },
  { icon: ShieldCheck, title: 'Aman', desc: 'Sistem pembayaran tersertifikasi dan data pengguna terenkripsi.' },
  { icon: Users, title: 'Terpercaya', desc: 'Dipercaya ratusan ribu pemain di seluruh Indonesia.' },
  { icon: Globe, title: '24/7', desc: 'Layanan top up tersedia kapan saja, tanpa hari libur.' },
]

export default function About() {
  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-14">
        <h1 className="font-display text-3xl font-bold mb-3">Tentang Alaikstore</h1>
        <p className="text-white/50 max-w-2xl mx-auto leading-relaxed">
          Alaikstore adalah platform top up game dan produk digital yang berfokus pada kecepatan, keamanan,
          dan kemudahan transaksi untuk para gamer di seluruh Indonesia. Kami bekerja sama dengan penyedia
          resmi untuk memastikan setiap transaksi Anda diproses secara instan dan aman.
        </p>
      </motion.div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {values.map((v, i) => (
          <motion.div
            key={v.title}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="glass-card p-6 text-center"
          >
            <div className="w-12 h-12 rounded-xl bg-neon/15 flex items-center justify-center mx-auto mb-4">
              <v.icon className="w-6 h-6 text-neon-light" />
            </div>
            <h3 className="font-semibold mb-1">{v.title}</h3>
            <p className="text-sm text-white/50 leading-relaxed">{v.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
