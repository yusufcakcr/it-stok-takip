import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export type SessionUser = {
  id: string
  name?: string | null
  email?: string | null
  role: 'ADMIN' | 'USER'
  username: string
}

/**
 * API rotaları için tek noktadan oturum/rol kontrolü. middleware.ts ilk savunma hattı;
 * burası rotanın kendi içinde de garanti verir (middleware matcher'ı değişse bile açık kalmaz).
 *
 * Kullanım:  const guard = await requireUser();  if (guard.error) return guard.error
 */
export async function requireUser(options: { admin?: boolean } = {}) {
  const session = await auth()
  const user = session?.user as SessionUser | undefined

  if (!user?.id) {
    return { user: null, error: NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 }) } as const
  }
  if (options.admin && user.role !== 'ADMIN') {
    return { user: null, error: NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gerekir' }, { status: 403 }) } as const
  }
  return { user, error: null } as const
}

/** Beklenmeyen hatalarda ayrıntıyı sunucuda tutup istemciye sabit mesaj döner. */
export function serverError(context: string, error: unknown, message: string) {
  console.error(`${context}:`, error)
  return NextResponse.json({ error: message }, { status: 500 })
}
