import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Flame } from 'lucide-react'
import WishlistButton from './WishlistButton'
import GameArt from './GameArt'

export default function ProductCard({ product, index = 0 }) {
  const { id, slug, name, publisher, group, hot } = product

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.4, delay: (index % 10) * 0.03, ease: [0.16, 1, 0.3, 1] }}
      whileHover={{ y: -6 }}
    >
      <Link to={`/produk/${slug}`} className="glass-card group block overflow-hidden relative">
        <div className="relative aspect-square overflow-hidden">
          <div className="w-full h-full transition-transform duration-500 ease-premium group-hover:scale-110">
            <GameArt slug={slug} name={name} group={group} />
          </div>
          {/* diagonal shine sweep on hover */}
          <div className="absolute inset-0 bg-shine opacity-0 group-hover:opacity-100 group-hover:animate-shine pointer-events-none" />
          {hot && (
            <span className="badge-hot absolute top-2 left-2 flex items-center gap-1">
              <Flame className="w-3 h-3" /> Terlaris
            </span>
          )}
          <WishlistButton gameId={id} className="absolute top-2 right-2" />
        </div>
        <div className="p-3">
          <h3 className="font-semibold text-sm truncate group-hover:text-neon-light transition-colors duration-300">{name}</h3>
          <p className="text-xs text-white/40 truncate">{publisher}</p>
        </div>
      </Link>
    </motion.div>
  )
}
