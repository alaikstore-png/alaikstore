import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, MapPin, Phone, Send, Instagram, Globe } from 'lucide-react'
import { useWhatsAppContact } from '../hooks/useWhatsAppContact'

export default function Contact() {
  const { number: WHATSAPP_NUMBER, linkWithText } = useWhatsAppContact()
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', message: '' })

  const handleSubmit = (e) => {
    e.preventDefault()
    // In production this posts to a Supabase Edge Function / `logs` table
    setSent(true)
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <h1 className="font-display text-2xl font-bold mb-2">Hubungi Kami</h1>
      <p className="text-white/50 text-sm mb-10">Ada pertanyaan atau kendala? Kirimkan pesan, tim kami akan segera merespons.</p>

      <div className="grid lg:grid-cols-2 gap-8">
        <motion.form initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} onSubmit={handleSubmit} className="glass-card p-6 space-y-4">
          <input required placeholder="Nama" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-glass" />
          <input required type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-glass" />
          <textarea required rows={5} placeholder="Pesan Anda" value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="input-glass resize-none" />
          <button className="btn-neon w-full flex items-center justify-center gap-2">
            <Send className="w-4 h-4" /> {sent ? 'Terkirim!' : 'Kirim Pesan'}
          </button>
        </motion.form>

        <motion.div initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} className="space-y-4">
          <InfoRow icon={Mail} title="Email" value="alaikstore20@gmail.com" href="mailto:alaikstore20@gmail.com" />
          <InfoRow icon={Phone} title="WhatsApp" value="085173487538" href={`https://wa.me/${WHATSAPP_NUMBER}`} />
          <InfoRow icon={MapPin} title="Alamat" value="Desa Grogol, Kecamatan Gunung Jati, Kabupaten Cirebon" />
          <InfoRow icon={Instagram} title="Instagram" value="@alaik.id_" href="https://instagram.com/alaik.id_" />
          <InfoRow icon={Globe} title="Website" value="alaikstore.id" href="https://alaikstore.id" />

          <a
            href={linkWithText('Halo Alaikstore, saya ingin bertanya seputar top up game.')}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-neon w-full flex items-center justify-center gap-2"
          >
            <Phone className="w-4 h-4" /> Chat Langsung via WhatsApp
          </a>
        </motion.div>
      </div>
    </div>
  )
}

function InfoRow({ icon: Icon, title, value, href }) {
  const content = (
    <div className="glass-card p-5 flex items-center gap-4">
      <div className="w-11 h-11 rounded-xl bg-neon/15 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-neon-light" />
      </div>
      <div>
        <p className="text-xs text-white/40">{title}</p>
        <p className="text-sm font-medium">{value}</p>
      </div>
    </div>
  )
  return href ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className="block">{content}</a>
  ) : content
}
