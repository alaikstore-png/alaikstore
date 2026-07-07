import { motion } from 'framer-motion'
import { Receipt } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useFetch } from '../hooks/useFetch'
import { supabase } from '../lib/supabaseClient'
import { ProductGridSkeleton } from '../components/ui/Skeleton'

export default function TransactionHistory() {
  const { user } = useAuth()
  const { data: orders, loading } = useFetch(
    () => supabase.from('orders').select('*').eq('user_id', user?.id).order('created_at', { ascending: false }),
    [user?.id]
  )

  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <h1 className="font-display text-2xl font-bold mb-8">Riwayat Transaksi</h1>

      {!user ? (
        <p className="text-white/50 text-sm">Silakan masuk untuk melihat riwayat transaksi Anda.</p>
      ) : loading ? (
        <ProductGridSkeleton count={4} />
      ) : orders?.length ? (
        <div className="space-y-4">
          {orders.map((o, i) => (
            <motion.div
              key={o.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card p-5 flex flex-wrap items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-neon/15 flex items-center justify-center shrink-0">
                  <Receipt className="w-5 h-5 text-neon-light" />
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm truncate">{o.product_slug} — {o.denomination}</p>
                  <p className="text-xs text-white/40 truncate">{new Date(o.created_at).toLocaleString('id-ID')} · Invoice #{o.id?.slice(0, 8)}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <p className="font-semibold text-sm">Rp {Number(o.amount || 0).toLocaleString('id-ID')}</p>
                <StatusBadge status={o.status} />
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <p className="text-white/40 text-sm">Belum ada transaksi.</p>
      )}
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
