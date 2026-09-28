export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { MAX_USERS } from '@/lib/constants'
import { serverError, type SessionUser } from '@/lib/api-auth'
import { parseBody, readJson, signupSchema } from '@/lib/validation'

/**
 * Kullanıcı oluşturma. İki meşru durum vardır:
 *  1) İlk kurulum — sistemde hiç kullanıcı yokken herkes ilk hesabı açabilir ve bu hesap ADMIN olur.
 *  2) Yönetici daveti — sistemde kullanıcı varsa yalnızca ADMIN yeni kullanıcı ekleyebilir.
 * Kayıt herkese açık bırakılırsa uygulamanın adresini bilen biri envantere erişebilir.
 */

// İlk kurulum gerekli mi? (login sayfası buna göre kurulum bağlantısı gösterir)
export async function GET() {
  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({ setupRequired: userCount === 0 })
  } catch (error) {
    return serverError('Signup status error', error, 'Durum bilgisi alınamadı')
  }
}

export async function POST(request: Request) {
  try {
    const userCount = await prisma.user.count()
    const isBootstrap = userCount === 0

    // İlk kurulum değilse yalnızca yönetici kullanıcı ekleyebilir
    if (!isBootstrap) {
      const session = await auth()
      const user = session?.user as SessionUser | undefined
      if (user?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
      }
    }

    const body = await readJson(request)
    if (body === null) return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    const parsed = parseBody(signupSchema, body)
    if (parsed.error !== null) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { email, password, name, username, role: requestedRole } = parsed.data

    if (userCount >= MAX_USERS) {
      return NextResponse.json({ error: `Maksimum ${MAX_USERS} kullanıcı oluşturulabilir` }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] } })
    if (existingUser) {
      return NextResponse.json({ error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' }, { status: 400 })
    }

    // İlk kullanıcı ADMIN olur; sonrasında rolü yalnızca yönetici belirleyebilir
    const role = isBootstrap ? 'ADMIN' : requestedRole

    const user = await prisma.user.create({
      data: { email, username, name: name || username, password: await bcrypt.hash(password, 12), role },
    })

    return NextResponse.json({ id: user.id, email: user.email, username: user.username, role: user.role })
  } catch (error) {
    return serverError('Signup error', error, 'Kullanıcı oluşturulurken bir hata oluştu')
  }
}
