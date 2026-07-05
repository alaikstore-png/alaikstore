import { getGameArt } from '../../data/gameArt'

/**
 * Renders a distinctive, on-brand tile for a game/product: a gradient built
 * from the game's real brand colors, a large watermark icon representing its
 * genre, and the game's name set as bold display text — so every product is
 * visually identifiable at a glance instead of a repeated stock photo.
 *
 * Set `bannerMode` for full-bleed hero usage (bigger watermark, no caption —
 * the parent is expected to render its own title/subtitle over the top).
 */
export default function GameArt({ slug, name, group, className = '', bannerMode = false }) {
  const art = getGameArt(slug, group)
  const Icon = art.icon

  return (
    <div
      className={`relative w-full h-full flex items-center justify-center overflow-hidden ${className}`}
      style={{ background: `linear-gradient(135deg, ${art.from} 0%, ${art.to} 100%)` }}
    >
      {/* subtle diagonal texture so flat gradients don't feel too plain */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            'repeating-linear-gradient(135deg, rgba(255,255,255,0.08) 0px, rgba(255,255,255,0.08) 2px, transparent 2px, transparent 14px)',
        }}
      />
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
