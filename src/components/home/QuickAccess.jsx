import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Smartphone, Wifi, Zap, WalletCards, Gamepad2, Gift } from 'lucide-react'

// Fast shortcuts to the categories people reach for most often. Each links
// back to the homepage with a `kategori` query param that CategoryGrid picks
// up to pre-filter its tabs, then jumps straight to the product list.
const shortcuts = [
  { label: 'Pulsa', icon: Smartphone, group: 'Pulsa & Data', from: '#e4032e', to: '#7a0000' },
  { label: 'Paket Data', icon: Wifi, group: 'Pulsa & Data', from: '#0f1d78', to: '#1e88e5' },
  { label: 'Token Listrik', icon: Zap, group: 'Token & Tagihan', from: '#facc15', to: '#1d4ed8' },
  { label: 'Top Up E-Wallet', icon: WalletCards, group: 'Top Up E-Wallet', from: '#118eea', to: '#4c3494' },
  { label: 'Top Up Game', icon: Gamepad2, group: 'Mobile Game', from: '#3B82F6', to: '#1D4ED8' },
  { label: 'Voucher', icon: Gift, group: 'Voucher', from: '#7c3aed', to: '#c026d3' },
]

export default function QuickAccess() {
  return (
    <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 md:gap-4">
      {shortcuts.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.3, delay: i * 0.05 }}
        >
          <Link
            to={`/?kategori=${encodeURIComponent(s.group)}#kategori-produk`}
            className="glass-card flex flex-col items-center justify-center gap-2 py-4 px-2 text-center group"
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-110"
              style={{ background: `linear-gradient(135deg, ${s.from}, ${s.to})` }}
            >
              <s.icon className="w-5 h-5 text-white" />
            </div>
            <span className="text-[11px] sm:text-xs font-medium text-white/80 leading-tight">{s.label}</span>
          </Link>
        </motion.div>
      ))}
    </div>
  )
}
