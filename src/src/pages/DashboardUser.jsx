import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { User, Wallet, Clock, Heart, Users, Ticket, Copy, Trash2, Loader2, Share2, PiggyBank, Home } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks/useFetch'
import { supabase } from '../lib/supabaseClient'
import { createOrder } from '../lib/api'
import { paymentMethods } from '../data/mockData'
import { TIER_LABEL } from '../lib/pricing'
import { LineSkeleton } from '../components/ui/Skeleton'
import { usePushNotifications } from '../hooks/usePushNotifications'
import { Bell, BellOff, BellRing } from 'lucide-react'

const tabs = [
  { id: 'profil', label: 'Profil', icon: User },
  { id: 'saldo', label: 'Saldo', icon: Wallet },
  { id: 'riwayat', label: 'Riwayat', icon: Clock },
  { id: 'wishlist', label: 'Wishlist', icon: Heart },
  { id: 'referral', label: 'Referral', icon: Users },
  { id: 'affiliate', label: 'Affiliate', icon: Share2 },
  { id: 'cashback', label: 'Cashback', icon: PiggyBank },
  { id: 'voucher', label: 'Voucher', icon: Ticket },
]

export default function DashboardUser() {
  const { profile, user } = useAuth()
  const [tab, setTab] = useState('profil')

  const { data: orders, loading: loadingOrders } = useFetch(
    () => supabase.from('orders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }).limit(5),
    [user?.id]
  )

  const { data: wishlist, loading: loadingWishlist, refetch: refetchWishlist } = useFetch(
    () => supabase.from('wishlists').select('id, game_id, games(slug, name, publisher, thumbnail_url)').eq('user_id', user?.id).order('created_at', { ascending: false }),
    [user?.id]
  )

  const removeWishlist = async (id) => {
    await supabase.from('wishlists').delete().eq('id', id)
    refetchWishlist()
  }

  const referralCode = profile?.referral_code || (user ? `ALAIK-${user.id.slice(0, 6).toUpperCase()}` : '')

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">Dashboard Saya</h1>
        <Link to="/" className="btn-outline text-sm py-2 flex items-center gap-2">
          <Home className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        <aside className="glass-card p-3 h-fit lg:sticky lg:top-24">
          {tabs.map((t) => {
            const Icon = t.icon
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm mb-1 transition-colors ${
                  tab === t.id ? 'bg-neon/15 text-neon-light border border-neon/30' : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" /> {t.label}
              </button>
            )
          })}
        </aside>

        <div className="lg:col-span-3 glass-card p-6 min-h-[320px]">
          {tab === 'profil' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
              <h2 className="font-semibold mb-2">Informasi Profil</h2>
              <Field label="Nama Lengkap" value={profile?.full_name} />
              <Field label="Email" value={user?.email} />
              <Field label="Nomor WhatsApp" value={profile?.phone} />
              <div>
                <p className="text-xs text-white/40 mb-1">Tingkat Harga</p>
                <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 flex items-center justify-between">
                  <span className="text-sm">{TIER_LABEL[profile?.price_tier] || 'Publik'}</span>
                  {profile?.price_tier && profile.price_tier !== 'public' && (
                    <span className="badge-discount text-[11px]">Harga Spesial Aktif</span>
                  )}
                </div>
                <p className="text-[11px] text-white/30 mt-1">Hubungi admin untuk naik ke tingkat Member/Reseller dan dapatkan harga lebih murah di setiap produk.</p>
              </div>
              <Field label="Bergabung Sejak" value={profile?.created_at ? new Date(profile.created_at).toLocaleDateString('id-ID') : '-'} />
              <NotificationSettings userId={user?.id} />
            </motion.div>
          )}

          {tab === 'saldo' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold mb-4">Saldo Alaikstore</h2>
              <div className="glass-card p-6 bg-gradient-to-br from-neon/20 to-transparent mb-6">
                <p className="text-white/50 text-sm mb-1">Total Saldo</p>
                <p className="font-display text-3xl font-bold text-neon-light">
                  Rp {(profile?.balance || 0).toLocaleString('id-ID')}
                </p>
              </div>
              <DepositForm />
            </motion.div>
          )}

          {tab === 'riwayat' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold mb-4">Transaksi Terbaru</h2>
              {loadingOrders ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => <LineSkeleton key={i} />)}
                </div>
              ) : orders?.length ? (
                <div className="space-y-3">
                  {orders.map((o) => (
                    <div key={o.id} className="flex flex-wrap justify-between items-center gap-2 border-b border-white/5 pb-3 text-sm">
                      <div className="min-w-0">
                        <p className="font-medium truncate">{o.product_slug}</p>
                        <p className="text-white/40 text-xs">{new Date(o.created_at).toLocaleString('id-ID')}</p>
                      </div>
                      <StatusBadge status={o.status} />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">Belum ada transaksi.</p>
              )}
            </motion.div>
          )}

          {tab === 'wishlist' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold mb-4">Wishlist</h2>
              {loadingWishlist ? (
                <div className="space-y-3">{[1, 2, 3].map((i) => <LineSkeleton key={i} />)}</div>
              ) : wishlist?.length ? (
                <div className="space-y-3">
                  {wishlist.map((w) => (
                    <div key={w.id} className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <Link to={`/produk/${w.games?.slug}`} className="flex items-center gap-3 min-w-0 hover:text-neon-light transition-colors">
                        <img src={w.games?.thumbnail_url} alt={w.games?.name} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        <div className="min-w-0">
                          <p className="text-sm font-medium truncate">{w.games?.name}</p>
                          <p className="text-xs text-white/40 truncate">{w.games?.publisher}</p>
                        </div>
                      </Link>
                      <button onClick={() => removeWishlist(w.id)} className="text-xs text-red-400 hover:underline flex items-center gap-1 shrink-0">
                        <Trash2 className="w-3 h-3" /> Hapus
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 text-sm">Belum ada produk di wishlist. Tap ikon hati di halaman produk untuk menyimpannya di sini.</p>
              )}
            </motion.div>
          )}

          {tab === 'referral' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold mb-4">Kode Referral</h2>
              <div className="flex items-center gap-3">
                <code className="glass px-4 py-2.5 rounded-xl text-neon-light font-mono">{referralCode}</code>
                <button
                  onClick={() => navigator.clipboard.writeText(referralCode)}
                  className="btn-outline flex items-center gap-2 text-sm"
                >
                  <Copy className="w-4 h-4" /> Salin
                </button>
              </div>
              <p className="text-white/40 text-sm mt-4">Ajak teman daftar pakai kode ini — begitu transaksi <em>pertama</em> mereka sukses, Anda dapat bonus saldo sekali. Untuk komisi berkelanjutan di setiap transaksi mereka, pakai tab <b>Affiliate</b>.</p>
            </motion.div>
          )}

          {tab === 'affiliate' && <AffiliateTab profile={profile} />}
          {tab === 'cashback' && <CashbackTab userId={user?.id} />}

          {tab === 'voucher' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <h2 className="font-semibold mb-4">Voucher Saya</h2>
              <p className="text-white/40 text-sm">Belum ada voucher aktif. Cek halaman Promo untuk voucher terbaru.</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  )
}

// Ongoing commission program: every successful order from someone who clicked
// this user's affiliate link earns a % commission (unlike Referral's one-time
// bonus). Stats come from affiliate_clicks (visits) and affiliate_commissions
// (actual earnings), both real Supabase tables.
function AffiliateTab({ profile }) {
  const affiliateCode = profile?.affiliate_code || '—'
  const affiliateLink = typeof window !== 'undefined' ? `${window.location.origin}/?aff=${affiliateCode}` : ''

  const { data: clicks } = useFetch(
    () => supabase.from('affiliate_clicks').select('id').eq('affiliate_code', affiliateCode),
    [affiliateCode]
  )
  const { data: commissions, loading } = useFetch(
    () => supabase.from('affiliate_commissions').select('*').eq('affiliate_user_id', profile?.id).order('created_at', { ascending: false }).limit(10),
    [profile?.id]
  )

  const totalEarned = (commissions || []).reduce((sum, c) => sum + Number(c.amount || 0), 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-semibold mb-4">Program Affiliate</h2>
      <p className="text-white/40 text-sm mb-4">
        Bagikan link di bawah. Setiap orang yang klik lalu bertransaksi — kapan pun, bukan cuma sekali — Anda dapat komisi {profile?.affiliate_rate || 0}% otomatis masuk saldo.
      </p>
      <div className="flex items-center gap-3 mb-6">
        <code className="glass px-4 py-2.5 rounded-xl text-neon-light font-mono text-xs truncate flex-1">{affiliateLink}</code>
        <button onClick={() => navigator.clipboard.writeText(affiliateLink)} className="btn-outline flex items-center gap-2 text-sm shrink-0">
          <Copy className="w-4 h-4" /> Salin
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        <MiniStat raw={clicks} />
        <div className="glass-card p-4">
          <p className="text-xs text-white/40 mb-1">Transaksi Terkonversi</p>
          <p className="font-display text-lg font-bold">{commissions?.length ?? '-'}</p>
        </div>
        <div className="glass-card p-4">
          <p className="text-xs text-white/40 mb-1">Total Komisi</p>
          <p className="font-display text-lg font-bold text-neon-light">Rp {totalEarned.toLocaleString('id-ID')}</p>
        </div>
      </div>

      <h3 className="font-semibold text-sm mb-3">Riwayat Komisi</h3>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <LineSkeleton key={i} />)}</div>
      ) : commissions?.length ? (
        <div className="space-y-2">
          {commissions.map((c) => (
            <div key={c.id} className="flex justify-between items-center border-b border-white/5 pb-2 text-sm">
              <span className="text-white/50">{new Date(c.created_at).toLocaleString('id-ID')}</span>
              <span className="text-neon-light">+ Rp {Number(c.amount).toLocaleString('id-ID')} ({c.rate}%)</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">Belum ada komisi. Bagikan link affiliate Anda untuk mulai menghasilkan.</p>
      )}
    </motion.div>
  )
}

// Small helper so the click-count stat doesn't crash while the head-only count
// query is still loading (useFetch's `data` is the raw response array/null here).
function MiniStat({ raw }) {
  return (
    <div className="glass-card p-4">
      <p className="text-xs text-white/40 mb-1">Total Klik</p>
      <p className="font-display text-lg font-bold">{raw === null ? '-' : raw?.length ?? 0}</p>
    </div>
  )
}

// Automatic cashback: a % of every successful purchase (rate depends on the
// user's price tier) is credited straight back to their balance. Ledger below
// comes from the real cashback_transactions table.
function CashbackTab({ userId }) {
  const { data: cashbacks, loading } = useFetch(
    () => supabase.from('cashback_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(10),
    [userId]
  )
  const totalCashback = (cashbacks || []).reduce((sum, c) => sum + Number(c.amount || 0), 0)

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <h2 className="font-semibold mb-4">Cashback</h2>
      <div className="glass-card p-6 bg-gradient-to-br from-neon/20 to-transparent mb-6">
        <p className="text-white/50 text-sm mb-1">Total Cashback Diterima</p>
        <p className="font-display text-3xl font-bold text-neon-light">Rp {totalCashback.toLocaleString('id-ID')}</p>
      </div>
      <p className="text-white/40 text-sm mb-4">Cashback otomatis masuk saldo setiap transaksi sukses — besarnya tergantung tingkat harga Anda (Member/Reseller dapat persentase lebih besar).</p>

      <h3 className="font-semibold text-sm mb-3">Riwayat Cashback</h3>
      {loading ? (
        <div className="space-y-3">{[1, 2, 3].map((i) => <LineSkeleton key={i} />)}</div>
      ) : cashbacks?.length ? (
        <div className="space-y-2">
          {cashbacks.map((c) => (
            <div key={c.id} className="flex justify-between items-center border-b border-white/5 pb-2 text-sm">
              <span className="text-white/50">{new Date(c.created_at).toLocaleString('id-ID')}</span>
              <span className="text-neon-light">+ Rp {Number(c.amount).toLocaleString('id-ID')} ({c.rate}%)</span>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">Belum ada cashback. Cashback muncul otomatis setelah transaksi Anda sukses.</p>
      )}
    </motion.div>
  )
}

function Field({ label, value }) {
  return (
    <div>
      <p className="text-xs text-white/40 mb-1">{label}</p>
      <p className="text-sm bg-white/5 border border-white/10 rounded-xl px-4 py-2.5">{value || '-'}</p>
    </div>
  )
}

// Lets the user turn browser push notifications on/off (order status updates,
// flash sale announcements). Silently hides itself on unsupported browsers
// instead of showing a broken toggle.
function NotificationSettings({ userId }) {
  const { supported, permission, subscribed, busy, error, enable, disable } = usePushNotifications(userId)

  if (!supported) return null

  return (
    <div>
      <p className="text-xs text-white/40 mb-1">Notifikasi</p>
      <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm">
          {subscribed ? <BellRing className="w-4 h-4 text-neon-light shrink-0" /> : <BellOff className="w-4 h-4 text-white/30 shrink-0" />}
          <span>
            {subscribed
              ? 'Notifikasi aktif — kamu akan diberitahu saat pesanan berhasil/gagal dan saat ada Flash Sale.'
              : 'Aktifkan supaya dapat notifikasi instan status pesanan & Flash Sale.'}
          </span>
        </div>
        <button
          onClick={subscribed ? disable : enable}
          disabled={busy || permission === 'denied'}
          className="btn-outline text-xs py-1.5 px-3 shrink-0 flex items-center gap-1.5 disabled:opacity-40"
        >
          <Bell className="w-3 h-3" /> {busy ? '...' : subscribed ? 'Matikan' : 'Aktifkan'}
        </button>
      </div>
      {permission === 'denied' && (
        <p className="text-[11px] text-red-400 mt-1">Izin notifikasi diblokir di browser. Aktifkan lewat pengaturan situs di browser kamu.</p>
      )}
      {error && <p className="text-[11px] text-red-400 mt-1">{error}</p>}
    </div>
  )
}

function StatusBadge({ status }) {
  const map = {
    success: 'bg-green-500/15 text-green-400',
    pending: 'bg-yellow-500/15 text-yellow-400',
    failed: 'bg-red-500/15 text-red-400',
  }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full capitalize ${map[status] || 'bg-white/10 text-white/50'}`}>
      {status || 'pending'}
    </span>
  )
}

const QUICK_AMOUNTS = [25000, 50000, 100000, 250000]

// Reuses the exact same order + payment-gateway pipeline as a normal top-up
// (see createOrder / payment-callback), just with product_slug = 'deposit-saldo'
// so the backend credits the user's balance directly instead of calling a provider.
function DepositForm() {
  const navigate = useNavigate()
  const [amount, setAmount] = useState('')
  const [paymentId, setPaymentId] = useState(paymentMethods[0].id)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    const value = Number(amount)
    if (!value || value < 10000) return setError('Minimal deposit Rp 10.000.')
    setSubmitting(true)
    setError('')
    try {
      const result = await createOrder({
        product_slug: 'deposit-saldo',
        user_game_id: 'DEPOSIT',
        denomination: 'Deposit Saldo',
        amount: value,
        payment_method: paymentId,
      })
      navigate(`/cek-pesanan?order=${result.order.id}`)
    } catch (err) {
      setError('Gagal membuat transaksi deposit. Coba lagi.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
      <h3 className="font-semibold text-sm">Isi Saldo</h3>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {QUICK_AMOUNTS.map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => setAmount(String(v))}
            className={`glass-card py-2 text-xs font-medium transition-all ${Number(amount) === v ? 'border-neon shadow-neon' : ''}`}
          >
            Rp {v.toLocaleString('id-ID')}
          </button>
        ))}
      </div>

      <input
        type="number"
        min={10000}
        placeholder="Atau masukkan nominal lain (min. Rp 10.000)"
        value={amount}
        onChange={(e) => setAmount(e.target.value)}
        className="input-glass"
      />

      <select value={paymentId} onChange={(e) => setPaymentId(e.target.value)} className="input-glass">
        {paymentMethods.map((m) => (
          <option key={m.id} value={m.id}>{m.name} — {m.group}</option>
        ))}
      </select>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <button disabled={submitting} className="btn-neon w-full flex items-center justify-center gap-2">
        {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
        Deposit Sekarang
      </button>
    </form>
  )
}
