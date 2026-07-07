import { useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Copy, Check } from 'lucide-react'

// Weighted segments — higher `weight` = more likely to land there.
// The 10% off segment intentionally reuses the real demo promo code
// (ALAIK10) that already works on the checkout page, so a "win" here is
// actually usable, not just decorative.
const segments = [
  { label: 'Diskon 10%', code: 'ALAIK10', color: '#3B82F6', weight: 3 },
  { label: 'Diskon 5%', code: 'HOKI5', color: '#60A5FA', weight: 4 },
  { label: 'Coba Lagi', code: null, color: '#1e2740', weight: 6 },
  { label: 'Cashback Rp5rb', code: 'CASH5RB', color: '#1D4ED8', weight: 3 },
  { label: 'Coba Lagi', code: null, color: '#161c2c', weight: 6 },
  { label: 'Diskon 15%', code: 'MAGIC15', color: '#93C5FD', weight: 1 },
  { label: 'Bonus Diamond', code: 'BONUSDM', color: '#2563EB', weight: 2 },
  { label: 'Coba Lagi', code: null, color: '#0f1420', weight: 6 },
]

const SEGMENT_ANGLE = 360 / segments.length

function pickWeightedIndex() {
  const total = segments.reduce((sum, s) => sum + s.weight, 0)
  let r = Math.random() * total
  for (let i = 0; i < segments.length; i++) {
    r -= segments[i].weight
    if (r <= 0) return i
  }
  return segments.length - 1
}

export default function MagicWheel() {
  const [rotation, setRotation] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const spinCount = useRef(0)

  const spin = () => {
    if (spinning) return
    setSpinning(true)
    setResult(null)
    setCopied(false)

    const winnerIndex = pickWeightedIndex()
    spinCount.current += 1
    // Land the pointer (fixed at top, 0deg) on the middle of the winning segment.
    const targetAngle = 360 - (winnerIndex * SEGMENT_ANGLE + SEGMENT_ANGLE / 2)
    const fullSpins = 5 + spinCount.current % 3
    const newRotation = rotation - (rotation % 360) + fullSpins * 360 + targetAngle

    setRotation(newRotation)
    setTimeout(() => {
      setResult(segments[winnerIndex])
      setSpinning(false)
    }, 4200)
  }

  const copyCode = () => {
    if (!result?.code) return
    navigator.clipboard?.writeText(result.code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
        <span className="badge-discount inline-flex items-center gap-1 mb-3"><Sparkles className="w-3 h-3" /> Tools Gamer</span>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Magic Wheel</h1>
        <p className="text-white/50 text-sm max-w-md mx-auto">
          Putar roda keberuntungan sekali sehari dan menangkan voucher diskon untuk top up berikutnya!
        </p>
      </motion.div>

      <div className="flex flex-col items-center">
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 mb-8">
          {/* pointer */}
          <div className="absolute -top-1 left-1/2 -translate-x-1/2 z-20 w-0 h-0 border-l-[12px] border-l-transparent border-r-[12px] border-r-transparent border-t-[20px] border-t-neon-light drop-shadow-lg" />

          <motion.div
            animate={{ rotate: rotation }}
            transition={{ duration: 4, ease: [0.17, 0.67, 0.32, 1.01] }}
            className="relative w-full h-full rounded-full border-4 border-white/10 shadow-neon-lg overflow-hidden"
            style={{
              background: `conic-gradient(${segments
                .map((s, i) => `${s.color} ${i * SEGMENT_ANGLE}deg ${(i + 1) * SEGMENT_ANGLE}deg`)
                .join(', ')})`,
            }}
          >
            {segments.map((s, i) => (
              <div
                key={i}
                className="absolute inset-0 flex justify-center"
                style={{ transform: `rotate(${i * SEGMENT_ANGLE + SEGMENT_ANGLE / 2}deg)` }}
              >
                <span
                  className="mt-4 text-[10px] sm:text-[11px] font-bold text-white uppercase tracking-wide drop-shadow"
                  style={{ writingMode: 'horizontal-tb' }}
                >
                  {s.label}
                </span>
              </div>
            ))}
          </motion.div>

          <div className="absolute inset-0 m-auto w-14 h-14 rounded-full bg-base-900 border-4 border-white/20 flex items-center justify-center z-10">
            <Sparkles className="w-6 h-6 text-neon-light" />
          </div>
        </div>

        <button onClick={spin} disabled={spinning} className="btn-neon px-8">
          {spinning ? 'Memutar...' : 'Putar Sekarang'}
        </button>

        {result && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-5 mt-6 w-full text-center"
          >
            {result.code ? (
              <>
                <p className="text-white/60 text-sm mb-2">Selamat! Kamu mendapatkan</p>
                <p className="font-display text-xl font-bold text-neon-light mb-3">{result.label}</p>
                <button
                  onClick={copyCode}
                  className="btn-outline inline-flex items-center gap-2 text-sm mx-auto"
                >
                  {copied ? <Check className="w-4 h-4 text-neon-light" /> : <Copy className="w-4 h-4" />}
                  Kode: {result.code}
                </button>
                <p className="text-[11px] text-white/30 mt-3">Gunakan kode ini di kolom voucher promo saat checkout.</p>
              </>
            ) : (
              <p className="text-white/60 text-sm">Belum beruntung kali ini — coba lagi besok ya!</p>
            )}
          </motion.div>
        )}
      </div>
    </div>
  )
}
