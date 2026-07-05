// Shared helper for transactional email via Resend (https://resend.com).
// Used for: welcome email (new account), payment/topup success, and
// payment failed/expired. All sends are best-effort — callers should wrap
// these in try/catch and log failures instead of letting them break the
// payment/order flow (see payment-callback, provider-webhook, send-welcome-email).

const RESEND_API_URL = 'https://api.resend.com/emails'

function fromAddress() {
  // e.g. "Alaikstore <no-reply@alaikstore.com>" — must be a domain verified in
  // your Resend account. Falls back to Resend's shared test sender so emails
  // still go out (to your own inbox only) before you've verified a domain.
  return Deno.env.get('RESEND_FROM_EMAIL') || 'Alaikstore <onboarding@resend.dev>'
}

/**
 * Sends a single email via the Resend API. Returns true/false instead of
 * throwing so a missing/invalid RESEND_API_KEY never takes down the caller's
 * main flow (payment confirmation, account creation, etc.) — failures are
 * the caller's responsibility to log.
 */
export async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = Deno.env.get('RESEND_API_KEY')
  if (!apiKey) {
    console.error('sendEmail skipped: RESEND_API_KEY not set')
    return { ok: false, error: 'RESEND_API_KEY not set' }
  }
  if (!to) {
    console.error('sendEmail skipped: missing recipient')
    return { ok: false, error: 'missing recipient' }
  }

  const res = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({ from: fromAddress(), to: [to], subject, html }),
  })

  if (!res.ok) {
    const errText = await res.text()
    console.error('Resend API error:', res.status, errText)
    return { ok: false, error: errText }
  }
  return { ok: true }
}

/**
 * public.users doesn't store email (it lives in auth.users), so any Edge
 * Function that wants to email a user by id needs the service-role admin API.
 * Returns null (never throws) so a lookup failure just means "skip the email".
 */
export async function getUserEmail(supabaseAdmin: any, userId: string | null | undefined): Promise<string | null> {
  if (!userId) return null
  try {
    const { data, error } = await supabaseAdmin.auth.admin.getUserById(userId)
    if (error) return null
    return data?.user?.email || null
  } catch {
    return null
  }
}

function formatRupiah(amount: number) {
  return 'Rp' + Number(amount || 0).toLocaleString('id-ID')
}

// Shared email chrome — dark/neon-blue theme matching the Alaikstore site,
// simplified into inline-styled tables/divs since most email clients strip
// external stylesheets and modern CSS.
function layout(bodyHtml: string) {
  return `
  <div style="background:#0b0f1a;padding:32px 16px;font-family:'Segoe UI',Roboto,Arial,sans-serif;">
    <div style="max-width:520px;margin:0 auto;background:#121826;border:1px solid #1f2937;border-radius:16px;overflow:hidden;">
      <div style="padding:24px 28px;background:linear-gradient(135deg,#3B82F6,#1d4ed8);">
        <span style="font-size:20px;font-weight:700;color:#fff;letter-spacing:0.5px;">Alaikstore</span>
      </div>
      <div style="padding:28px;color:#e5e7eb;font-size:14px;line-height:1.6;">
        ${bodyHtml}
      </div>
      <div style="padding:18px 28px;border-top:1px solid #1f2937;color:#6b7280;font-size:12px;">
        Email ini dikirim otomatis oleh Alaikstore. Butuh bantuan? Balas email ini atau hubungi CS lewat tombol WhatsApp di website kami.
      </div>
    </div>
  </div>`
}

export function welcomeEmailTemplate(fullName?: string | null) {
  const name = fullName?.trim() || 'Kak'
  return layout(`
    <h2 style="color:#fff;margin:0 0 12px;">Selamat datang, ${name}! 🎉</h2>
    <p>Akun kamu di <strong>Alaikstore</strong> sudah berhasil dibuat. Sekarang kamu bisa top up game favorit, isi saldo, pantau riwayat transaksi, dan klaim promo langsung dari akunmu.</p>
    <p>Beberapa hal yang bisa langsung kamu coba:</p>
    <ul style="padding-left:18px;margin:0 0 16px;">
      <li>Top up diamond/UC/voucher dari 20+ game populer</li>
      <li>Isi saldo sekali untuk transaksi lebih cepat berikutnya</li>
      <li>Ajak teman pakai kode referral kamu dan dapat bonus saldo</li>
    </ul>
    <p style="margin-top:20px;">Selamat berbelanja! 🚀</p>
  `)
}

export function paymentSuccessEmailTemplate(order: {
  id: string
  product_slug?: string | null
  denomination?: string | null
  user_game_id?: string | null
  amount: number
}) {
  const productLine = order.product_slug === 'deposit-saldo'
    ? 'Isi Saldo Alaikstore'
    : (order.denomination || order.product_slug || 'Produk')
  return layout(`
    <h2 style="color:#22c55e;margin:0 0 12px;">Pembayaran berhasil ✅</h2>
    <p>Pesanan kamu sudah kami konfirmasi dan sedang/sudah diproses.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#9ca3af;">ID Pesanan</td><td style="padding:6px 0;text-align:right;">${order.id}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Produk</td><td style="padding:6px 0;text-align:right;">${productLine}</td></tr>
      ${order.user_game_id ? `<tr><td style="padding:6px 0;color:#9ca3af;">ID Tujuan</td><td style="padding:6px 0;text-align:right;">${order.user_game_id}</td></tr>` : ''}
      <tr><td style="padding:6px 0;color:#9ca3af;">Total Bayar</td><td style="padding:6px 0;text-align:right;font-weight:700;color:#3B82F6;">${formatRupiah(order.amount)}</td></tr>
    </table>
    <p>Cek status lengkap kapan saja di halaman <strong>Cek Status Pesanan</strong> di website kami.</p>
  `)
}

export function paymentFailedEmailTemplate(order: {
  id: string
  product_slug?: string | null
  denomination?: string | null
  amount: number
}, reason: 'failed' | 'expired' = 'failed') {
  const productLine = order.product_slug === 'deposit-saldo'
    ? 'Isi Saldo Alaikstore'
    : (order.denomination || order.product_slug || 'Produk')
  const title = reason === 'expired' ? 'Pembayaran kedaluwarsa ⏱️' : 'Pembayaran gagal ❌'
  const explanation = reason === 'expired'
    ? 'Waktu pembayaran untuk pesanan ini sudah habis sebelum kami menerima konfirmasi dari penyedia pembayaran.'
    : 'Pembayaran untuk pesanan ini tidak berhasil diproses.'
  return layout(`
    <h2 style="color:#ef4444;margin:0 0 12px;">${title}</h2>
    <p>${explanation} Jangan khawatir, tidak ada saldo yang terpotong untuk pesanan ini.</p>
    <table style="width:100%;border-collapse:collapse;margin:16px 0;">
      <tr><td style="padding:6px 0;color:#9ca3af;">ID Pesanan</td><td style="padding:6px 0;text-align:right;">${order.id}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Produk</td><td style="padding:6px 0;text-align:right;">${productLine}</td></tr>
      <tr><td style="padding:6px 0;color:#9ca3af;">Total</td><td style="padding:6px 0;text-align:right;font-weight:700;">${formatRupiah(order.amount)}</td></tr>
    </table>
    <p>Silakan buat pesanan baru dari website kami. Kalau kamu merasa ini keliru atau sudah membayar, hubungi CS lewat tombol WhatsApp di website kami dengan menyertakan ID Pesanan di atas.</p>
  `)
}
