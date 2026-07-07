import { MessageCircle, Mail, Phone } from 'lucide-react'
import FaqAccordion from '../components/home/FaqAccordion'
import { useWhatsAppContact } from '../hooks/useWhatsAppContact'

export default function Help() {
  const { number: WHATSAPP_NUMBER, linkWithText } = useWhatsAppContact()
  return (
    <div className="max-w-4xl mx-auto px-4 md:px-6 pt-24 pb-16">
      <h1 className="font-display text-2xl font-bold mb-2 text-center">Pusat Bantuan</h1>
      <p className="text-white/50 text-sm mb-10 text-center">Temukan jawaban cepat atau hubungi tim support kami.</p>

      <div className="grid sm:grid-cols-3 gap-4 mb-12">
        <ChannelCard
          icon={MessageCircle}
          title="Chat WhatsApp"
          desc="Respon dalam hitungan menit"
          href={linkWithText('Halo Alaikstore, saya butuh bantuan.')}
        />
        <ChannelCard icon={Mail} title="Email" desc="alaikstore20@gmail.com" href="mailto:alaikstore20@gmail.com" />
        <ChannelCard icon={Phone} title="WhatsApp" desc="085173487538" href={`https://wa.me/${WHATSAPP_NUMBER}`} />
      </div>

      <FaqAccordion />
    </div>
  )
}

function ChannelCard({ icon: Icon, title, desc, href }) {
  const content = (
    <div className="glass-card p-5 text-center h-full">
      <div className="w-11 h-11 rounded-xl bg-neon/15 flex items-center justify-center mx-auto mb-3">
        <Icon className="w-5 h-5 text-neon-light" />
      </div>
      <p className="font-semibold text-sm">{title}</p>
      <p className="text-xs text-white/40 mt-1">{desc}</p>
    </div>
  )
  return href ? <a href={href} target="_blank" rel="noopener noreferrer" className="block">{content}</a> : content
}
