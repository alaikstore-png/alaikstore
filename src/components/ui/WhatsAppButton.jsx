import { MessageCircle } from 'lucide-react'
import { useWhatsAppContact } from '../../hooks/useWhatsAppContact'

export default function WhatsAppButton() {
  const { number, message } = useWhatsAppContact()
  const href = `https://wa.me/${number}?text=${encodeURIComponent(message)}`

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat via WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex items-center justify-center w-14 h-14 rounded-full bg-[#25D366] shadow-lg shadow-[#25D366]/40 transition-transform duration-300 hover:scale-110 active:scale-95"
    >
      <span className="absolute inset-0 rounded-full bg-[#25D366] animate-ping opacity-40" />
      <MessageCircle className="relative w-7 h-7 text-white" fill="white" />
    </a>
  )
}
