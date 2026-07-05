import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Star, Gamepad2 } from 'lucide-react'

const zodiacs = [
  { name: 'Aries', id: 'Aries', range: [[3, 21], [4, 19]], element: 'Api', color: 'Merah', lucky: 9, game: 'Free Fire', vibe: 'Agresif dan berani ambil first blood — cocok jadi jungler/rusher hari ini.' },
  { name: 'Taurus', id: 'Taurus', range: [[4, 20], [5, 20]], element: 'Tanah', color: 'Hijau', lucky: 6, game: 'Mobile Legends', vibe: 'Sabar dan stabil, main role tank/support akan sangat membantu tim hari ini.' },
  { name: 'Gemini', id: 'Gemini', range: [[5, 21], [6, 20]], element: 'Udara', color: 'Kuning', lucky: 5, game: 'Valorant', vibe: 'Reflek cepat dan adaptif, cocok coba agent atau hero baru hari ini.' },
  { name: 'Cancer', id: 'Cancer', range: [[6, 21], [7, 22]], element: 'Air', color: 'Perak', lucky: 2, game: 'Genshin Impact', vibe: 'Mood eksploratif, waktu yang pas untuk grinding quest atau gacha.' },
  { name: 'Leo', id: 'Leo', range: [[7, 23], [8, 22]], element: 'Api', color: 'Emas', lucky: 1, game: 'Honor of Kings', vibe: 'Karisma tinggi, cocok jadi carry dan pusat perhatian di tim hari ini.' },
  { name: 'Virgo', id: 'Virgo', range: [[8, 23], [9, 22]], element: 'Tanah', color: 'Navy', lucky: 5, game: 'PUBG Mobile', vibe: 'Teliti dan strategis, rotasi zona dan looting akan lebih efisien hari ini.' },
  { name: 'Libra', id: 'Libra', range: [[9, 23], [10, 22]], element: 'Udara', color: 'Biru Muda', lucky: 6, game: 'League of Legends', vibe: 'Seimbang dalam mengambil keputusan, teamfight akan berjalan mulus.' },
  { name: 'Scorpio', id: 'Scorpio', range: [[10, 23], [11, 21]], element: 'Air', color: 'Maroon', lucky: 8, game: 'Blood Strike', vibe: 'Insting membunuh tajam, cocok main aggresive entry hari ini.' },
  { name: 'Sagittarius', id: 'Sagittarius', range: [[11, 22], [12, 21]], element: 'Api', color: 'Ungu', lucky: 3, game: 'Arena Breakout', vibe: 'Suka petualangan, waktunya coba map atau strategi baru.' },
  { name: 'Capricorn', id: 'Capricorn', range: [[12, 22], [1, 19]], element: 'Tanah', color: 'Coklat', lucky: 4, game: 'Ragnarok X: Next Generation', vibe: 'Disiplin dan pekerja keras, grinding level hari ini akan terasa memuaskan.' },
  { name: 'Aquarius', id: 'Aquarius', range: [[1, 20], [2, 18]], element: 'Udara', color: 'Turquoise', lucky: 7, game: 'Zenless Zone Zero', vibe: 'Kreatif dan out of the box, coba kombinasi build yang belum pernah dicoba.' },
  { name: 'Pisces', id: 'Pisces', range: [[2, 19], [3, 20]], element: 'Air', color: 'Sea Green', lucky: 3, game: 'Honkai Star Rail', vibe: 'Intuisi kuat, keberuntungan gacha sedang berpihak padamu hari ini.' },
]

function getZodiac(month, day) {
  return zodiacs.find(({ range: [[m1, d1], [m2, d2]] }) => {
    if (m1 < m2 || (m1 === m2 && d1 <= d2)) {
      return (month === m1 && day >= d1) || (month === m2 && day <= d2)
    }
    // wraps around year-end (Capricorn: Dec 22 - Jan 19)
    return (month === m1 && day >= d1) || (month === m2 && day <= d2)
  })
}

export default function ZodiacCalculator() {
  const [date, setDate] = useState('')
  const [result, setResult] = useState(null)

  const handleCheck = (e) => {
    e.preventDefault()
    if (!date) return
    const [, month, day] = date.split('-').map(Number)
    setResult(getZodiac(month, day))
  }

  return (
    <div className="max-w-3xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <span className="badge-discount inline-flex items-center gap-1 mb-3"><Sparkles className="w-3 h-3" /> Tools Gamer</span>
        <h1 className="font-display text-2xl md:text-3xl font-bold mb-2">Kalkulator Zodiak Gamer</h1>
        <p className="text-white/50 text-sm">
          Masukkan tanggal lahirmu untuk melihat zodiak dan "ramalan main game" hari ini — murni untuk hiburan sebelum kamu push rank!
        </p>
      </motion.div>

      <form onSubmit={handleCheck} className="glass-card p-6 flex flex-col sm:flex-row gap-3 mb-8">
        <input
          type="date"
          required
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className="input-glass flex-1"
        />
        <button className="btn-neon flex items-center justify-center gap-2">
          <Star className="w-4 h-4" /> Cek Zodiak
        </button>
      </form>

      <AnimatePresence mode="wait">
        {result && (
          <motion.div
            key={result.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="glass-card p-6 md:p-8"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-2xl bg-neon/15 border border-neon/30 flex items-center justify-center shrink-0">
                <Star className="w-8 h-8 text-neon-light" />
              </div>
              <div>
                <h2 className="font-display text-2xl font-bold">{result.name}</h2>
                <p className="text-white/50 text-sm">Elemen {result.element} · Warna Keberuntungan {result.color}</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-3 mb-6">
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center">
                <p className="text-xs text-white/40 mb-1">Angka Keberuntungan</p>
                <p className="font-display text-xl font-bold text-neon-light">{result.lucky}</p>
              </div>
              <div className="rounded-xl bg-white/5 border border-white/10 p-4 text-center sm:col-span-2">
                <p className="text-xs text-white/40 mb-1 flex items-center justify-center gap-1"><Gamepad2 className="w-3 h-3" /> Rekomendasi Game Hari Ini</p>
                <p className="font-semibold">{result.game}</p>
              </div>
            </div>

            <p className="text-sm text-white/70 leading-relaxed bg-white/5 border border-white/10 rounded-xl p-4">
              "{result.vibe}"
            </p>
            <p className="text-[11px] text-white/30 mt-4">
              *Hanya untuk hiburan, bukan ramalan yang bersifat ilmiah. Selamat bermain!
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
