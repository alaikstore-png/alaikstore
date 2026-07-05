import { useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Mail, Lock, User, Phone, Gift, Loader2, Zap, MailCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import GoogleButton from '../components/ui/GoogleButton'

export default function Register() {
  const { signUp } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '', referredBy: params.get('ref') || '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null) // 'needs_verification' | 'done' | null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await signUp(form)
      // Supabase returns no session yet when "Confirm email" is enabled in the project's Auth settings.
      if (data?.user && !data?.session) {
        setResult('needs_verification')
      } else {
        setResult('done')
        setTimeout(() => navigate('/login'), 1800)
      }
    } catch (err) {
      setError(err.message || 'Gagal mendaftar. Coba lagi.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 pt-16 pb-10">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card w-full max-w-md p-8"
      >
        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-neon/20 border border-neon/40 flex items-center justify-center mb-3">
            <Zap className="w-6 h-6 text-neon-light" />
          </div>
          <h1 className="font-display text-xl font-bold">Buat Akun Baru</h1>
          <p className="text-white/40 text-sm mt-1">Gratis, cepat, dan aman</p>
        </div>

        {result === 'needs_verification' ? (
          <div className="text-center py-6">
            <MailCheck className="w-10 h-10 text-neon-light mx-auto mb-3" />
            <p className="text-neon-light font-medium">Cek email Anda</p>
            <p className="text-white/40 text-sm mt-1">
              Kami sudah mengirim link verifikasi ke <span className="text-white">{form.email}</span>. Klik link tersebut sebelum masuk.
            </p>
            <Link to="/login" className="btn-outline inline-block mt-5">Ke Halaman Masuk</Link>
          </div>
        ) : result === 'done' ? (
          <div className="text-center py-6">
            <p className="text-neon-light font-medium">Pendaftaran berhasil!</p>
            <p className="text-white/40 text-sm mt-1">Mengalihkan ke halaman masuk...</p>
          </div>
        ) : (
          <>
            <GoogleButton label="Daftar dengan Google" />
            <div className="flex items-center gap-3 my-5">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-xs text-white/30">atau daftar dengan email</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input required placeholder="Nama Lengkap" value={form.fullName}
                onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                className="input-glass pl-10" />
            </div>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="email" required placeholder="Email" value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="input-glass pl-10" />
            </div>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input placeholder="Nomor WhatsApp" value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="input-glass pl-10" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input type="password" required minLength={6} placeholder="Password (min. 6 karakter)" value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="input-glass pl-10" />
            </div>
            <div className="relative">
              <Gift className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input placeholder="Kode Referral (opsional)" value={form.referredBy}
                onChange={(e) => setForm({ ...form, referredBy: e.target.value.toUpperCase() })}
                className="input-glass pl-10" />
            </div>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button disabled={loading} className="btn-neon w-full flex items-center justify-center gap-2">
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              Daftar
            </button>
            </form>
          </>
        )}

        {result !== 'needs_verification' && (
          <p className="text-center text-sm text-white/40 mt-6">
            Sudah punya akun?{' '}
            <Link to="/login" className="text-neon-light hover:underline">
              Masuk di sini
            </Link>
          </p>
        )}
      </motion.div>
    </div>
  )
}
