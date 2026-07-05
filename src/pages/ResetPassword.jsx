import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Lock, Loader2, KeyRound } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function ResetPassword() {
  const navigate = useNavigate()
  const [ready, setReady] = useState(false) // whether Supabase found a valid recovery session in the URL
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    // `detectSessionInUrl: true` (see supabaseClient.js) already parses the recovery
    // token from the email link on load; we just confirm a session actually landed.
    supabase.auth.getSession().then(({ data }) => setReady(!!data.session))
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('Konfirmasi password tidak cocok.')
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.updateUser({ password })
      if (error) throw error
      setDone(true)
      setTimeout(() => navigate('/login'), 1800)
    } catch (err) {
      setError(err.message || 'Gagal mengubah password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="glass-card w-full max-w-md p-8">
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-neon/20 border border-neon/40 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-neon-light" />
          </div>
          <h1 className="font-display text-xl font-bold">Atur Ulang Password</h1>
        </div>

        {!ready ? (
          <p className="text-white/40 text-sm text-center">
            Link reset tidak valid atau sudah kedaluwarsa. Minta link baru dari halaman "Lupa Password".
          </p>
        ) : done ? (
          <div className="text-center py-4">
            <p className="text-neon-light font-medium">Password berhasil diubah!</p>
            <p className="text-white/40 text-sm mt-1">Mengalihkan ke halaman masuk...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="password" required minLength={6} placeholder="Password Baru" value={password}
                onChange={(e) => setPassword(e.target.value)} className="input-glass pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="password" required minLength={6} placeholder="Konfirmasi Password Baru" value={confirm}
                onChange={(e) => setConfirm(e.target.value)} className="input-glass pl-10" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button disabled={loading} className="btn-neon w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Simpan Password Baru
            </button>
          </form>
        )}
      </motion.div>
    </div>
  )
}
