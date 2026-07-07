# Alaikstore — Top Up Game & Produk Digital

Website top up game & produk digital modern (mirip Codashop / UniPin / CiblekStore) dibangun dengan **React + Vite + Tailwind CSS + Supabase + Framer Motion**.

## Fitur yang sudah jadi

- 12 halaman: Home, Detail Produk, Login, Register, Dashboard User, Dashboard Admin, Riwayat Transaksi, Cek Status Pesanan, Promo, Bantuan, Tentang Kami, Hubungi Kami
- Tema dark mode premium, neon blue `#3B82F6`, glassmorphism, animasi Framer Motion, loading skeleton, hover animation
- Navbar transparan + search, Banner Slider (Swiper), Kategori 20 produk (Mobile Legends s/d Zenless Zone Zero), pagination + infinite scroll — **Home, kategori, dan Detail Produk sekarang membaca data asli dari tabel `games`/`products` di Supabase** (otomatis fallback ke data demo bila belum di-seed)
- Alur order lengkap: input ID → pilih nominal → pilih pembayaran (QRIS, e-wallet, VA, retail) → voucher promo → ringkasan → bayar
- Auth (Supabase Auth): login email/password **+ login dengan Google (OAuth)**, register, session persist, role-based routing (`user` / `admin`)
- Dashboard User: profil, saldo, riwayat, wishlist, referral, voucher
- Dashboard Admin: statistik + grafik penjualan (Recharts), **CRUD nyata** untuk banner/game/produk/voucher/user/pesanan/provider (tambah, edit, hapus langsung ke Supabase lewat form modal, termasuk dropdown relasi game↔kategori dan produk↔provider), **Export & Import Excel nyata** (pakai SheetJS) di tiap panel
- **Wishlist nyata**: tombol hati di kartu produk & halaman detail, tersimpan ke tabel `wishlists`, bisa dilihat/dihapus dari Dashboard User
- **Lupa Password & verifikasi email**: link reset password (Supabase Auth), halaman set password baru, dan tombol kirim ulang email verifikasi kalau login gagal karena email belum dikonfirmasi
- **Deposit saldo nyata**: tab Saldo di Dashboard User bisa isi ulang saldo lewat gateway pembayaran yang sama (QRIS/e-wallet/VA/retail); begitu pembayaran dikonfirmasi, saldo otomatis bertambah (via fungsi Postgres atomik `increment_balance`)
- **Bonus referral otomatis**: kode referral bisa diisi saat daftar; begitu user yang direferensikan menyelesaikan transaksi sukses pertamanya, referrer otomatis dapat bonus saldo (nominal diatur lewat `REFERRAL_BONUS`)
- **Statistik Admin dari data asli**: total penjualan 7 hari, total pesanan, total pengguna, dan grafik tren harian dihitung langsung dari tabel `orders`/`users` — bukan angka dummy lagi
- Halaman 404 untuk URL tak dikenal + Error Boundary supaya crash render tidak menampilkan layar putih kosong
- Skema database Supabase lengkap dengan **Row Level Security**, trigger auto-create profile, Realtime, Storage buckets
- Edge Functions dengan integrasi **nyata** ke 3 payment gateway dan 4 provider top-up (detail di bawah)
- **Sistem harga bertingkat (Public / Member / Reseller)**: tiap produk bisa punya `price_member` & `price_reseller` selain harga publik (`sell_price`). Harga final SELALU dihitung ulang di server (fungsi SQL `resolve_price` + Edge Function `create-order`) berdasarkan `price_tier` pembeli — bukan dari body request — supaya tidak bisa dimanipulasi dari sisi client. Admin atur tier tiap user & harga tiap produk lewat Dashboard Admin
- **Affiliate**: setiap user dapat `affiliate_code` unik + link `?aff=KODE` yang berlaku di halaman manapun. Siapa pun yang klik lalu bertransaksi — kapan pun, bukan cuma sekali — pemilik link dapat komisi % otomatis ke saldo. Beda dari Referral yang cuma bonus sekali di transaksi pertama. Statistik klik & komisi ada di tab "Affiliate" Dashboard User; admin lihat semua komisi & atur rate per user di tab "Komisi Affiliate"/"Kelola User"
- **Cashback**: persentase dari tiap transaksi sukses otomatis kembali sebagai saldo ke pembeli, besarnya tergantung tier harga (diatur di tab "Pengaturan Reward" Dashboard Admin). Riwayat cashback ada di tab "Cashback" Dashboard User
- **Email otomatis (baru)**: dikirim lewat [Resend](https://resend.com) untuk 3 kejadian — email selamat datang saat akun baru dibuat (email/password maupun Google), email konfirmasi saat pembayaran/top up sukses, dan email pemberitahuan saat pembayaran gagal/kedaluwarsa. Template email bertema dark/neon senada dengan situs. Welcome email dipicu lewat Database Webhook Supabase (`send-welcome-email`), sementara email sukses/gagal dikirim otomatis dari `payment-callback`, `provider-webhook`, dan `provider-status-check` — di titik manapun status pesanan akhirnya ditentukan. Semua pengiriman bersifat *best-effort*: kalau Resend gagal/belum diatur, itu dicatat ke tabel `logs` dan tidak pernah menggagalkan proses pembayaran/top up
- **Live chat via WhatsApp (baru)**: tombol chat mengambang di semua halaman (sudah ada sebelumnya, sekarang bisa diatur tanpa ubah kode) plus tautan WhatsApp di halaman Bantuan & Hubungi Kami, semuanya membaca satu sumber data yang sama (`settings` → `whatsapp_contact`). Admin ganti nomor & pesan pembuka lewat tab **"Kontak & Live Chat"** di Dashboard Admin — perubahan langsung tampil di seluruh situs tanpa redeploy
- **Flash Sale (baru)**: admin bikin flash sale per produk (diskon % atau nominal, kuota stok, jendela waktu mulai/berakhir) lewat tab **"Kelola Flash Sale"**. Selama flash sale berjalan: harga otomatis muncul di homepage (section "⚡ Flash Sale" dengan countdown detik + progress bar stok terjual) dan di halaman Detail Produk (badge "Flash Sale" pada nominal yang didiskon). Harga & stok flash sale dihitung ulang **di server** (fungsi SQL `resolve_price` + `claim_flash_sale_stock`, dipanggil dari `create-order`) sehingga tidak bisa dimanipulasi dari client, dan klaim stok bersifat atomik supaya dua pembeli di detik terakhir tidak sama-sama dapat harga flash kalau kuota cuma tersisa satu. Tombol **"Umumkan (Push)"** di tiap baris flash sale langsung mengirim push notification broadcast ke semua device yang subscribe
- **Push Notification (baru)**: Web Push berbasis VAPID (bukan aplikasi native, jadi gratis & tidak perlu App Store/Play Store). User aktifkan lewat toggle di Dashboard User → tab Profil. Setelah aktif, user otomatis dapat notifikasi instan saat pesanan berhasil/gagal (dipicu dari `payment-callback`, `provider-webhook`, `provider-status-check` — sama seperti email, tapi lebih cepat sampai) dan saat admin mengumumkan flash sale baru. Subscription tersimpan di tabel `push_subscriptions`; subscription yang sudah kedaluwarsa/di-unsubscribe otomatis terhapus saat pengiriman gagal (404/410)
- **Dashboard Analitik Mendalam (baru)**: tab baru **"Analitik Mendalam"** melengkapi Laporan Laba Rugi dengan: Top 10 Produk Terlaris (bar chart by omzet), Penjualan per Kategori (pie chart), Metode Pembayaran Favorit (pie chart), Pelanggan Baru vs Pelanggan Kembali, Jam Tersibuk Checkout (30 hari terakhir — berguna untuk menjadwalkan flash sale di jam yang tepat), dan tabel Performa tiap Flash Sale (% terjual, status live/selesai). Semua dari view SQL baru (`sales_by_product_daily`, `payment_method_daily`, `customer_daily_stats`, `orders_by_hour_30d`, `flash_sale_performance`) yang konsisten dengan `profit_daily` (hanya menghitung order `success`)

**Catatan Import Excel:** nama kolom di file .xlsx yang diupload harus sama persis dengan nama field tabel (lihat `src/config/adminTables.js`). Sertakan kolom `id` untuk meng-update baris yang sudah ada; kosongkan/hilangkan kolom `id` untuk menambah baris baru. Untuk panel Pesanan di Overview, cukup sertakan kolom `id` dan `status` untuk update massal status pesanan.

## Status integrasi

**Payment gateway — sudah nyata, bukan stub:**

- `supabase/functions/_shared/tripay.ts`, `midtrans.ts`, `xendit.ts`, `duitku.ts` — masing-masing benar-benar memanggil API resmi gateway (create transaction) dan memverifikasi signature webhook sesuai dokumentasi masing-masing:
  - **Tripay**: `POST /transaction/create` dengan signature HMAC-SHA256(merchant_code+merchant_ref+amount), webhook diverifikasi via header `X-Callback-Signature`
  - **Midtrans**: Core API `POST /v2/charge` (QRIS/GoPay/ShopeePay/bank_transfer/echannel/cstore), webhook diverifikasi via `signature_key = SHA512(order_id+status_code+gross_amount+ServerKey)`
  - **Xendit**: `POST /qr_codes`, `/ewallets/charges`, `/callback_virtual_accounts`, `/fixed_payment_code` sesuai metode, webhook diverifikasi via header `x-callback-token`
  - **Duitku**: `POST /webapi/api/merchant/v2/inquiry`, signature `MD5(merchantCode+merchantOrderId+paymentAmount+merchantKey)`; callback dikirim sebagai `application/x-www-form-urlencoded` (bukan JSON) dan diverifikasi via `MD5(merchantCode+amount+merchantOrderId+merchantKey)` — endpoint kami wajib balas body `SUCCESS` persis, kalau tidak Duitku akan retry callback sampai 5x
- `create-order` memilih gateway lewat env `PAYMENT_GATEWAY` (`tripay` | `midtrans` | `xendit` | `duitku`, default `tripay`), lalu menyimpan hasil (QR/VA/checkout url) ke tabel `payments`
- `payment-callback` memverifikasi signature asli tiap gateway sebelum mempercayai payload — payload yang gagal verifikasi otomatis ditolak (401) dan dicatat ke tabel `logs`
- Halaman **Cek Status Pesanan** menampilkan QR code / nomor VA / tombol redirect checkout secara realtime sampai pembayaran dikonfirmasi

**Provider top-up — sudah nyata, bukan stub:**

- `supabase/functions/_shared/{digiflazz,vipreseller,apigames,tokovoucher,medanpedia}.ts` — masing-masing memanggil endpoint resmi sesuai dokumentasi teknis provider:
  - **Digiflazz**: `POST /v1/transaction`, signature `md5(username+api_key+ref_id)`, webhook diverifikasi via `X-Hub-Signature: sha1=...`
  - **VIP Reseller (VIPayment)**: `POST /api/game-feature` (`type=order`), signature `md5(API_ID+API_KEY)`, webhook diverifikasi via header `X-Client-Signature`
  - **Tokovoucher**: `POST /v1/transaksi`, signature `md5(MEMBER_CODE:SECRET:REF_ID)`
  - **APIGames**: `POST /v2/transaksi` — signature memakai formula umum `md5(merchant_id+ref_id+secret)`; APIGames tidak mempublikasikan formula persis di dokumentasi publik, jadi **konfirmasi ke dashboard/support APIGames Anda** sebelum production
  - **MedanPedia**: ⚠️ ini panel **SMM** (followers/likes/views media sosial), bukan provider top-up game/PPOB — mengikuti pola umum "SMM panel API" (`POST /order`, `/status`, `/profile` dengan `api_id`+`api_key`). Hanya relevan kalau Alaikstore juga menjual produk media sosial; untuk diamond/pulsa/token PLN tetap pakai Digiflazz/VIP Reseller/Tokovoucher. Provider ini di-seed dengan `is_active = false` secara default
- **Multi-provider + auto pilih termurah (baru)**: tabel `product_provider_links` memetakan satu produk ke banyak provider sekaligus, masing-masing dengan `sku_code` & `provider_price` sendiri. `provider-topup` mengambil semua provider aktif untuk produk itu, diurutkan dari **termurah** (dengan `priority` sebagai override manual kalau perlu), lalu mencoba satu-satu — kalau provider tercoba gagal/error, otomatis lanjut ke provider termurah berikutnya (failover), bukan langsung menyerah. Provider yang akhirnya berhasil dicatat di `orders.provider_name` + `orders.provider_cost` (harga beli aktualnya, untuk laporan margin yang akurat). Kalau produk belum punya baris di `product_provider_links` (toko lama / belum di-setup), sistem otomatis fallback ke `products.provider_id`/`sku_code` lama, lalu ke `DEFAULT_PROVIDER`
- **Auto update harga & sinkronisasi stok (baru)**: Edge Function `sync-provider-stock` memanggil price-list resmi Digiflazz/VIP Reseller/Tokovoucher/APIGames (MedanPedia dilewati karena dia SMM panel, bukan katalog game/PPOB), lalu otomatis memperbarui `provider_price` & status aktif tiap baris di `product_provider_links`, serta `products.stock_status` (available/empty) berdasarkan apakah produk itu masih punya minimal satu provider yang stoknya ada. Bisa dipicu manual lewat tombol **"Sync Harga & Stok Sekarang"** di tab **Routing Harga Termurah** Dashboard Admin, atau dijadwalkan otomatis tiap 15 menit lewat `pg_cron` + `pg_net` (lihat cuplikan SQL di `supabase/migrations/20260706_profit_report_stock_sync.sql`)
- **Laporan Laba Rugi (baru)**: tab baru di Dashboard Admin menampilkan omzet, modal ke provider (COGS), cashback yang dibayarkan, komisi affiliate yang dibayarkan, dan laba bersih — harian, dengan filter 7/30/90 hari, grafik tren, dan rincian tabel per hari. Datanya dari view SQL `profit_daily` (hanya menghitung order berstatus `success`)
- `provider-webhook` (baru) menerima update status asinkron dari Digiflazz / VIP Reseller / Tokovoucher — karena provider ini sering balas "Pending" dulu baru sukses/gagal belakangan lewat webhook terpisah — lalu meng-update `orders.status` sehingga halaman Cek Status Pesanan (yang sudah subscribe Realtime) langsung berubah
- `provider-status-check` (baru) — untuk provider **tanpa** webhook publik (MedanPedia, dan APIGames kalau Anda pilih tidak mempercayai webhook-nya), di-polling manual lewat tombol "Cek Status" di halaman Cek Status Pesanan (atau dijadwalkan via `pg_cron` + `pg_net` kalau mau otomatis)

**Yang masih perlu Anda isi:**

- Kredensial asli tiap provider di secrets Supabase (lihat `.env.example`)
- Isi tabel `products` dengan `sku_code` & `provider_id` yang benar per produk lewat Dashboard Admin — tanpa ini sistem fallback ke `denomination` sebagai SKU (cocok untuk testing, tidak untuk production)
- Set webhook URL di dashboard tiap provider ke `https://<project>.supabase.co/functions/v1/provider-webhook?provider=digiflazz` (ganti sesuai provider)
- Verifikasi ulang formula signature APIGames ke dokumentasi/support resmi mereka
- Kalau sudah punya database dari sebelumnya (bukan instalasi baru), jalankan `supabase/migrations/20260704_add_duitku_medanpedia.sql` di SQL Editor supaya kolom `payment_gateway`/`provider_name`/`gateway` menerima nilai `duitku` dan `MedanPedia`


## Menjalankan secara lokal

```bash
npm install
cp .env.example .env      # isi VITE_SUPABASE_URL & VITE_SUPABASE_ANON_KEY
npm run dev
```

## Setup Supabase

1. Buat project baru di https://supabase.com
2. Buka **SQL Editor**, jalankan isi `supabase/schema.sql` (membuat semua tabel, trigger, RLS, realtime, storage bucket), lalu jalankan `supabase/migrations/20260704_add_duitku_medanpedia.sql`, `supabase/migrations/20260704b_tiered_pricing_affiliate_cashback.sql`, `supabase/migrations/20260705_multi_provider_routing.sql`, `supabase/migrations/20260706_profit_report_stock_sync.sql`, `supabase/migrations/20260707_whatsapp_contact_settings.sql`, `supabase/migrations/20260708_flash_sale_push_analytics.sql`, dan `supabase/migrations/20260709_admin_by_email_helper.sql` secara berurutan (menambahkan harga bertingkat, affiliate, cashback, routing multi-provider termurah, laporan laba rugi, pengaturan kontak WhatsApp, flash sale, push notification, view analitik mendalam, dan helper jadi-admin lewat email)
3. Jalankan isi `supabase/seed.sql` untuk mengisi data awal: 4 provider, 4 kategori, 20 game (sesuai daftar yang diminta), nominal top up nyata untuk Mobile Legends/Free Fire/PUBG Mobile/Genshin Impact/Steam Wallet/Google Play (lengkap dengan `sku_code` per provider), 3 banner, 4 voucher promo
4. Salin `Project URL` & `anon public key` ke file `.env`
5. Di Supabase Dashboard → Authentication → Providers → Email, aktifkan/nonaktifkan **"Confirm email"** sesuai kebutuhan, dan pastikan SMTP (bawaan Supabase atau custom) sudah aktif agar email verifikasi & reset password benar-benar terkirim
6. Aktifkan **login Google**: Supabase Dashboard → Authentication → Providers → Google → aktifkan, lalu isi **Client ID** & **Client Secret** dari [Google Cloud Console](https://console.cloud.google.com/apis/credentials) (buat OAuth Client ID tipe "Web application"). Di Google Cloud Console, tambahkan **Authorized redirect URI**: `https://<project-ref>.supabase.co/auth/v1/callback` (ambil URL persisnya dari halaman provider Google di Supabase). Tombol "Masuk/Daftar dengan Google" di halaman Login & Register akan otomatis aktif setelah ini diisi — tidak perlu ubah kode apa pun.
7. Deploy Edge Functions:
   ```bash
   supabase functions deploy create-order
   supabase functions deploy payment-callback --no-verify-jwt
   supabase functions deploy provider-topup
   supabase functions deploy provider-webhook --no-verify-jwt
   supabase functions deploy provider-status-check
   supabase functions deploy sync-provider-stock
   supabase functions deploy order-status
   supabase functions deploy validate-promo
   supabase functions deploy send-welcome-email --no-verify-jwt
   supabase functions deploy send-push-notification
   ```
8. Set semua secrets gateway & provider di Supabase (Project Settings → Edge Functions → Secrets) — daftar lengkap variabel ada di `.env.example`, sertakan juga `APP_BASE_URL`, `REFERRAL_BONUS`, `RESEND_API_KEY`, dan `RESEND_FROM_EMAIL`
9. Set webhook URL di dashboard masing-masing gateway/provider agar mengarah ke fungsi di atas (lihat bagian "Status integrasi" untuk pemetaan lengkap)
10. Buat user pertama lalu jalankan `update public.users set role = 'admin' where id = '<uuid>'` untuk akses Dashboard Admin
11. **Aktifkan email welcome otomatis**: Supabase Dashboard → Database → Webhooks → Create a new hook → table `users` (schema `public`) → event `Insert` → type `Supabase Edge Functions` → pilih fungsi `send-welcome-email`. Setelah ini, setiap user baru (daftar email/password maupun Google) otomatis dapat email selamat datang.
12. **Live chat (WhatsApp)**: nomor & pesan default sudah otomatis ke-set lewat migration di langkah 2. Ganti nomor/pesannya kapan saja dari Dashboard Admin → tab **"Kontak & Live Chat"** — tombol chat mengambang di semua halaman serta halaman Bantuan/Hubungi Kami langsung ikut berubah, tanpa perlu ubah kode atau redeploy.
13. **Aktifkan Push Notification**: generate key pair sekali dengan `npx web-push generate-vapid-keys`, lalu set `VAPID_PUBLIC_KEY` & `VAPID_PRIVATE_KEY` (dan opsional `VAPID_SUBJECT`) sebagai Edge Function secrets, DAN set `VITE_VAPID_PUBLIC_KEY` (nilai publicKey yang sama) di file `.env` frontend lalu rebuild/redeploy frontend. Tanpa langkah ini, tombol "Aktifkan Notifikasi" di Dashboard User akan gagal dengan pesan error yang jelas.
14. **Flash Sale**: buat lewat Dashboard Admin → tab "Kelola Flash Sale" (pilih produk, tipe & nilai diskon, kuota stok, jendela waktu mulai/berakhir). Klik "Umumkan (Push)" pada baris flash sale untuk langsung broadcast push notification ke semua user yang subscribe.


## Struktur folder

```
gamestore/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── .env.example
├── supabase/
│   ├── schema.sql                     # tabel, RLS, trigger, realtime, storage
│   ├── seed.sql                       # data awal: provider, kategori, game, produk, banner, promo
│   └── functions/
│       ├── _shared/
│       │   ├── crypto.ts               # HMAC-SHA256 / SHA-512 (gateways)
│       │   ├── crypto2.ts              # MD5 / HMAC-SHA1 (providers)
│       │   ├── referral.ts             # deposit credit + one-time referral bonus
│       │   ├── tripay.ts               # real Tripay create-transaction + webhook verify
│       │   ├── midtrans.ts             # real Midtrans Core API charge + webhook verify
│       │   ├── xendit.ts               # real Xendit QR/e-wallet/VA/retail + webhook verify
│       │   ├── duitku.ts               # real Duitku v2/inquiry charge + form-urlencoded webhook verify
│       │   ├── digiflazz.ts            # real Digiflazz transaction + webhook verify
│       │   ├── vipreseller.ts          # real VIP Reseller order + webhook verify
│       │   ├── apigames.ts             # real APIGames transaction
│       │   ├── tokovoucher.ts          # real Tokovoucher transaction + webhook verify
│       │   └── medanpedia.ts           # real MedanPedia SMM-panel order + status polling
│       ├── create-order/index.ts       # creates order + real gateway transaction
│       ├── payment-callback/index.ts   # verifies real gateway webhook signatures, triggers top-up
│       ├── provider-topup/index.ts     # routes to the real provider assigned to the product
│       ├── provider-webhook/index.ts   # receives async status updates from providers
│       ├── provider-status-check/index.ts # manual/cron poll for providers with no push webhook (MedanPedia)
│       ├── order-status/index.ts
│       └── validate-promo/index.ts
└── src/
    ├── main.jsx
    ├── App.jsx                        # routing utama
    ├── index.css                      # tema dark + utilitas glassmorphism
    ├── lib/
    │   ├── supabaseClient.js
    │   ├── api.js                     # helper axios ke Edge Functions
    │   └── excel.js                   # export/import .xlsx (SheetJS)
    ├── context/
    │   └── AuthContext.jsx            # Context API untuk auth & profil
    ├── hooks/
    │   ├── useFetch.js
    │   └── useDebounce.js
    ├── routes/
    │   └── ProtectedRoute.jsx         # guard untuk /dashboard & /admin
    ├── data/
    │   └── mockData.js                # data demo kategori/faq/testimoni
    ├── config/
    │   └── adminTables.js             # CRUD schema per tabel (fields, opsi, relasi FK)
    ├── components/
    │   ├── ErrorBoundary.jsx          # fallback UI saat render crash
    │   ├── admin/
    │   │   └── CrudModal.jsx          # form modal generik add/edit
    │   ├── layout/
    │   │   ├── Navbar.jsx
    │   │   └── Footer.jsx
    │   ├── ui/
    │   │   ├── ProductCard.jsx
    │   │   ├── WishlistButton.jsx     # toggle wishlist (tabel `wishlists`)
    │   │   ├── GoogleButton.jsx       # tombol login/daftar Google OAuth
    │   │   └── Skeleton.jsx
    │   └── home/
    │       ├── BannerSlider.jsx
    │       ├── CategoryGrid.jsx       # filter + pagination + infinite scroll
    │       ├── HowToTopUp.jsx
    │       ├── FaqAccordion.jsx
    │       └── Testimonials.jsx
    └── pages/
        ├── Home.jsx
        ├── ProductDetail.jsx
        ├── Login.jsx
        ├── Register.jsx
        ├── ForgotPassword.jsx
        ├── ResetPassword.jsx
        ├── DashboardUser.jsx
        ├── DashboardAdmin.jsx
        ├── TransactionHistory.jsx
        ├── OrderStatus.jsx
        ├── Promo.jsx
        ├── Help.jsx
        ├── About.jsx
        ├── Contact.jsx
        └── NotFound.jsx
```

## Tabel database (ringkas)

`users`, `categories`, `games`, `products`, `providers`, `orders`, `payments`, `banners`, `promos`, `settings`, `logs`, `wishlists` — definisi lengkap beserta relasi dan constraint ada di `supabase/schema.sql`.
