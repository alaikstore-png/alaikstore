import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, Loader2, Zap } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabaseClient'
import GoogleButton from '../components/ui/GoogleButton'

export default function Login() {
  const { signIn } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({ email: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsVerification, setNeedsVerification] = useState(false)
  const [resendSent, setResendSent] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setNeedsVerification(false)
    try {
      await signIn(form)
      navigate('/dashboard')
    } catch (err) {
      const msg = err.message || 'Gagal masuk. Periksa email dan password Anda.'
      setError(msg)
      if (/confirm/i.test(msg)) setNeedsVerification(true) // Supabase's "Email not confirmed" error
    } finally {
      setLoading(false)
    }
  }

  const resendVerification = async () => {
    await supabase.auth.resend({ type: 'signup', email: form.email })
    setResendSent(true)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-neon/20 border border-neon/40 flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-neon-light" />
          </div>
          <h1 className="font-display text-xl font-bold">Masuk ke Alaikstore</h1>
          <p className="text-white/40 text-sm mt-1">Lanjutkan top up favoritmu</p>
        </div>

        <GoogleButton />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs text-white/30">atau masuk dengan email</span>
          <div className="flex-1 h-px bg-white/10" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="email"
              required
              placeholder="Email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="input-glass pl-10"
            />
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
            <input
              type="password"
              required
              placeholder="Password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className="input-glass pl-10"
            />
          </div>

          <div className="text-right -mt-1">
            <Link to="/lupa-password" className="text-xs text-neon-light hover:underline">Lupa password?</Link>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          {needsVerification && (
            <div className="text-xs bg-neon/10 border border-neon/20 rounded-xl p-3">
              <p className="text-white/60 mb-2">Email Anda belum diverifikasi.</p>
              {resendSent ? (
                <p className="text-neon-light">Email verifikasi baru sudah dikirim ulang.</p>
              ) : (
                <button type="button" onClick={resendVerification} className="text-neon-light hover:underline">
                  Kirim ulang email verifikasi
                </button>
              )}
            </div>
          )}

          <button disabled={loading} className="btn-neon w-full flex items-center justify-center gap-2">
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            Masuk
          </button>
        </form>

        <p className="text-center text-sm text-white/40 mt-6">
          Belum punya akun?{' '}
          <Link to="/register" className="text-neon-light hover:underline">
            Daftar sekarang
          </Link>
        </p>
      </motion.div>
    </div>
  )
}
