import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Loader2, KeyRound, MailCheck } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      })
      if (error) throw error
      setSent(true)
    } catch (err) {
      setError(err.message || 'Gagal mengirim email reset password.')
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
          <h1 className="font-display text-xl font-bold">Lupa Password</h1>
          <p className="text-white/40 text-sm mt-1 text-center">Masukkan email Anda, kami kirimkan link untuk atur ulang password.</p>
        </div>

        {sent ? (
          <div className="text-center py-4">
            <MailCheck className="w-10 h-10 text-neon-light mx-auto mb-3" />
            <p className="text-neon-light font-medium">Email terkirim</p>
            <p className="text-white/40 text-sm mt-1">Cek inbox <span className="text-white">{email}</span> dan klik link di dalamnya.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="email" required placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} className="input-glass pl-10" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button disabled={loading} className="btn-neon w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Kirim Link Reset
            </button>
          </form>
        )}

        <p className="text-center text-sm text-white/40 mt-6">
          <Link to="/login" className="text-neon-light hover:underline">Kembali ke halaman masuk</Link>
        </p>
      </motion.div>
    </div>
  )
}
