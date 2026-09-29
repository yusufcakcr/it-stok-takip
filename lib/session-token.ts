import { createHash } from 'node:crypto'
import type { JWT } from 'next-auth/jwt'

/** Oturum jetonunu doğrulamak için veritabanından okunan kullanıcı alanları. */
export type TokenUser = {
  role: 'ADMIN' | 'USER'
  username: string
  name: string | null
  email: string
  password: string
}

/**
 * Parola hash'inin kısa özeti. Jetona (Auth.js'te şifreli JWE) konur; parola değişince özet
 * değişir ve eski oturumlar düşer. Hash'in kendisi jetona yazılmaz.
 */
export function passwordFingerprint(passwordHash: string): string {
  return createHash('sha256').update(passwordHash).digest('hex').slice(0, 16)
}

/**
 * Her istekte jetonu veritabanındaki kullanıcıyla eşitler. Jeton yalnız girişte doldurulsaydı
 * silinen kullanıcı, rolü düşürülen yönetici veya parolası değişen hesap oturum süresi (30 gün)
 * boyunca erişimini korurdu.
 *
 * `null` dönerse Auth.js oturumu geçersiz sayar.
 */
export function syncToken(token: JWT, dbUser: TokenUser | null): JWT | null {
  if (!dbUser) return null
  if (token.pwd !== passwordFingerprint(dbUser.password)) return null

  token.role = dbUser.role
  token.username = dbUser.username
  token.name = dbUser.name ?? dbUser.username
  token.email = dbUser.email
  return token
}
