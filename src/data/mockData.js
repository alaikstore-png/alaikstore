// Demo/fallback data — in production this is fetched from Supabase tables
// (categories, games, products). Kept here so the UI renders immediately
// even before the database is seeded.

export const categories = [
  { slug: 'mobile-legends', name: 'Mobile Legends', publisher: 'Moonton', group: 'Mobile Game', hot: true, image: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400' },
  { slug: 'free-fire', name: 'Free Fire', publisher: 'Garena', group: 'Mobile Game', hot: true, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
  { slug: 'pubg-mobile', name: 'PUBG Mobile', publisher: 'Krafton', group: 'Mobile Game', hot: true, image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
  { slug: 'honor-of-kings', name: 'Honor of Kings', publisher: 'TiMi Studio', group: 'Mobile Game', hot: false, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
  { slug: 'blood-strike', name: 'Blood Strike', publisher: 'NetEase', group: 'Mobile Game', hot: false, image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
  { slug: 'cod-mobile', name: 'Call of Duty Mobile', publisher: 'Activision', group: 'Mobile Game', hot: false, image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=400' },
  { slug: 'arena-breakout', name: 'Arena Breakout', publisher: 'Proxima Beta', group: 'Mobile Game', hot: false, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
  { slug: 'magic-chess', name: 'Magic Chess Go Go', publisher: 'Moonton', group: 'Mobile Game', hot: false, image: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400' },
  { slug: 'ragnarok-x', name: 'Ragnarok X: Next Generation', publisher: 'Gravity', group: 'Mobile Game', hot: false, image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
  { slug: 'valorant', name: 'Valorant', publisher: 'Riot Games', group: 'PC Game', hot: true, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
  { slug: 'point-blank', name: 'Point Blank', publisher: 'Zepetto', group: 'PC Game', hot: false, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
  { slug: 'league-of-legends', name: 'League of Legends', publisher: 'Riot Games', group: 'PC Game', hot: false, image: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400' },
  { slug: 'steam-wallet', name: 'Steam Wallet', publisher: 'Valve', group: 'Voucher', hot: false, image: 'https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?w=400' },
  { slug: 'psn', name: 'PlayStation Network', publisher: 'Sony', group: 'Voucher', hot: false, image: 'https://images.unsplash.com/photo-1486401899868-0e435ed85128?w=400' },
  { slug: 'google-play', name: 'Google Play', publisher: 'Google', group: 'Voucher', hot: false, image: 'https://images.unsplash.com/photo-1607252650355-f7fd0460ccdb?w=400' },
  { slug: 'garena-shell', name: 'Garena Shell', publisher: 'Garena', group: 'Voucher', hot: false, image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400' },
  { slug: 'roblox', name: 'Roblox', publisher: 'Roblox Corp', group: 'Produk Digital', hot: true, image: 'https://images.unsplash.com/photo-1614680376573-df3480f0c6ff?w=400' },
  { slug: 'genshin-impact', name: 'Genshin Impact', publisher: 'HoYoverse', group: 'Produk Digital', hot: true, image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400' },
  { slug: 'honkai-star-rail', name: 'Honkai Star Rail', publisher: 'HoYoverse', group: 'Produk Digital', hot: false, image: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400' },
  { slug: 'zenless-zone-zero', name: 'Zenless Zone Zero', publisher: 'HoYoverse', group: 'Produk Digital', hot: false, image: 'https://images.unsplash.com/photo-1580327344181-c1163234e5a0?w=400' },

  // ---------- Pulsa & Paket Data ----------
  { slug: 'pulsa-telkomsel', name: 'Telkomsel', publisher: 'Pulsa & Paket Data', group: 'Pulsa & Data', hot: true },
  { slug: 'pulsa-indosat', name: 'Indosat Ooredoo', publisher: 'Pulsa & Paket Data', group: 'Pulsa & Data', hot: true },
  { slug: 'pulsa-xl', name: 'XL Axiata', publisher: 'Pulsa & Paket Data', group: 'Pulsa & Data', hot: false },
  { slug: 'pulsa-axis', name: 'AXIS', publisher: 'Pulsa & Paket Data', group: 'Pulsa & Data', hot: false },
  { slug: 'pulsa-tri', name: 'Tri (3)', publisher: 'Pulsa & Paket Data', group: 'Pulsa & Data', hot: false },
  { slug: 'pulsa-smartfren', name: 'Smartfren', publisher: 'Pulsa & Paket Data', group: 'Pulsa & Data', hot: false },

  // ---------- Token & Tagihan ----------
  { slug: 'token-listrik-pln', name: 'Token Listrik PLN Prabayar', publisher: 'PT PLN (Persero)', group: 'Token & Tagihan', hot: true },
  { slug: 'tagihan-listrik-pln', name: 'Tagihan Listrik PLN Pascabayar', publisher: 'PT PLN (Persero)', group: 'Token & Tagihan', hot: false },
  { slug: 'bpjs-kesehatan', name: 'BPJS Kesehatan', publisher: 'BPJS', group: 'Token & Tagihan', hot: false },

  // ---------- Top Up E-Wallet ----------
  { slug: 'topup-dana', name: 'DANA', publisher: 'Top Up Saldo E-Wallet', group: 'Top Up E-Wallet', hot: true },
  { slug: 'topup-ovo', name: 'OVO', publisher: 'Top Up Saldo E-Wallet', group: 'Top Up E-Wallet', hot: true },
  { slug: 'topup-gopay', name: 'GoPay', publisher: 'Top Up Saldo E-Wallet', group: 'Top Up E-Wallet', hot: true },
  { slug: 'topup-shopeepay', name: 'ShopeePay', publisher: 'Top Up Saldo E-Wallet', group: 'Top Up E-Wallet', hot: false },
  { slug: 'topup-linkaja', name: 'LinkAja', publisher: 'Top Up Saldo E-Wallet', group: 'Top Up E-Wallet', hot: false },
]

export const categoryGroups = [
  'Semua', 'Mobile Game', 'PC Game', 'Voucher', 'Produk Digital',
  'Pulsa & Data', 'Token & Tagihan', 'Top Up E-Wallet',
]

// Extra metadata for PPOB-style categories (pulsa, listrik, e-wallet) that
// aren't games: what to call the account field, and its placeholder/hint.
// Anything not listed here falls back to the default "User ID" game field.
export const inputMetaByGroup = {
  'Pulsa & Data': { label: 'Nomor HP', placeholder: 'Contoh: 081234567890', hint: 'Pastikan nomor HP aktif dan sesuai operator yang dipilih.' },
  'Token & Tagihan': { label: 'ID Pelanggan / No. Meter', placeholder: 'Contoh: 530000000000', hint: 'Cek ID Pelanggan di struk terakhir atau meteran listrik Anda.' },
  'Top Up E-Wallet': { label: 'Nomor HP / Akun Terdaftar', placeholder: 'Contoh: 081234567890', hint: 'Gunakan nomor yang terdaftar pada akun e-wallet tujuan.' },
}

export const denominations = [
  { id: 'd1', label: '86 Diamonds', price: 22000, strike: 25000 },
  { id: 'd2', label: '172 Diamonds', price: 44000, strike: 49000 },
  { id: 'd3', label: '257 Diamonds', price: 66000, strike: null },
  { id: 'd4', label: '344 Diamonds', price: 88000, strike: 95000 },
  { id: 'd5', label: '429 Diamonds (Populer)', price: 110000, strike: 120000, popular: true },
  { id: 'd6', label: '514 Diamonds', price: 132000, strike: null },
  { id: 'd7', label: 'Weekly Diamond Pass', price: 29000, strike: null },
  { id: 'd8', label: 'Twilight Pass', price: 149000, strike: 165000 },
]

// Pulsa + paket data share the same nominal structure across GSM operators
// (Telkomsel, Indosat, XL, AXIS, Tri, Smartfren) — only the price differs
// slightly per operator, so we generate each list from one template.
function buildPulsaData(operator, priceAdjust = 0) {
  return [
    { id: `${operator}-p5`, label: 'Pulsa 5.000', price: 6500 + priceAdjust, strike: null },
    { id: `${operator}-p10`, label: 'Pulsa 10.000', price: 11500 + priceAdjust, strike: null },
    { id: `${operator}-p15`, label: 'Pulsa 15.000', price: 16500 + priceAdjust, strike: null },
    { id: `${operator}-p20`, label: 'Pulsa 20.000', price: 21000 + priceAdjust, strike: 22500 },
    { id: `${operator}-p25`, label: 'Pulsa 25.000', price: 26000 + priceAdjust, strike: null },
    { id: `${operator}-p50`, label: 'Pulsa 50.000 (Populer)', price: 50500 + priceAdjust, strike: 52000, popular: true },
    { id: `${operator}-p100`, label: 'Pulsa 100.000', price: 99500 + priceAdjust, strike: 102000 },
    { id: `${operator}-d1gb`, label: 'Paket Data 1GB / 30 Hari', price: 16000 + priceAdjust, strike: null },
    { id: `${operator}-d3gb`, label: 'Paket Data 3GB / 30 Hari', price: 32000 + priceAdjust, strike: 35000 },
    { id: `${operator}-d5gb`, label: 'Paket Data 5GB / 30 Hari', price: 45000 + priceAdjust, strike: null },
    { id: `${operator}-d10gb`, label: 'Paket Data 10GB / 30 Hari', price: 78000 + priceAdjust, strike: 85000 },
  ]
}

function buildEwalletTopup(wallet) {
  return [
    { id: `${wallet}-10`, label: 'Saldo 10.000', price: 11500, strike: null },
    { id: `${wallet}-20`, label: 'Saldo 20.000', price: 21500, strike: null },
    { id: `${wallet}-50`, label: 'Saldo 50.000 (Populer)', price: 51500, strike: 53000, popular: true },
    { id: `${wallet}-100`, label: 'Saldo 100.000', price: 102000, strike: 104000 },
    { id: `${wallet}-150`, label: 'Saldo 150.000', price: 152000, strike: null },
    { id: `${wallet}-200`, label: 'Saldo 200.000', price: 202000, strike: 205000 },
    { id: `${wallet}-300`, label: 'Saldo 300.000', price: 302500, strike: null },
    { id: `${wallet}-500`, label: 'Saldo 500.000', price: 504000, strike: 508000 },
  ]
}

export const denominationsBySlug = {
  'pulsa-telkomsel': buildPulsaData('tsel'),
  'pulsa-indosat': buildPulsaData('isat', -500),
  'pulsa-xl': buildPulsaData('xl', -300),
  'pulsa-axis': buildPulsaData('axis', -800),
  'pulsa-tri': buildPulsaData('tri', -1000),
  'pulsa-smartfren': buildPulsaData('smart', -700),

  'token-listrik-pln': [
    { id: 'pln-20', label: 'Token Listrik 20.000', price: 22500, strike: null },
    { id: 'pln-50', label: 'Token Listrik 50.000', price: 52500, strike: null },
    { id: 'pln-100', label: 'Token Listrik 100.000 (Populer)', price: 102500, strike: 105000, popular: true },
    { id: 'pln-200', label: 'Token Listrik 200.000', price: 202500, strike: null },
    { id: 'pln-500', label: 'Token Listrik 500.000', price: 502500, strike: 507000 },
    { id: 'pln-1jt', label: 'Token Listrik 1.000.000', price: 1002500, strike: null },
  ],
  'tagihan-listrik-pln': [
    { id: 'pln-pasca', label: 'Cek & Bayar Tagihan (per bulan tagihan)', price: 3000, strike: null },
  ],
  'bpjs-kesehatan': [
    { id: 'bpjs-1bln', label: 'Bayar Iuran 1 Bulan', price: 2500, strike: null },
    { id: 'bpjs-3bln', label: 'Bayar Iuran 3 Bulan', price: 5500, strike: null },
    { id: 'bpjs-6bln', label: 'Bayar Iuran 6 Bulan', price: 8500, strike: null },
  ],

  'topup-dana': buildEwalletTopup('dana'),
  'topup-ovo': buildEwalletTopup('ovo'),
  'topup-gopay': buildEwalletTopup('gopay'),
  'topup-shopeepay': buildEwalletTopup('spay'),
  'topup-linkaja': buildEwalletTopup('linkaja'),
}

export const paymentMethods = [
  { id: 'qris', name: 'QRIS (Semua e-wallet & m-banking)', group: 'QRIS', fee: 'Rp 0' },
  { id: 'dana', name: 'DANA', group: 'E-Wallet', fee: 'Rp 500' },
  { id: 'ovo', name: 'OVO', group: 'E-Wallet', fee: 'Rp 500' },
  { id: 'gopay', name: 'GoPay', group: 'E-Wallet', fee: 'Rp 500' },
  { id: 'shopeepay', name: 'ShopeePay', group: 'E-Wallet', fee: 'Rp 500' },
  { id: 'linkaja', name: 'LinkAja', group: 'E-Wallet', fee: 'Rp 500' },
  { id: 'isaku', name: 'i.saku', group: 'E-Wallet', fee: 'Rp 500' },
  { id: 'bca_va', name: 'BCA Virtual Account', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'mandiri_va', name: 'Mandiri Virtual Account', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'bni_va', name: 'BNI Virtual Account', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'bri_va', name: 'BRI Virtual Account', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'cimb_va', name: 'CIMB Niaga Virtual Account', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'permata_va', name: 'Permata Virtual Account', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'danamon_va', name: 'Danamon Virtual Account', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'bsi_va', name: 'BSI Virtual Account (Syariah)', group: 'Bank Transfer / VA', fee: 'Rp 4.000' },
  { id: 'seabank', name: 'SeaBank', group: 'Bank Transfer / VA', fee: 'Rp 1.000' },
  { id: 'jago', name: 'Bank Jago', group: 'Bank Transfer / VA', fee: 'Rp 1.000' },
  { id: 'blu', name: 'blu by BCA Digital', group: 'Bank Transfer / VA', fee: 'Rp 1.000' },
  { id: 'alfamart', name: 'Alfamart', group: 'Retail / Gerai', fee: 'Rp 2.500' },
  { id: 'indomaret', name: 'Indomaret', group: 'Retail / Gerai', fee: 'Rp 2.500' },
  { id: 'credit_card', name: 'Kartu Kredit/Debit (Visa, Mastercard)', group: 'Kartu', fee: 'Rp 2.900 + 2%' },
]

export const faqs = [
  { q: 'Berapa lama proses top up?', a: 'Sebagian besar transaksi diproses otomatis dalam hitungan detik hingga 5 menit setelah pembayaran berhasil dikonfirmasi.' },
  { q: 'Apakah data akun saya aman?', a: 'Ya. Kami hanya membutuhkan data publik seperti User ID game, nomor HP, atau ID pelanggan sesuai jenis produk — tidak pernah meminta password akun Anda.' },
  { q: 'Bagaimana jika Diamond belum masuk?', a: 'Cek status pesanan Anda di halaman Riwayat Transaksi. Jika lebih dari 30 menit belum masuk, hubungi tim support kami dengan invoice terkait.' },
  { q: 'Metode pembayaran apa saja yang didukung?', a: 'QRIS, e-wallet (DANA, OVO, GoPay, ShopeePay, LinkAja, i.saku), Virtual Account/transfer bank (BCA, Mandiri, BNI, BRI, CIMB Niaga, Permata, Danamon, BSI, SeaBank, Bank Jago, blu), retail (Alfamart, Indomaret), hingga kartu kredit/debit.' },
  { q: 'Apakah ada minimal transaksi?', a: 'Tidak ada minimal transaksi. Anda bisa top up sesuai nominal yang tersedia di setiap produk.' },
]

export const testimonials = [
  { name: 'Rizky A.', game: 'Mobile Legends', text: 'Prosesnya cepat banget, diamond masuk kurang dari 1 menit!', rating: 5 },
  { name: 'Dewi S.', game: 'Genshin Impact', text: 'Harga bersaing dan banyak promo, jadi langganan top up di sini.', rating: 5 },
  { name: 'Fajar P.', game: 'Free Fire', text: 'Pembayaran QRIS langsung konfirmasi otomatis, mantap.', rating: 4 },
  { name: 'Nadia R.', game: 'Valorant', text: 'Customer service responsif waktu saya tanya status pesanan.', rating: 5 },
]

export const howToSteps = [
  { title: 'Pilih Produk', desc: 'Cari game atau produk digital yang ingin kamu top up dari daftar kategori.' },
  { title: 'Masukkan ID', desc: 'Isi User ID dan Server ID sesuai akun game kamu dengan benar.' },
  { title: 'Pilih Nominal & Bayar', desc: 'Tentukan nominal top up, pilih metode pembayaran, lalu selesaikan pembayaran.' },
  { title: 'Item Masuk Otomatis', desc: 'Sistem kami memproses pesanan secara realtime ke provider dan mengirim item ke akunmu.' },
]
