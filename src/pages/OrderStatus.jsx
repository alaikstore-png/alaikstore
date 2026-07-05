import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, CheckCircle2, Clock, XCircle, Loader2, QrCode, Copy, ExternalLink, RefreshCw } from 'lucide-react'
import { supabase } from '../lib/supabaseClient'
import { pollProviderStatus } from '../lib/api'

const steps = ['Pembayaran Diterima', 'Diproses ke Provider', 'Item Terkirim']

export default function OrderStatus() {
  const [params] = useSearchParams()
  const [invoice, setInvoice] = useState(params.get('order') || '')
  const [order, setOrder] = useState(null)
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [polling, setPolling] = useState(false)

  const handleRefreshProvider = async () => {
    if (!order?.id) return
    setPolling(true)
    try {
      const result = await pollProviderStatus(order.id)
      if (result?.status) setOrder((prev) => ({ ...prev, status: result.status }))
    } finally {
      setPolling(false)
    }
  }

  const fetchOrder = async (id) => {
    if (!id) return
    setLoading(true)
    setError('')
    const { data, error } = await supabase.from('orders').select('*').eq('id', id).single()
    if (error) {
      setError('Pesanan tidak ditemukan. Periksa kembali nomor invoice Anda.')
    } else {
      setOrder(data)
      const { data: pay } = await supabase
        .from('payments')
        .select('*')
        .eq('order_id', id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      setPayment(pay)
    }
    setLoading(false)
  }

  useEffect(() => {
    if (params.get('order')) fetchOrder(params.get('order'))
  }, [params])

  // Realtime subscription: status updates instantly when payment gateway / provider callback fires
  useEffect(() => {
    if (!order?.id) return
    const channel = supabase
      .channel(`order-${order.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${order.id}` }, (payload) => {
        setOrder(payload.new)
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments', filter: `order_id=eq.${order.id}` }, (payload) => {
        setPayment(payload.new)
      })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [order?.id])

  const currentStep = order?.status === 'success' ? 3 : order?.status === 'failed' ? -1 : order ? 1 : 0

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <h1 className="font-display text-2xl font-bold mb-2">Cek Status Pesanan</h1>
      <p className="text-white/50 text-sm mb-8">Masukkan nomor invoice untuk melihat status transaksi secara realtime.</p>

      <form
        onSubmit={(e) => { e.preventDefault(); fetchOrder(invoice) }}
        className="flex gap-3 mb-8"
      >
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
          <input
            value={invoice}
            onChange={(e) => setInvoice(e.target.value)}
            placeholder="Nomor Invoice"
            className="input-glass pl-10"
          />
        </div>
        <button className="btn-neon flex items-center gap-2">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Cek'}
        </button>
      </form>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      {order && (
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
          <div className="flex flex-wrap justify-between items-start gap-3 mb-6">
            <div className="min-w-0">
              <p className="text-xs text-white/40">Invoice</p>
              <p className="font-mono text-xs sm:text-sm break-all">{order.id}</p>
            </div>
            <div className="flex items-center gap-2">
              {order.status === 'processing' && order.provider_name === 'MedanPedia' && (
                <button
                  onClick={handleRefreshProvider}
                  disabled={polling}
                  className="btn-outline text-xs py-1.5 flex items-center gap-1.5"
                  title="MedanPedia tidak mengirim notifikasi otomatis — cek status terbaru secara manual"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${polling ? 'animate-spin' : ''}`} /> Cek Status
                </button>
              )}
              <StatusPill status={order.status} />
            </div>
          </div>

          {order.status === 'pending' && payment && (
            <div className="glass-card p-5 mb-6 bg-neon/5">
              <p className="text-sm font-medium mb-3 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-neon-light" /> Selesaikan Pembayaran
              </p>

              {payment.qr_url && payment.qr_url.startsWith('http') ? (
                <img src={payment.qr_url} alt="QR Pembayaran" className="w-48 h-48 mx-auto rounded-xl border border-white/10 mb-3" />
              ) : payment.qr_url ? (
                <div className="mb-3">
                  <p className="text-xs text-white/40 mb-1">Kode QR (render sebagai QR code di sisi klien):</p>
                  <code className="block text-xs break-all bg-white/5 p-2 rounded-lg">{payment.qr_url}</code>
                </div>
              ) : null}

              {payment.va_number && (
                <div className="flex flex-wrap items-center justify-between gap-3 glass px-4 py-3 rounded-xl mb-3">
                  <div className="min-w-0">
                    <p className="text-xs text-white/40">Nomor VA / Kode Bayar</p>
                    <p className="font-mono font-semibold break-all">{payment.va_number}</p>
                  </div>
                  <button onClick={() => navigator.clipboard.writeText(payment.va_number)} className="btn-outline text-xs py-1.5 flex items-center gap-1 shrink-0">
                    <Copy className="w-3 h-3" /> Salin
                  </button>
                </div>
              )}

              <a
                href={payment.raw_callback?.checkout_url || payment.raw_callback?.redirect_url || '#'}
                target="_blank" rel="noreferrer"
                className={`btn-neon w-full flex items-center justify-center gap-2 ${!(payment.raw_callback?.checkout_url || payment.raw_callback?.redirect_url) ? 'hidden' : ''}`}
              >
                <ExternalLink className="w-4 h-4" /> Buka Halaman Pembayaran
              </a>
              <p className="text-[11px] text-white/30 mt-3">Status akan otomatis terupdate begitu pembayaran dikonfirmasi.</p>
            </div>
          )}

          <div className="space-y-4">
            {order.status === 'failed' ? (
              <div className="flex items-center gap-3 text-red-400 text-sm">
                <XCircle className="w-5 h-5" /> Transaksi gagal. Silakan hubungi bantuan jika saldo sudah terpotong.
              </div>
            ) : (
              steps.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  {i < currentStep ? (
                    <CheckCircle2 className="w-5 h-5 text-neon-light shrink-0" />
                  ) : i === currentStep ? (
                    <Loader2 className="w-5 h-5 text-neon-light animate-spin shrink-0" />
                  ) : (
                    <Clock className="w-5 h-5 text-white/20 shrink-0" />
                  )}
                  <span className={`text-sm ${i <= currentStep ? 'text-white' : 'text-white/30'}`}>{s}</span>
                </div>
              ))
            )}
          </div>

          <div className="border-t border-white/10 mt-6 pt-4 text-sm text-white/60 space-y-1">
            <div className="flex justify-between"><span>Produk</span><span className="text-white">{order.product_slug}</span></div>
            <div className="flex justify-between"><span>Total</span><span className="text-white">Rp {Number(order.amount || 0).toLocaleString('id-ID')}</span></div>
          </div>
        </motion.div>
      )}
    </div>
  )
}

function StatusPill({ status }) {
  const map = {
    success: 'bg-green-500/15 text-green-400',
    pending: 'bg-yellow-500/15 text-yellow-400',
    failed: 'bg-red-500/15 text-red-400',
  }
  return <span className={`text-xs px-3 py-1 rounded-full capitalize ${map[status] || 'bg-white/10 text-white/50'}`}>{status || 'pending'}</span>
}
