import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getToken } from 'next-auth/jwt'

/**
 * Rota bazlı koruma (Next 16 proxy). Sayfa ve API korumaları kendi dosyalarında da var; buradaki katman
 * oturumsuz isteğin uygulamaya hiç girmemesini ve yönetim sayfalarının normal kullanıcıya
 * hiç render edilmemesini sağlar.
 */
const PUBLIC_PATHS = ['/login', '/signup']
const ADMIN_PATHS = ['/admin', '/logs', '/api/users', '/api/logs']

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) {
    return NextResponse.next()
  }

  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
    secureCookie: process.env.NODE_ENV === 'production',
  })

  const isApi = pathname.startsWith('/api/')

  if (!token) {
    if (isApi) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const url = new URL('/login', request.url)
    url.searchParams.set('callbackUrl', pathname)
    return NextResponse.redirect(url)
  }

  const needsAdmin = ADMIN_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))
  if (needsAdmin && (token as any).role !== 'ADMIN') {
    if (isApi) return NextResponse.json({ error: 'Bu işlem için yönetici yetkisi gerekir' }, { status: 403 })
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  return NextResponse.next()
}

// Statik dosyalar, next-auth uçları ve ilk kurulum uçları hariç her şey kontrol edilir.
export const config = {
  matcher: ['/((?!api/auth|api/signup|_next/static|_next/image|favicon.svg|og-image.png).*)'],
}
