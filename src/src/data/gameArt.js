// Visual identity per game/product.
// Instead of generic stock photos (or hotlinking copyrighted logo artwork we
// don't have rights to redistribute), every product gets a distinctive card
// built from its real brand colors + a genre icon + its name rendered as
// bold text — so each tile is instantly recognizable and never a repeated
// "joystick stock photo" placeholder.
import {
  Swords, Sword, Flame, Crosshair, Crown, Skull, Shield, Sparkles, Wand2, Bomb,
  Wallet, Gamepad2, PlayCircle, Coins, Blocks, Star, Zap, Gem, Rocket, Backpack,
  Smartphone, Receipt, HeartPulse, CreditCard, Banknote, CircleDollarSign, Landmark,
} from 'lucide-react'

// `pattern` gives each genre a distinct subtle texture (on top of the
// gradient + icon) so tiles read as different at a glance even before you
// register the icon or read the name — MOBA/strategy games get a hex-grid
// feel, shooters get motion-diagonal, gacha/collector games get a starry
// scatter, and financial products (pulsa/voucher/e-wallet) get a clean grid.
export const gameArtMap = {
  'mobile-legends': { from: '#1e3a8a', to: '#f59e0b', icon: Swords, tag: 'MOBA', pattern: 'hex' },
  'free-fire': { from: '#f97316', to: '#111827', icon: Flame, tag: 'Battle Royale', pattern: 'diagonal' },
  'pubg-mobile': { from: '#4d5b31', to: '#1c1c14', icon: Backpack, tag: 'Battle Royale', pattern: 'diagonal' },
  'honor-of-kings': { from: '#5b21b6', to: '#facc15', icon: Crown, tag: 'MOBA', pattern: 'hex' },
  'blood-strike': { from: '#7f1d1d', to: '#111827', icon: Skull, tag: 'FPS', pattern: 'diagonal' },
  'cod-mobile': { from: '#3f3f2e', to: '#0a0a0a', icon: Crosshair, tag: 'FPS', pattern: 'diagonal' },
  'arena-breakout': { from: '#78350f', to: '#292524', icon: Shield, tag: 'Tactical FPS', pattern: 'diagonal' },
  'magic-chess': { from: '#6d28d9', to: '#0891b2', icon: Sparkles, tag: 'Auto Battler', pattern: 'hex' },
  'ragnarok-x': { from: '#1d4ed8', to: '#e0f2fe', icon: Wand2, tag: 'MMORPG', pattern: 'dots' },
  'valorant': { from: '#dc2626', to: '#111111', icon: Crosshair, tag: 'Tactical Shooter', pattern: 'diagonal' },
  'point-blank': { from: '#eab308', to: '#1c1917', icon: Bomb, tag: 'FPS', pattern: 'diagonal' },
  'league-of-legends': { from: '#0ea5e9', to: '#92400e', icon: Sword, tag: 'MOBA', pattern: 'hex' },
  'steam-wallet': { from: '#1b2838', to: '#2a475e', icon: Wallet, tag: 'Voucher', pattern: 'grid' },
  'psn': { from: '#003791', to: '#0070d1', icon: Gamepad2, tag: 'Voucher', pattern: 'grid' },
  'google-play': { from: '#00c853', to: '#2962ff', icon: PlayCircle, tag: 'Voucher', pattern: 'grid' },
  'garena-shell': { from: '#f97316', to: '#7c2d12', icon: Coins, tag: 'Voucher', pattern: 'grid' },
  'roblox': { from: '#e11d48', to: '#1f2937', icon: Blocks, tag: 'Produk Digital', pattern: 'dots' },
  'genshin-impact': { from: '#0d9488', to: '#eab308', icon: Gem, tag: 'Produk Digital', pattern: 'dots' },
  'honkai-star-rail': { from: '#4338ca', to: '#a855f7', icon: Star, tag: 'Produk Digital', pattern: 'dots' },
  'zenless-zone-zero': { from: '#facc15', to: '#111111', icon: Zap, tag: 'Produk Digital', pattern: 'dots' },

  // Pulsa & Paket Data — colors follow each operator's real brand identity
  'pulsa-telkomsel': { from: '#e4032e', to: '#7a0000', icon: Smartphone, tag: 'Pulsa & Data', pattern: 'grid' },
  'pulsa-indosat': { from: '#ffd200', to: '#dc0032', icon: Smartphone, tag: 'Pulsa & Data', pattern: 'grid' },
  'pulsa-xl': { from: '#0f1d78', to: '#1e88e5', icon: Smartphone, tag: 'Pulsa & Data', pattern: 'grid' },
  'pulsa-axis': { from: '#6d28d9', to: '#a21caf', icon: Smartphone, tag: 'Pulsa & Data', pattern: 'grid' },
  'pulsa-tri': { from: '#111111', to: '#7c3aed', icon: Smartphone, tag: 'Pulsa & Data', pattern: 'grid' },
  'pulsa-smartfren': { from: '#ed1c24', to: '#7f1d1d', icon: Smartphone, tag: 'Pulsa & Data', pattern: 'grid' },

  // Token & Tagihan
  'token-listrik-pln': { from: '#facc15', to: '#1d4ed8', icon: Zap, tag: 'Token PLN', pattern: 'grid' },
  'tagihan-listrik-pln': { from: '#1d4ed8', to: '#facc15', icon: Receipt, tag: 'Tagihan', pattern: 'grid' },
  'bpjs-kesehatan': { from: '#00913f', to: '#046a38', icon: HeartPulse, tag: 'Tagihan', pattern: 'grid' },

  // Top Up E-Wallet — real brand colors per wallet, distinct icon per brand
  'topup-dana': { from: '#118eea', to: '#0a5cab', icon: Wallet, tag: 'Top Up E-Wallet', pattern: 'grid' },
  'topup-ovo': { from: '#4c3494', to: '#7b3fe4', icon: CreditCard, tag: 'Top Up E-Wallet', pattern: 'grid' },
  'topup-gopay': { from: '#00aa13', to: '#00880f', icon: Banknote, tag: 'Top Up E-Wallet', pattern: 'grid' },
  'topup-shopeepay': { from: '#ee4d2d', to: '#c53a1f', icon: CircleDollarSign, tag: 'Top Up E-Wallet', pattern: 'grid' },
  'topup-linkaja': { from: '#e4002b', to: '#ff0000', icon: Landmark, tag: 'Top Up E-Wallet', pattern: 'grid' },
}

const fallbackPalette = [
  ['#1e40af', '#0ea5e9'], ['#7c3aed', '#c026d3'], ['#059669', '#84cc16'],
  ['#b91c1c', '#f97316'], ['#0f766e', '#2dd4bf'], ['#a16207', '#facc15'],
]

function hashSlug(slug = '') {
  let h = 0
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0
  return h
}

export function getGameArt(slug, group) {
  if (gameArtMap[slug]) return gameArtMap[slug]
  const [from, to] = fallbackPalette[hashSlug(slug) % fallbackPalette.length]
  const icon = group === 'Voucher' ? Gem : group === 'PC Game' ? Rocket : Gamepad2
  const pattern = group === 'Voucher' ? 'grid' : group === 'PC Game' ? 'diagonal' : 'dots'
  return { from, to, icon, tag: group || 'Game', pattern }
}
