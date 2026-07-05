// Shared crypto helpers used to sign outgoing requests and verify incoming
// webhook signatures for Tripay (HMAC-SHA256) and Midtrans (SHA-512).

export async function hmacSha256Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(key),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function sha512Hex(message: string): Promise<string> {
  const enc = new TextEncoder()
  const hash = await crypto.subtle.digest('SHA-512', enc.encode(message))
  return Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

/** Constant-time-ish string compare to avoid trivial timing attacks on signature checks. */
export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
