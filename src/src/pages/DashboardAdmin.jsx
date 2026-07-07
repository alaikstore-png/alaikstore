import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  LayoutDashboard, Image, Gamepad2, Package, Tag, Users,
  ShoppingCart, Server, FileUp, FileDown, TrendingUp, Plus, Pencil, Trash2,
  Share2, PiggyBank, Settings, Layers, Wallet, RefreshCw, MessageCircle,
  Zap, BarChart3, Send, Bell, Home,
} from 'lucide-react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from 'recharts'
import { useFetch } from '../hooks/useFetch'
import { supabase } from '../lib/supabaseClient'
import { LineSkeleton } from '../components/ui/Skeleton'
import CrudModal from '../components/admin/CrudModal'
import { TABLE_CONFIG } from '../config/adminTables'
import { exportToExcel, parseExcelFile } from '../lib/excel'

const menu = [
  { id: 'overview', label: 'Statistik', icon: LayoutDashboard },
  { id: 'banners', label: 'Kelola Banner', icon: Image },
  { id: 'games', label: 'Kelola Game', icon: Gamepad2 },
  { id: 'products', label: 'Kelola Produk & Harga', icon: Package },
  { id: 'vouchers', label: 'Kelola Voucher', icon: Tag },
  { id: 'users', label: 'Kelola User', icon: Users },
  { id: 'orders', label: 'Kelola Pesanan', icon: ShoppingCart },
  { id: 'flash_sales', label: 'Kelola Flash Sale', icon: Zap },
  { id: 'profit_report', label: 'Laporan Laba Rugi', icon: Wallet },
  { id: 'analytics', label: 'Analitik Mendalam', icon: BarChart3 },
  { id: 'providers', label: 'Kelola Provider', icon: Server },
  { id: 'product_provider_links', label: 'Routing Harga Termurah', icon: Layers },
  { id: 'affiliate_commissions', label: 'Komisi Affiliate', icon: Share2 },
  { id: 'cashback_transactions', label: 'Cashback', icon: PiggyBank },
  { id: 'reward_settings', label: 'Pengaturan Reward', icon: Settings },
  { id: 'contact_settings', label: 'Kontak & Live Chat', icon: MessageCircle },
]

export default function DashboardAdmin() {
  const [tab, setTab] = useState('overview')
  const [importBusy, setImportBusy] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const [stats, setStats] = useState(null) // { totalSales7d, totalOrders, totalUsers, trend }

  const { data: orders, loading, refetch: refetchOrders } = useFetch(
    () => supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(20),
    []
  )

  useEffect(() => {
    if (tab !== 'overview') return
    let cancelled = false

    async function loadStats() {
      const DAY_LABELS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab']
      const sevenDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000)
      sevenDaysAgo.setHours(0, 0, 0, 0)

      const [ordersCountRes, usersCountRes, recentRes] = await Promise.all([
        supabase.from('orders').select('id', { count: 'exact', head: true }),
        supabase.from('users').select('id', { count: 'exact', head: true }),
        supabase.from('orders').select('amount, status, created_at').gte('created_at', sevenDaysAgo.toISOString()),
      ])
      if (cancelled) return

      const recent = recentRes.data || []
      const successRecent = recent.filter((o) => o.status === 'success')
      const totalSales7d = successRecent.reduce((sum, o) => sum + Number(o.amount || 0), 0)

      // Build one bucket per day for the last 7 days (oldest -> newest), summing successful order amounts.
      const trend = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date()
        d.setDate(d.getDate() - i)
        const dayStr = d.toDateString()
        const total = successRecent
          .filter((o) => new Date(o.created_at).toDateString() === dayStr)
          .reduce((sum, o) => sum + Number(o.amount || 0), 0)
        trend.push({ day: DAY_LABELS[d.getDay()], total })
      }

      setStats({
        totalSales7d,
        totalOrders: ordersCountRes.count || 0,
        totalUsers: usersCountRes.count || 0,
        trend,
      })
    }

    loadStats()
    return () => { cancelled = true }
  }, [tab])

  const handleExportOrders = () => {
    exportToExcel(
      (orders || []).map((o) => ({
        id: o.id, product_slug: o.product_slug, denomination: o.denomination,
        user_game_id: o.user_game_id, amount: o.amount, payment_method: o.payment_method,
        status: o.status, created_at: o.created_at,
      })),
      'pesanan-alaikstore'
    )
  }

  const handleImportOrders = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportBusy(true)
    setImportMsg('')
    try {
      const rows = await parseExcelFile(file)
      // Bulk status update: each row needs an `id` (order UUID) and a `status` column.
      let updated = 0
      for (const row of rows) {
        if (!row.id || !row.status) continue
        const { error } = await supabase.from('orders').update({ status: row.status }).eq('id', row.id)
        if (!error) updated++
      }
      setImportMsg(`${updated} dari ${rows.length} baris berhasil diperbarui.`)
      refetchOrders()
    } catch (err) {
      setImportMsg(`Gagal membaca file: ${err.message}`)
    } finally {
      setImportBusy(false)
      e.target.value = ''
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <h1 className="font-display text-2xl font-bold">Dashboard Admin</h1>
        <Link to="/" className="btn-outline text-sm py-2 flex items-center gap-2">
          <Home className="w-4 h-4" /> Kembali ke Beranda
        </Link>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <aside className="glass-card p-3 h-fit lg:sticky lg:top-24">
          {menu.map((m) => {
            const Icon = m.icon
            return (
              <button
                key={m.id}
                onClick={() => setTab(m.id)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm mb-1 text-left transition-colors ${
                  tab === m.id ? 'bg-neon/15 text-neon-light border border-neon/30' : 'text-white/60 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" /> {m.label}
              </button>
            )
          })}
        </aside>

        <div className="lg:col-span-4 space-y-6">
          {tab === 'overview' && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid sm:grid-cols-3 gap-4">
                <StatCard label="Total Penjualan (7 hari)" value={stats ? `Rp ${stats.totalSales7d.toLocaleString('id-ID')}` : null} icon={TrendingUp} />
                <StatCard label="Total Pesanan" value={stats ? stats.totalOrders.toLocaleString('id-ID') : null} icon={ShoppingCart} />
                <StatCard label="Total Pengguna" value={stats ? stats.totalUsers.toLocaleString('id-ID') : null} icon={Users} />
              </div>

              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4">Grafik Penjualan 7 Hari Terakhir</h3>
                {!stats ? (
                  <div className="h-[260px] skeleton" />
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <LineChart data={stats.trend}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                      <XAxis dataKey="day" stroke="#ffffff60" fontSize={12} />
                      <YAxis stroke="#ffffff60" fontSize={12} tickFormatter={(v) => `${v / 1000000}jt`} />
                      <Tooltip
                        contentStyle={{ background: '#0f1420', border: '1px solid #ffffff20', borderRadius: 12 }}
                        formatter={(v) => [`Rp ${v.toLocaleString('id-ID')}`, 'Penjualan']}
                      />
                      <Line type="monotone" dataKey="total" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </div>

              <div className="glass-card p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4">
                  <h3 className="font-semibold">Pesanan Terbaru</h3>
                  <div className="flex flex-col items-end gap-1.5">
                    <div className="flex gap-2">
                      <button onClick={handleExportOrders} className="btn-outline text-xs py-1.5 flex items-center gap-1">
                        <FileDown className="w-3 h-3" /> Export Excel
                      </button>
                      <label className="btn-outline text-xs py-1.5 flex items-center gap-1 cursor-pointer">
                        <FileUp className="w-3 h-3" /> {importBusy ? 'Mengimpor...' : 'Import Excel'}
                        <input type="file" accept=".xlsx,.xls" onChange={handleImportOrders} disabled={importBusy} className="hidden" />
                      </label>
                    </div>
                    {importMsg && <p className="text-[11px] text-white/40">{importMsg}</p>}
                  </div>
                </div>
                {loading ? (
                  <div className="space-y-2">{[1, 2, 3, 4].map((i) => <LineSkeleton key={i} />)}</div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-white/40 border-b border-white/10">
                          <th className="py-2 pr-4">Invoice</th>
                          <th className="py-2 pr-4">Produk</th>
                          <th className="py-2 pr-4">Total</th>
                          <th className="py-2 pr-4">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {(orders || []).map((o) => (
                          <tr key={o.id} className="border-b border-white/5">
                            <td className="py-2 pr-4 font-mono text-xs">{o.id?.slice(0, 8)}</td>
                            <td className="py-2 pr-4">{o.product_slug}</td>
                            <td className="py-2 pr-4">Rp {Number(o.amount || 0).toLocaleString('id-ID')}</td>
                            <td className="py-2 pr-4 capitalize">{o.status}</td>
                          </tr>
                        ))}
                        {!orders?.length && (
                          <tr><td colSpan={4} className="py-6 text-center text-white/30">Belum ada data pesanan.</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {tab === 'reward_settings' && <RewardSettingsPanel />}
          {tab === 'contact_settings' && <ContactSettingsPanel />}
          {tab === 'profit_report' && <ProfitReportPanel />}
          {tab === 'analytics' && <AnalyticsPanel />}
          {!['overview', 'reward_settings', 'contact_settings', 'profit_report', 'analytics'].includes(tab) && (
            <ManagementPanel tabId={tab} label={menu.find((m) => m.id === tab)?.label} />
          )}
        </div>
      </div>
    </div>
  )
}

// Edits the two rows in `settings` that Edge Functions read at payment time:
// - cashback_rates: { public, member, reseller } percent per tier
// - affiliate_default_rate: default % suggested when marking a new user as affiliate
// (per-user affiliate_rate override still lives on the Kelola User form.)
function RewardSettingsPanel() {
  const [rates, setRates] = useState({ public: 0, member: 1, reseller: 2 })
  const [defaultAffRate, setDefaultAffRate] = useState(3)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('key, value').in('key', ['cashback_rates', 'affiliate_default_rate'])
      const cashbackRow = data?.find((r) => r.key === 'cashback_rates')
      const affRow = data?.find((r) => r.key === 'affiliate_default_rate')
      if (cashbackRow?.value) setRates(cashbackRow.value)
      if (affRow?.value != null) setDefaultAffRate(Number(affRow.value))
      setLoading(false)
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      await supabase.from('settings').upsert({ key: 'cashback_rates', value: rates })
      await supabase.from('settings').upsert({ key: 'affiliate_default_rate', value: defaultAffRate })
      setMsg('Pengaturan reward berhasil disimpan.')
    } catch (err) {
      setMsg(`Gagal menyimpan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="glass-card p-6"><div className="skeleton h-32 rounded-xl" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-6">
      <div>
        <h3 className="font-semibold mb-1">Rate Cashback per Tingkat Harga</h3>
        <p className="text-xs text-white/40 mb-3">Persentase saldo yang otomatis kembali ke pembeli setiap transaksi sukses.</p>
        <div className="grid sm:grid-cols-3 gap-3">
          {['public', 'member', 'reseller'].map((t) => (
            <div key={t}>
              <label className="text-xs text-white/40 mb-1 block capitalize">{t === 'public' ? 'Publik' : t === 'member' ? 'Member' : 'Reseller'} (%)</label>
              <input
                type="number" step="0.1" min="0"
                value={rates[t] ?? 0}
                onChange={(e) => setRates({ ...rates, [t]: Number(e.target.value) })}
                className="input-glass"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-1">Rate Default Komisi Affiliate</h3>
        <p className="text-xs text-white/40 mb-3">Dipakai sebagai patokan saat menetapkan komisi (%) untuk user baru di tab Kelola User — komisi tiap user tetap bisa diubah sendiri-sendiri.</p>
        <input
          type="number" step="0.1" min="0"
          value={defaultAffRate}
          onChange={(e) => setDefaultAffRate(Number(e.target.value))}
          className="input-glass max-w-xs"
        />
      </div>

      {msg && <p className="text-xs text-neon-light">{msg}</p>}
      <button onClick={handleSave} disabled={saving} className="btn-neon text-sm py-2 px-5">
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </motion.div>
  )
}

// Edits the `whatsapp_contact` row in `settings` — read by the floating
// WhatsApp button (live chat) plus the Contact/Bantuan pages via the
// `useWhatsAppContact` hook, so a change here updates the whole site at once
// with no redeploy needed.
function ContactSettingsPanel() {
  const [number, setNumber] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('settings').select('value').eq('key', 'whatsapp_contact').maybeSingle()
      if (data?.value) {
        setNumber(data.value.number || '')
        setMessage(data.value.message || '')
      }
      setLoading(false)
    })()
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setMsg('')
    try {
      const cleanNumber = number.replace(/[^0-9]/g, '') // wa.me needs digits only, no +/spaces/dashes
      await supabase.from('settings').upsert({ key: 'whatsapp_contact', value: { number: cleanNumber, message } })
      setNumber(cleanNumber)
      setMsg('Kontak WhatsApp berhasil disimpan.')
    } catch (err) {
      setMsg(`Gagal menyimpan: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="glass-card p-6"><div className="skeleton h-32 rounded-xl" /></div>

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6 space-y-6 max-w-lg">
      <div>
        <h3 className="font-semibold mb-1">Live Chat via WhatsApp</h3>
        <p className="text-xs text-white/40 mb-3">
          Nomor & pesan default ini dipakai oleh tombol chat mengambang di semua halaman, serta halaman Bantuan dan Hubungi Kami.
        </p>
        <label className="text-xs text-white/40 mb-1 block">Nomor WhatsApp (format internasional, tanpa +)</label>
        <input
          type="text" placeholder="6281234567890"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
          className="input-glass mb-3"
        />
        <label className="text-xs text-white/40 mb-1 block">Pesan pembuka otomatis</label>
        <textarea
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          className="input-glass resize-none"
        />
      </div>

      {msg && <p className="text-xs text-neon-light">{msg}</p>}
      <button onClick={handleSave} disabled={saving} className="btn-neon text-sm py-2 px-5">
        {saving ? 'Menyimpan...' : 'Simpan Pengaturan'}
      </button>
    </motion.div>
  )
}

// Reads the `profit_daily` view (see migration 20260706) — one pre-aggregated
// row per day: revenue, cogs (provider cost), cashback_paid, affiliate_paid,
// net_profit. Only counts orders with status = 'success'.
function ProfitReportPanel() {
  const [rangeDays, setRangeDays] = useState(30)
  const [rows, setRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setRows(null)
    setError('')
    const since = new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000)
    since.setHours(0, 0, 0, 0)

    supabase
      .from('profit_daily')
      .select('*')
      .gte('day', since.toISOString().slice(0, 10))
      .order('day', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) setError(error.message)
        setRows(data || [])
      })
    return () => { cancelled = true }
  }, [rangeDays])

  const totals = (rows || []).reduce(
    (acc, r) => ({
      revenue: acc.revenue + Number(r.revenue || 0),
      cogs: acc.cogs + Number(r.cogs || 0),
      cashback: acc.cashback + Number(r.cashback_paid || 0),
      affiliate: acc.affiliate + Number(r.affiliate_paid || 0),
      net: acc.net + Number(r.net_profit || 0),
      orders: acc.orders + Number(r.orders_count || 0),
    }),
    { revenue: 0, cogs: 0, cashback: 0, affiliate: 0, net: 0, orders: 0 }
  )

  const rupiah = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Laporan Laba Rugi</h3>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                rangeDays === d ? 'bg-neon/15 text-neon-light border-neon/30' : 'text-white/50 border-white/10 hover:bg-white/5'
              }`}
            >
              {d} Hari
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard label="Pendapatan (Omzet)" value={rows ? rupiah(totals.revenue) : null} icon={TrendingUp} />
        <StatCard label="Modal ke Provider (COGS)" value={rows ? rupiah(totals.cogs) : null} icon={Server} />
        <StatCard label="Laba Bersih" value={rows ? rupiah(totals.net) : null} icon={Wallet} />
        <StatCard label="Cashback Dibayarkan" value={rows ? rupiah(totals.cashback) : null} icon={PiggyBank} />
        <StatCard label="Komisi Affiliate Dibayarkan" value={rows ? rupiah(totals.affiliate) : null} icon={Share2} />
        <StatCard label="Total Pesanan Sukses" value={rows ? totals.orders.toLocaleString('id-ID') : null} icon={ShoppingCart} />
      </div>

      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Tren Laba Bersih Harian</h3>
        {!rows ? (
          <div className="h-[260px] skeleton" />
        ) : rows.length === 0 ? (
          <p className="text-white/40 text-sm">Belum ada order sukses di rentang ini.</p>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={rows.map((r) => ({ ...r, dayLabel: new Date(r.day).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="dayLabel" stroke="#ffffff60" fontSize={12} />
              <YAxis stroke="#ffffff60" fontSize={12} tickFormatter={(v) => `${(v / 1000000).toFixed(1)}jt`} />
              <Tooltip
                contentStyle={{ background: '#0f1420', border: '1px solid #ffffff20', borderRadius: 12 }}
                formatter={(v, name) => [rupiah(v), name === 'net_profit' ? 'Laba Bersih' : name]}
                labelFormatter={(label) => label}
              />
              <Line type="monotone" dataKey="net_profit" stroke="#3B82F6" strokeWidth={3} dot={{ fill: '#3B82F6' }} name="net_profit" />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="glass-card p-6 overflow-x-auto">
        <h3 className="font-semibold mb-4">Rincian Per Hari</h3>
        {!rows ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <LineSkeleton key={i} />)}</div>
        ) : rows.length === 0 ? (
          <p className="text-white/40 text-sm">Tidak ada data.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10">
                <th className="py-2 pr-4">Tanggal</th>
                <th className="py-2 pr-4">Pesanan</th>
                <th className="py-2 pr-4">Omzet</th>
                <th className="py-2 pr-4">COGS</th>
                <th className="py-2 pr-4">Cashback</th>
                <th className="py-2 pr-4">Affiliate</th>
                <th className="py-2 pr-4">Laba Bersih</th>
              </tr>
            </thead>
            <tbody>
              {[...rows].reverse().map((r) => (
                <tr key={r.day} className="border-b border-white/5">
                  <td className="py-2 pr-4">{new Date(r.day).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td className="py-2 pr-4">{r.orders_count}</td>
                  <td className="py-2 pr-4">{rupiah(r.revenue)}</td>
                  <td className="py-2 pr-4">{rupiah(r.cogs)}</td>
                  <td className="py-2 pr-4">{rupiah(r.cashback_paid)}</td>
                  <td className="py-2 pr-4">{rupiah(r.affiliate_paid)}</td>
                  <td className={`py-2 pr-4 font-medium ${Number(r.net_profit) < 0 ? 'text-red-400' : 'text-neon-light'}`}>{rupiah(r.net_profit)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  )
}

const PIE_COLORS = ['#3B82F6', '#22D3EE', '#A78BFA', '#F472B6', '#FBBF24', '#34D399', '#FB7185', '#818CF8']
const rupiahFmt = (n) => `Rp ${Number(n || 0).toLocaleString('id-ID')}`

// Deeper analytics beyond the daily P&L: top products, category split, payment
// method mix, new vs returning customers, peak checkout hours, and flash sale
// performance. All queries read from the views created in migration
// 20260708 — this component only aggregates/reshapes for the charts.
function AnalyticsPanel() {
  const [rangeDays, setRangeDays] = useState(30)
  const [productRows, setProductRows] = useState(null)
  const [paymentRows, setPaymentRows] = useState(null)
  const [customerRows, setCustomerRows] = useState(null)
  const [hourRows, setHourRows] = useState(null)
  const [flashRows, setFlashRows] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    setProductRows(null)
    setPaymentRows(null)
    setCustomerRows(null)
    setError('')
    const since = new Date(Date.now() - (rangeDays - 1) * 24 * 60 * 60 * 1000)
    since.setHours(0, 0, 0, 0)
    const sinceStr = since.toISOString().slice(0, 10)

    Promise.all([
      supabase.from('sales_by_product_daily').select('*').gte('day', sinceStr),
      supabase.from('payment_method_daily').select('*').gte('day', sinceStr),
      supabase.from('customer_daily_stats').select('*').gte('day', sinceStr),
    ]).then(([prod, pay, cust]) => {
      if (cancelled) return
      if (prod.error) setError(prod.error.message)
      setProductRows(prod.data || [])
      setPaymentRows(pay.data || [])
      setCustomerRows(cust.data || [])
    })
    return () => { cancelled = true }
  }, [rangeDays])

  // Hour-of-day and flash sale performance don't depend on rangeDays (see view comments) — fetch once.
  useEffect(() => {
    supabase.from('orders_by_hour_30d').select('*').then(({ data }) => setHourRows(data || []))
    supabase.from('flash_sale_performance').select('*').limit(20).then(({ data }) => setFlashRows(data || []))
  }, [])

  // ---- Aggregate product rows (which come per-day) into all-range totals ----
  const topProducts = (() => {
    if (!productRows) return null
    const byProduct = {}
    for (const r of productRows) {
      const key = r.product_id || r.product_name
      if (!byProduct[key]) byProduct[key] = { name: r.product_name, revenue: 0, qty: 0 }
      byProduct[key].revenue += Number(r.revenue || 0)
      byProduct[key].qty += Number(r.qty || 0)
    }
    return Object.values(byProduct).sort((a, b) => b.revenue - a.revenue).slice(0, 10)
  })()

  const byCategory = (() => {
    if (!productRows) return null
    const byCat = {}
    for (const r of productRows) {
      const key = r.category_name || 'Tanpa Kategori'
      byCat[key] = (byCat[key] || 0) + Number(r.revenue || 0)
    }
    return Object.entries(byCat).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  })()

  const byPaymentMethod = (() => {
    if (!paymentRows) return null
    const byMethod = {}
    for (const r of paymentRows) {
      const key = (r.method || r.gateway || 'lainnya').toUpperCase()
      byMethod[key] = (byMethod[key] || 0) + Number(r.qty || 0)
    }
    return Object.entries(byMethod).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value)
  })()

  const customerTotals = (() => {
    if (!customerRows) return null
    return customerRows.reduce(
      (acc, r) => ({
        new: acc.new + Number(r.new_customers || 0),
        returning: acc.returning + Number(r.returning_customers || 0),
      }),
      { new: 0, returning: 0 }
    )
  })()

  const hourChartData = (hourRows || []).length
    ? Array.from({ length: 24 }, (_, h) => {
        const found = hourRows.find((r) => r.hour_of_day === h)
        return { hour: `${String(h).padStart(2, '0')}:00`, orders: found ? Number(found.orders_count) : 0 }
      })
    : []

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold">Analitik Mendalam</h3>
        <div className="flex gap-2">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setRangeDays(d)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                rangeDays === d ? 'bg-neon/15 text-neon-light border-neon/30' : 'text-white/50 border-white/10 hover:bg-white/5'
              }`}
            >
              {d} Hari
            </button>
          ))}
        </div>
      </div>

      {error && <p className="text-red-400 text-xs">{error}</p>}

      {/* Pelanggan baru vs kembali */}
      <div className="grid sm:grid-cols-2 gap-4">
        <StatCard label="Pelanggan Baru" value={customerTotals ? customerTotals.new.toLocaleString('id-ID') : null} icon={Users} />
        <StatCard label="Pelanggan Kembali (Repeat Order)" value={customerTotals ? customerTotals.returning.toLocaleString('id-ID') : null} icon={RefreshCw} />
      </div>

      {/* Top produk */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-4">Top 10 Produk Terlaris (by Omzet)</h3>
        {!topProducts ? (
          <div className="h-[280px] skeleton" />
        ) : topProducts.length === 0 ? (
          <p className="text-white/40 text-sm">Belum ada order sukses di rentang ini.</p>
        ) : (
          <ResponsiveContainer width="100%" height={Math.max(280, topProducts.length * 34)}>
            <BarChart data={topProducts} layout="vertical" margin={{ left: 12 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis type="number" stroke="#ffffff60" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}rb`} />
              <YAxis type="category" dataKey="name" stroke="#ffffff60" fontSize={11} width={140} />
              <Tooltip
                contentStyle={{ background: '#0f1420', border: '1px solid #ffffff20', borderRadius: 12 }}
                formatter={(v, name) => [name === 'revenue' ? rupiahFmt(v) : v, name === 'revenue' ? 'Omzet' : 'Terjual']}
              />
              <Bar dataKey="revenue" fill="#3B82F6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        {/* Penjualan per kategori */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Penjualan per Kategori</h3>
          {!byCategory ? (
            <div className="h-[240px] skeleton" />
          ) : byCategory.length === 0 ? (
            <p className="text-white/40 text-sm">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                  {byCategory.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1420', border: '1px solid #ffffff20', borderRadius: 12 }} formatter={(v) => rupiahFmt(v)} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Metode pembayaran favorit */}
        <div className="glass-card p-6">
          <h3 className="font-semibold mb-4">Metode Pembayaran Favorit</h3>
          {!byPaymentMethod ? (
            <div className="h-[240px] skeleton" />
          ) : byPaymentMethod.length === 0 ? (
            <p className="text-white/40 text-sm">Belum ada data.</p>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie data={byPaymentMethod} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={(e) => e.name}>
                  {byPaymentMethod.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#0f1420', border: '1px solid #ffffff20', borderRadius: 12 }} formatter={(v) => `${v} pesanan`} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Jam ramai checkout */}
      <div className="glass-card p-6">
        <h3 className="font-semibold mb-1">Jam Tersibuk Checkout (30 Hari Terakhir)</h3>
        <p className="text-xs text-white/40 mb-4">Berguna untuk menjadwalkan Flash Sale di jam yang paling banyak dilihat pembeli.</p>
        {!hourRows ? (
          <div className="h-[220px] skeleton" />
        ) : hourChartData.every((h) => h.orders === 0) ? (
          <p className="text-white/40 text-sm">Belum ada order sukses 30 hari terakhir.</p>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={hourChartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
              <XAxis dataKey="hour" stroke="#ffffff60" fontSize={10} interval={1} />
              <YAxis stroke="#ffffff60" fontSize={11} allowDecimals={false} />
              <Tooltip contentStyle={{ background: '#0f1420', border: '1px solid #ffffff20', borderRadius: 12 }} formatter={(v) => [`${v} pesanan`, '']} />
              <Bar dataKey="orders" fill="#22D3EE" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Performa flash sale */}
      <div className="glass-card p-6 overflow-x-auto">
        <h3 className="font-semibold mb-4">Performa Flash Sale</h3>
        {!flashRows ? (
          <div className="space-y-2">{[1, 2, 3].map((i) => <LineSkeleton key={i} />)}</div>
        ) : flashRows.length === 0 ? (
          <p className="text-white/40 text-sm">Belum ada flash sale yang dibuat. Buka tab "Kelola Flash Sale" untuk membuat yang pertama.</p>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-white/40 border-b border-white/10">
                <th className="py-2 pr-4">Flash Sale</th>
                <th className="py-2 pr-4">Produk</th>
                <th className="py-2 pr-4">Terjual</th>
                <th className="py-2 pr-4">% Terjual</th>
                <th className="py-2 pr-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {flashRows.map((r) => (
                <tr key={r.id} className="border-b border-white/5">
                  <td className="py-2 pr-4">{r.title}</td>
                  <td className="py-2 pr-4">{r.product_name}</td>
                  <td className="py-2 pr-4">{r.sold_count}/{r.stock_limit}</td>
                  <td className="py-2 pr-4">{r.sold_pct ?? 0}%</td>
                  <td className="py-2 pr-4">
                    {r.is_currently_live ? (
                      <span className="text-neon-light">Live sekarang</span>
                    ) : r.is_active ? (
                      <span className="text-white/40">Terjadwal/Selesai</span>
                    ) : (
                      <span className="text-red-400">Nonaktif</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </motion.div>
  )
}

function StatCard({ label, value, icon: Icon }) {
  return (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-neon/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-neon-light" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-white/40">{label}</p>
        {value === null ? <div className="skeleton h-5 w-24 mt-1" /> : <p className="font-display text-lg font-bold truncate">{value}</p>}
      </div>
    </div>
  )
}

// Real CRUD panel: lists rows from the configured Supabase table and lets the
// admin add / edit / delete them through CrudModal. Foreign-key fields
// (category_id, game_id, provider_id) get their dropdown options from the
// reference lists fetched below.
function ManagementPanel({ tabId, label }) {
  const config = TABLE_CONFIG[tabId]
  const [rows, setRows] = useState(null)
  const [refLists, setRefLists] = useState({ categories: [], games: [], providers: [], products: [] })
  const needsRefLists = config.fields.some((f) => f.optionsSource)
  const [refLoading, setRefLoading] = useState(needsRefLists)
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRow, setEditingRow] = useState(null)
  const [error, setError] = useState('')
  const [importBusy, setImportBusy] = useState(false)
  const [importMsg, setImportMsg] = useState('')
  const [syncBusy, setSyncBusy] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')
  const [broadcastBusyId, setBroadcastBusyId] = useState(null)
  const [broadcastMsg, setBroadcastMsg] = useState('')

  const fetchRows = async () => {
    setRows(null)
    // Some tables (e.g. product_provider_links) need a joined select to show
    // human-readable names instead of raw foreign-key uuids in the row list.
    const { data, error } = await supabase
      .from(config.table)
      .select(config.selectQuery || '*')
      .order('created_at', { ascending: false })
      .limit(50)
    if (error) setError(error.message)
    setRows(data || [])
  }

  useEffect(() => {
    fetchRows()
    // Only fetch reference lists needed for this table's foreign-key selects
    const needs = config.fields.filter((f) => f.optionsSource).map((f) => f.optionsSource)
    if (needs.length === 0) return
    setRefLoading(true)
    Promise.all([
      needs.includes('categories') ? supabase.from('categories').select('id, name') : null,
      needs.includes('games') ? supabase.from('games').select('id, name') : null,
      needs.includes('providers') ? supabase.from('providers').select('id, name') : null,
      // Include the parent game name so products sharing the same
      // denomination label (e.g. "86 Diamonds") stay distinguishable.
      needs.includes('products') ? supabase.from('products').select('id, name, games(name)') : null,
    ]).then(([cat, games, prov, prod]) => {
      setRefLists({
        categories: cat?.data || [],
        games: games?.data || [],
        providers: prov?.data || [],
        products: prod?.data || [],
      })
      setRefLoading(false)
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabId])

  const resolvedFields = config.fields.map((f) => {
    if (!f.optionsSource) return f
    if (f.optionsSource === 'products') {
      return {
        ...f,
        options: refLists.products.map((r) => ({
          value: r.id,
          label: r.games?.name ? `${r.games.name} — ${r.name}` : r.name,
        })),
      }
    }
    return { ...f, options: refLists[f.optionsSource].map((r) => ({ value: r.id, label: r.name })) }
  })

  const openAdd = () => { setEditingRow(null); setModalOpen(true) }
  const openEdit = (row) => { setEditingRow(row); setModalOpen(true) }

  const handleSave = async (values) => {
    // Coerce empty-string numbers/dates to null so Postgres numeric/timestamp columns don't choke
    const payload = { ...values }
    config.fields.forEach((f) => {
      if ((f.type === 'number' || f.type === 'date' || f.type === 'datetime-local') && payload[f.key] === '') payload[f.key] = null
    })

    if (editingRow) {
      const { error } = await supabase.from(config.table).update(payload).eq('id', editingRow.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from(config.table).insert(payload)
      if (error) throw error
    }
    await fetchRows()
  }

  const handleDelete = async (row) => {
    if (!window.confirm(`Hapus "${row[config.titleField] || row.id}"? Tindakan ini tidak bisa dibatalkan.`)) return
    const { error } = await supabase.from(config.table).delete().eq('id', row.id)
    if (error) return setError(error.message)
    await fetchRows()
  }

  const handleExport = () => {
    const columns = ['id', ...config.fields.map((f) => f.key)]
    exportToExcel((rows || []).map((r) => Object.fromEntries(columns.map((c) => [c, r[c]]))), config.table)
  }

  const handleImport = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImportBusy(true)
    setImportMsg('')
    try {
      const parsedRows = await parseExcelFile(file)
      const columns = config.fields.map((f) => f.key)
      const payloadRows = parsedRows.map((r) => {
        const picked = { ...Object.fromEntries(columns.map((c) => [c, r[c] ?? null])) }
        if (r.id) picked.id = r.id // include id only if present -> upsert updates that row, otherwise inserts new
        return picked
      })
      const { error } = await supabase.from(config.table).upsert(payloadRows)
      if (error) throw error
      setImportMsg(`${payloadRows.length} baris berhasil diimpor ke ${config.table}.`)
      await fetchRows()
    } catch (err) {
      setImportMsg(`Gagal mengimpor: ${err.message}`)
    } finally {
      setImportBusy(false)
      e.target.value = ''
    }
  }

  // Only relevant for the "Routing Harga Termurah" panel — calls the
  // sync-provider-stock Edge Function so admins don't have to wait for the
  // pg_cron schedule (or set one up at all) to get fresh prices/stock.
  const handleSyncStock = async () => {
    setSyncBusy(true)
    setSyncMsg('')
    try {
      const { data, error } = await supabase.functions.invoke('sync-provider-stock')
      if (error) throw error
      if (!data?.success) {
        setSyncMsg(`Sync gagal: ${data?.error || 'unknown error'}`)
      } else {
        setSyncMsg(
          `Selesai — ${data.providers_synced} provider disinkron, ${data.links_price_changed} harga diperbarui, ` +
          `${data.links_became_available} jadi tersedia, ${data.links_became_out_of_stock} jadi kosong.` +
          (data.provider_errors?.length ? ` (${data.provider_errors.length} provider gagal difetch, cek tabel logs)` : '')
        )
      }
      await fetchRows()
    } catch (err) {
      setSyncMsg(`Sync gagal: ${err.message}`)
    } finally {
      setSyncBusy(false)
    }
  }

  // Sends a push broadcast to every subscribed device announcing this flash
  // sale ("⚡ Judul — Produk lagi diskon gede..."). Best-effort UI feedback only;
  // the Edge Function itself already logs successes/failures per subscription.
  const handleBroadcastFlashSale = async (row) => {
    setBroadcastBusyId(row.id)
    setBroadcastMsg('')
    try {
      const { data, error } = await supabase.functions.invoke('send-push-notification', { body: { flash_sale_id: row.id } })
      if (error) throw error
      setBroadcastMsg(data?.error ? `Gagal: ${data.error}` : `Notifikasi terkirim ke ${data.sent} device (${data.failed} gagal).`)
    } catch (err) {
      setBroadcastMsg(`Gagal mengirim notifikasi: ${err.message}`)
    } finally {
      setBroadcastBusyId(null)
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-6">
      <div className="flex flex-wrap justify-between items-center gap-3 mb-2">
        <h3 className="font-semibold">{label}</h3>
        <div className="flex flex-wrap gap-2">
          {tabId === 'product_provider_links' && (
            <button onClick={handleSyncStock} disabled={syncBusy} className="btn-outline text-xs py-1.5 flex items-center gap-1 disabled:opacity-50">
              <RefreshCw className={`w-3 h-3 ${syncBusy ? 'animate-spin' : ''}`} /> {syncBusy ? 'Menyinkronkan...' : 'Sync Harga & Stok Sekarang'}
            </button>
          )}
          <button onClick={handleExport} className="btn-outline text-xs py-1.5 flex items-center gap-1">
            <FileDown className="w-3 h-3" /> Export
          </button>
          {config.canAdd && (
            <label className="btn-outline text-xs py-1.5 flex items-center gap-1 cursor-pointer">
              <FileUp className="w-3 h-3" /> {importBusy ? 'Mengimpor...' : 'Import'}
              <input type="file" accept=".xlsx,.xls" onChange={handleImport} disabled={importBusy} className="hidden" />
            </label>
          )}
          {config.canAdd && (
            <button onClick={openAdd} disabled={refLoading} className="btn-neon text-sm py-2 flex items-center gap-1.5">
              <Plus className="w-4 h-4" /> Tambah Baru
            </button>
          )}
        </div>
      </div>
      {syncMsg && <p className="text-[11px] text-white/40 mb-3">{syncMsg}</p>}
      {importMsg && <p className="text-[11px] text-white/40 mb-3">{importMsg}</p>}
      {broadcastMsg && <p className="text-[11px] text-white/40 mb-3">{broadcastMsg}</p>}

      {error && <p className="text-red-400 text-xs mb-3">{error}</p>}

      {rows === null ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <LineSkeleton key={i} />)}</div>
      ) : rows.length ? (
        <div className="space-y-2">
          {rows.map((row) => (
            <div key={row.id} className="flex flex-wrap justify-between items-center gap-2 border-b border-white/5 py-2.5 text-sm">
              <div className="truncate max-w-full sm:max-w-[60%]">
                <span className="font-medium">{row[config.titleField] || row.id}</span>
                {tabId === 'orders' && <span className="text-white/40 ml-2 capitalize">— {row.status}</span>}
                {tabId === 'users' && <span className="text-white/40 ml-2">— {row.role} · {row.price_tier || 'public'}</span>}
                {(tabId === 'affiliate_commissions' || tabId === 'cashback_transactions') && (
                  <span className="text-white/40 ml-2">— Rp {Number(row.amount || 0).toLocaleString('id-ID')} ({row.rate}%)</span>
                )}
                {tabId === 'product_provider_links' && (
                  <span className="text-white/40 ml-2">
                    — {row.products?.games?.name ? `${row.products.games.name} / ` : ''}{row.products?.name || '?'} lewat <span className="text-neon-light">{row.providers?.name || '?'}</span>
                    {' '}· Rp {Number(row.provider_price || 0).toLocaleString('id-ID')}
                    {!row.is_active && <span className="text-red-400"> · nonaktif</span>}
                  </span>
                )}
                {tabId === 'flash_sales' && (
                  <span className="text-white/40 ml-2">
                    — {row.products?.games?.name ? `${row.products.games.name} / ` : ''}{row.products?.name || '?'}
                    {' '}· terjual {row.sold_count || 0}/{row.stock_limit}
                    {' '}· {row.discount_type === 'percent' ? `${row.discount_value}%` : `Rp ${Number(row.discount_value).toLocaleString('id-ID')}`}
                    {' '}· berakhir {new Date(row.ends_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    {!row.is_active && <span className="text-red-400"> · nonaktif</span>}
                  </span>
                )}
              </div>
              <div className="flex gap-3 shrink-0">
                {tabId === 'flash_sales' && (
                  <button
                    onClick={() => handleBroadcastFlashSale(row)}
                    disabled={broadcastBusyId === row.id}
                    className="text-xs text-neon-light hover:underline flex items-center gap-1 disabled:opacity-40"
                  >
                    <Send className="w-3 h-3" /> {broadcastBusyId === row.id ? 'Mengirim...' : 'Umumkan (Push)'}
                  </button>
                )}
                <button onClick={() => openEdit(row)} disabled={refLoading} className="text-xs text-neon-light hover:underline flex items-center gap-1 disabled:opacity-40">
                  <Pencil className="w-3 h-3" /> Edit
                </button>
                {config.canDelete && (
                  <button onClick={() => handleDelete(row)} className="text-xs text-red-400 hover:underline flex items-center gap-1">
                    <Trash2 className="w-3 h-3" /> Hapus
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">
          Tabel <code className="text-neon-light">{config.table}</code> masih kosong.{' '}
          {config.canAdd && 'Klik "Tambah Baru" untuk mengisi data pertama.'}
        </p>
      )}

      {modalOpen && (
        <CrudModal
          title={editingRow ? `Edit ${label}` : `Tambah ${label}`}
          fields={resolvedFields}
          initialValues={editingRow || {}}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </motion.div>
  )
}
