// Simple TOTP implementation without external dependencies
import crypto from 'crypto'

function base32Decode(encoded: string): Buffer {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  let value = ''

  for (let i = 0; i < encoded.length; i++) {
    const char = encoded.charAt(i).toUpperCase()
    if (alphabet.indexOf(char) === -1) continue
    bits += alphabet.indexOf(char).toString(2).padStart(5, '0')
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    value += String.fromCharCode(parseInt(bits.substr(i, 8), 2))
  }

  return Buffer.from(value, 'binary')
}

function base32Encode(buffer: Buffer): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = ''
  let value = ''

  for (let i = 0; i < buffer.length; i++) {
    bits += buffer[i].toString(2).padStart(8, '0')
  }

  for (let i = 0; i + 5 <= bits.length; i += 5) {
    value += alphabet[parseInt(bits.substr(i, 5), 2)]
  }

  if (bits.length % 5 !== 0) {
    const remaining = bits.substr(Math.floor(bits.length / 5) * 5)
    value += alphabet[parseInt(remaining.padEnd(5, '0'), 2)]
  }

  return value
}

export function generateSecret(length: number = 32): string {
  const buffer = crypto.randomBytes(length)
  return base32Encode(buffer)
}

export function generateTOTP(secret: string, window: number = 0): string {
  const time = Math.floor(Date.now() / 1000 / 30) + window
  const timeBuffer = Buffer.alloc(8)
  timeBuffer.writeBigInt64BE(BigInt(time))

  const secretBuffer = base32Decode(secret)
  const hmac = crypto.createHmac('sha1', secretBuffer)
  hmac.update(timeBuffer)
  const hash = hmac.digest()

  const offset = hash[hash.length - 1] & 0xf
  const code = (
    ((hash[offset] & 0x7f) << 24) |
    ((hash[offset + 1] & 0xff) << 16) |
    ((hash[offset + 2] & 0xff) << 8) |
    (hash[offset + 3] & 0xff)
  ) % 1000000

  return code.toString().padStart(6, '0')
}

export function verifyTOTP(token: string, secret: string, window: number = 2): boolean {
  for (let i = -window; i <= window; i++) {
    if (generateTOTP(secret, i) === token) {
      return true
    }
  }
  return false
}

export function generateOTPAuthURL(
  secret: string,
  accountName: string,
  issuer: string
): string {
  const params = new URLSearchParams({
    secret,
    issuer,
    algorithm: 'SHA1',
    digits: '6',
    period: '30'
  })
  
  return `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(accountName)}?${params}`
}