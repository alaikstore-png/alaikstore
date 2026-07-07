import { getGameArt } from '../../data/gameArt'

/**
 * Renders a game/product tile. If the game has a real `imageUrl` set by the
 * admin (Dashboard Admin -> Kelola Game -> URL Thumbnail — e.g. a screenshot
 * or banner they have the rights to use), that image is shown as-is. When no
 * image has been set, falls back to a distinctive on-brand generated tile: a
 * gradient built from the game's real brand colors, a genre icon, and a
 * per-genre texture — so every product still looks identifiable instead of a
 * blank/broken image.
 *
 * Set `bannerMode` for full-bleed hero usage (bigger watermark, no caption —
 * the parent is expected to render its own title/subtitle over the top).
 */
export default function GameArt({ slug, name, group, imageUrl, className = '', bannerMode = false }) {
  const art = getGameArt(slug, group)
  const Icon = art.icon

  if (imageUrl) {
    return (
      <div className={`relative w-full h-full overflow-hidden ${className}`}>
        <img src={imageUrl} alt={name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
        <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-black/25 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />
        {!bannerMode && (
          <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
            <span className="inline-block text-[9px] font-semibold uppercase tracking-wider text-white/70 mb-0.5">{art.tag}</span>
            <p className="font-display font-bold text-white leading-tight text-[13px] drop-shadow line-clamp-2">{name}</p>
          </div>
        )}
      </div>
    )
  }

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${art.from} 0%, ${art.to} 100%)` }}
    >
      {/* Per-genre texture so tiles read as different at a glance even before
          you register the icon/name — hex grid for MOBA/strategy, diagonal
          motion lines for shooters, scattered dots for gacha/collector games,
          clean grid for financial products (pulsa/voucher/e-wallet). */}
      <div className="absolute inset-0 opacity-20" style={getPatternStyle(art.pattern)} />
      <Icon
        className={`absolute text-white/25 ${bannerMode ? '-right-10 -bottom-10 w-56 h-56' : '-right-3 -bottom-3 w-20 h-20'}`}
        strokeWidth={1.25}
      />
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-black/25 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 h-2/3 bg-gradient-to-t from-black/60 to-transparent" />

      {!bannerMode && (
        <div className="absolute inset-x-0 bottom-0 p-2.5 text-left">
          <span className="inline-block text-[9px] font-semibold uppercase tracking-wider text-white/70 mb-0.5">
            {art.tag}
          </span>
          <p className="font-display font-bold text-white leading-tight text-[13px] drop-shadow line-clamp-2">
            {name}
          </p>
        </div>
      )}
    </div>
  )
}

function getPatternStyle(pattern) {
  switch (pattern) {
    case 'hex':
      // Hexagon-ish grid built from two overlapping dot rows — reads as a
      // strategy-board texture, apt for MOBA/auto-battler tiles.
      return {
        backgroundImage:
          'radial-gradient(circle at 25% 25%, rgba(255,255,255,0.15) 2px, transparent 2.5px), radial-gradient(circle at 75% 75%, rgba(255,255,255,0.15) 2px, transparent 2.5px)',
        backgroundSize: '18px 18px',
      }
    case 'dots':
      // Loose scattered sparkle dots — apt for gacha/collector games.
      return {
        backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 2px)',
        backgroundSize: '16px 16px',
        backgroundPosition: '0 0, 8px 8px',
      }
    case 'grid':
      // Clean straight grid — apt for financial/voucher products.
      return {
        backgroundImage:
          'linear-gradient(rgba(255,255,255,0.10) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.10) 1px, transparent 1px)',
        backgroundSize: '20px 20px',
      }
    case 'diagonal':
    default:
      // Diagonal motion lines — apt for shooters/battle royale.
      return {
        backgroundImage:
          'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 14px)',
      }
  }
}
