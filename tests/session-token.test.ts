import { describe, expect, it } from 'vitest'
import type { JWT } from 'next-auth/jwt'
import { passwordFingerprint, syncToken, type TokenUser } from '@/lib/session-token'

const dbUser: TokenUser = {
  role: 'ADMIN',
  username: 'ahmet',
  name: 'Ahmet',
  email: 'ahmet@example.com',
  password: '$2a$12$eskiHash',
}

const tokenFor = (user: TokenUser): JWT => ({
  id: 'u1',
  role: user.role,
  username: user.username,
  pwd: passwordFingerprint(user.password),
})

describe('oturum jetonu eşitleme', () => {
  it('silinen kullanıcının oturumu düşer', () => {
    expect(syncToken(tokenFor(dbUser), null)).toBeNull()
  })

  it('rolü düşürülen yöneticinin jetonu hemen USER olur', () => {
    const token = tokenFor(dbUser)
    expect(syncToken(token, { ...dbUser, role: 'USER' })?.role).toBe('USER')
  })

  it('parola değişince eski oturum düşer', () => {
    expect(syncToken(tokenFor(dbUser), { ...dbUser, password: '$2a$12$yeniHash' })).toBeNull()
  })

  it('parola özeti olmayan eski jeton geçersizdir', () => {
    const { pwd: _pwd, ...legacy } = tokenFor(dbUser)
    expect(syncToken(legacy as JWT, dbUser)).toBeNull()
  })

  it('değişiklik yoksa jeton geçerli kalır, ad ve e-posta güncellenir', () => {
    const synced = syncToken(tokenFor(dbUser), { ...dbUser, name: null, email: 'yeni@example.com' })
    expect(synced).toMatchObject({ id: 'u1', role: 'ADMIN', name: 'ahmet', email: 'yeni@example.com' })
  })

  it('özet hash değildir ve hash değişince değişir', () => {
    const fp = passwordFingerprint(dbUser.password)
    expect(fp).toHaveLength(16)
    expect(fp).not.toContain('$2a$')
    expect(passwordFingerprint('$2a$12$yeniHash')).not.toBe(fp)
  })
})
