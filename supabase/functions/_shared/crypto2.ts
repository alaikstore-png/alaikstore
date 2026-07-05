// MD5 and HMAC-SHA1 helpers. Native Web Crypto (crypto.subtle) does not support MD5,
// so we pull it from the Deno std crypto module which polyfills extra digest algorithms.

import { crypto as stdCrypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts'
import { encodeHex } from 'https://deno.land/std@0.224.0/encoding/hex.ts'

export async function md5Hex(message: string): Promise<string> {
  const enc = new TextEncoder()
  const digest = await stdCrypto.subtle.digest('MD5', enc.encode(message))
  return encodeHex(digest)
}

export async function hmacSha1Hex(key: string, message: string): Promise<string> {
  const enc = new TextEncoder()
  const cryptoKey = await crypto.subtle.importKey('raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message))
  return Array.from(new Uint8Array(sig)).map((b) => b.toString(16).padStart(2, '0')).join('')
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
