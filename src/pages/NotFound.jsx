import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Home, SearchX } from 'lucide-react'

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
        <div className="w-16 h-16 rounded-2xl bg-neon/15 border border-neon/30 flex items-center justify-center mx-auto mb-6">
          <SearchX className="w-8 h-8 text-neon-light" />
        </div>
        <h1 className="font-display text-5xl font-bold mb-3">404</h1>
        <p className="text-white/50 mb-8">Halaman yang Anda cari tidak ditemukan atau sudah dipindahkan.</p>
        <Link to="/" className="btn-neon inline-flex items-center gap-2">
          <Home className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </motion.div>
    </div>
  )
}
