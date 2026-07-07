import { Link } from 'react-router-dom'
import { Instagram, MessageCircle, Globe, Mail, Phone, MapPin } from 'lucide-react'

const paymentBadges = [
  'QRIS', 'DANA', 'OVO', 'GoPay', 'ShopeePay', 'LinkAja',
  'BCA', 'Mandiri', 'BNI', 'BRI', 'CIMB Niaga', 'Permata',
  'SeaBank', 'Bank Jago', 'Alfamart', 'Indomaret', 'Kartu Kredit',
]

const WHATSAPP_NUMBER = '6285173487538'
const WHATSAPP_DISPLAY = '085173487538'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-white/10 bg-base-900/60">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-14 grid grid-cols-2 md:grid-cols-5 gap-10">
        <div className="col-span-2 md:col-span-1">
          <Link to="/" className="flex items-center gap-2 mb-4">
            <img src="/logo.png" alt="Alaikstore" className="w-9 h-9 object-contain" />
            <span className="font-display font-bold text-lg">Alaik<span className="text-neon-light">store</span></span>
          </Link>
          <p className="text-sm text-white/50 leading-relaxed">
            Platform top up game dan produk digital tercepat & terpercaya di Indonesia.
          </p>
          <div className="flex gap-3 mt-4">
            <a
              href="https://instagram.com/alaik.id_"
              target="_blank" rel="noopener noreferrer"
              aria-label="Instagram @alaik.id_"
              className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:border-neon/40 hover:text-neon-light transition-colors"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={`https://wa.me/${WHATSAPP_NUMBER}`}
              target="_blank" rel="noopener noreferrer"
              aria-label="WhatsApp"
              className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:border-neon/40 hover:text-neon-light transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
            </a>
            <a
              href="https://alaikstore.id"
              target="_blank" rel="noopener noreferrer"
              aria-label="Website alaikstore.id"
              className="w-9 h-9 rounded-lg glass flex items-center justify-center hover:border-neon/40 hover:text-neon-light transition-colors"
            >
              <Globe className="w-4 h-4" />
            </a>
          </div>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm">Perusahaan</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/tentang-kami" className="hover:text-neon-light">Tentang Kami</Link></li>
            <li><Link to="/hubungi-kami" className="hover:text-neon-light">Hubungi Kami</Link></li>
            <li><Link to="/promo" className="hover:text-neon-light">Promo</Link></li>
            <li><Link to="/bantuan" className="hover:text-neon-light">Bantuan</Link></li>
            <li><Link to="/tools" className="hover:text-neon-light">Tools Gamer</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm">Akun</h4>
          <ul className="space-y-2 text-sm text-white/50">
            <li><Link to="/login" className="hover:text-neon-light">Masuk</Link></li>
            <li><Link to="/register" className="hover:text-neon-light">Daftar</Link></li>
            <li><Link to="/cek-pesanan" className="hover:text-neon-light">Cek Status Pesanan</Link></li>
            <li><Link to="/riwayat-transaksi" className="hover:text-neon-light">Riwayat Transaksi</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-semibold mb-4 text-sm">Metode Pembayaran</h4>
          <div className="flex flex-wrap gap-2">
            {paymentBadges.map((m) => (
              <span key={m} className="text-[11px] px-2 py-1 rounded-md bg-white/5 border border-white/10 text-white/50">
                {m}
              </span>
            ))}
          </div>
        </div>

        <div className="col-span-2 md:col-span-1">
          <h4 className="font-semibold mb-4 text-sm">Hubungi Kami</h4>
          <ul className="space-y-3 text-sm text-white/50">
            <li className="flex items-start gap-2">
              <Mail className="w-4 h-4 mt-0.5 shrink-0 text-neon-light" />
              <a href="mailto:alaikstore20@gmail.com" className="hover:text-neon-light break-all">alaikstore20@gmail.com</a>
            </li>
            <li className="flex items-start gap-2">
              <Phone className="w-4 h-4 mt-0.5 shrink-0 text-neon-light" />
              <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="hover:text-neon-light">
                {WHATSAPP_DISPLAY}
              </a>
            </li>
            <li className="flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 shrink-0 text-neon-light" />
              <span>Desa Grogol, Kecamatan Gunung Jati, Kabupaten Cirebon</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-5 text-center text-xs text-white/40 space-y-1.5 px-4">
        <p>© {new Date().getFullYear()} Alaikstore. Seluruh hak cipta dilindungi.</p>
        <p>
          Instagram <a href="https://instagram.com/alaik.id_" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-neon-light">@alaik.id_</a>
          {' · '}WhatsApp <a href={`https://wa.me/${WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-neon-light">{WHATSAPP_DISPLAY}</a>
          {' · '}Web <a href="https://alaikstore.id" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-neon-light">alaikstore.id</a>
        </p>
      </div>
    </footer>
  )
}
