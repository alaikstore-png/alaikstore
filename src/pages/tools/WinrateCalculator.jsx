import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'
import { Swords, Target, TrendingUp } from 'lucide-react'

export default function WinrateCalculator() {
  const [wins, setWins] = useState(42)
  const [losses, setLosses] = useState(28)
  const [targetRate, setTargetRate] = useState(60)

  const total = Math.max(Number(wins) || 0, 0) + Math.max(Number(losses) || 0, 0)
  const winrate = total > 0 ? ((Number(wins) / total) * 100) : 0

  // How many consecutive wins (with no more losses) are needed to reach the target rate.
  const winsNeeded = useMemo(() => {
    const w = Number(wins) || 0
    const l = Number(losses) || 0
    const t = Math.min(Math.max(Number(targetRate) || 0, 0), 99.9) / 100
    if (t <= 0) return 0
    if (w + l === 0) return 0
    if (w / (w + l) >= t) return 0
    // Solve (w + x) / (w + l + x) >= t for smallest integer x >= 0
    const numerator = t * (w + l) - w
    const denominator = 1 - t
    if (denominator <= 0) return null // target of 100% or more is unreachable with any losses
    return Math.max(Math.ceil(numerator / denominator), 0)
  }, [wins, losses, targetRate])

  const data = [
    { name: 'Menang', value: Math.max(Number(wins) || 0, 0) },
    { name: 'Kalah', value: Math.max(Number(losses) || 0, 0) },
  ]
  const COLORS = ['#3B82F6', '#ef4444']

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <span className="badge-discount inline-flex items-center gap-1 mb-3"><Swords className="w-3 h-3" /> Tools Gamer</span>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Kalkulator Winrate</h1>
        <p className="text-white/50 text-sm">
          Hitung persentase kemenanganmu dan cari tahu berapa kali kamu harus menang beruntun
          untuk mencapai winrate impian sebelum push rank.
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-card p-6 space-y-5">
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Jumlah Menang</label>
            <input
              type="number"
              min={0}
              value={wins}
              onChange={(e) => setWins(e.target.value)}
              className="input-glass"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Jumlah Kalah</label>
            <input
              type="number"
              min={0}
              value={losses}
              onChange={(e) => setLosses(e.target.value)}
              className="input-glass"
            />
          </div>
          <div>
            <label className="text-xs text-white/50 mb-1.5 block">Target Winrate (%)</label>
            <input
              type="number"
              min={0}
              max={99}
              value={targetRate}
              onChange={(e) => setTargetRate(e.target.value)}
              className="input-glass"
            />
          </div>

          <div className="border-t border-white/10 pt-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60 flex items-center gap-2"><Target className="w-4 h-4 text-neon-light" /> Total Match</span>
              <span className="font-semibold">{total}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-white/60 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-neon-light" /> Winrate Saat Ini</span>
              <span className="font-display text-xl font-bold text-neon-light">{winrate.toFixed(1)}%</span>
            </div>
            <div className="rounded-xl bg-white/5 border border-white/10 p-3 text-sm text-white/70">
              {winsNeeded === null && 'Target 100% tidak mungkin dicapai selama masih ada pertandingan kalah.'}
              {winsNeeded === 0 && winsNeeded !== null && 'Selamat, winrate kamu sudah mencapai atau melebihi target!'}
              {winsNeeded > 0 && (
                <>Kamu perlu menang <span className="text-neon-light font-semibold">{winsNeeded} kali beruntun</span> (tanpa kalah lagi) untuk mencapai winrate {targetRate}%.</>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-6 flex flex-col items-center justify-center">
          {total > 0 ? (
            <div className="w-full h-56">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={data} dataKey="value" nameKey="name" innerRadius={55} outerRadius={80} paddingAngle={3}>
                    {data.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#0f1420', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12, color: '#fff' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <p className="text-white/40 text-sm py-16">Masukkan data pertandingan untuk melihat grafik.</p>
          )}
          <div className="flex gap-6 mt-2">
            <span className="text-xs flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-neon inline-block" /> Menang ({wins || 0})</span>
            <span className="text-xs flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" /> Kalah ({losses || 0})</span>
          </div>
        </div>
      </div>
    </div>
  )
}
