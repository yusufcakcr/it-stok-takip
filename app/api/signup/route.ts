export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'
import { MAX_USERS, MIN_PASSWORD_LENGTH } from '@/lib/constants'

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
  } catch (error: any) {
    console.error('Signup status error:', error)
    return NextResponse.json({ error: 'Durum bilgisi alınamadı' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const userCount = await prisma.user.count()
    const isBootstrap = userCount === 0

    // İlk kurulum değilse yalnızca yönetici kullanıcı ekleyebilir
    if (!isBootstrap) {
      const session = await auth()
      if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 403 })
      }
    }

    const body = await request.json()
    const rawEmail = body.email ? String(body.email).trim().toLowerCase() : ''
    const rawPassword = body.password ? String(body.password) : ''
    const rawName = body.name ? String(body.name).trim() : ''
    const rawUsername = body.username ? String(body.username).trim() : (rawEmail ? rawEmail.split('@')[0] : '')

    if (!rawEmail || !rawPassword || !rawUsername) {
      return NextResponse.json({ error: 'Lütfen tüm zorunlu alanları doldurun' }, { status: 400 })
    }

    if (rawPassword.length < MIN_PASSWORD_LENGTH) {
      return NextResponse.json({ error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır` }, { status: 400 })
    }

    if (userCount >= MAX_USERS) {
      return NextResponse.json({ error: `Maksimum ${MAX_USERS} kullanıcı oluşturulabilir` }, { status: 400 })
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: rawEmail },
          { username: rawUsername }
        ]
      }
    })
    if (existingUser) {
      return NextResponse.json({ error: 'Bu kullanıcı adı veya e-posta zaten kullanılıyor' }, { status: 400 })
    }

    // İlk kullanıcı ADMIN olur; sonrasında rolü yalnızca yönetici belirleyebilir
    const requestedRole = body.role === 'ADMIN' ? 'ADMIN' : 'USER'
    const role = isBootstrap ? 'ADMIN' : requestedRole

    const hashedPassword = await bcrypt.hash(rawPassword, 12)
    const user = await prisma.user.create({
      data: {
        email: rawEmail,
        username: rawUsername,
        name: rawName || rawUsername,
        password: hashedPassword,
        role,
      },
    })

    return NextResponse.json({ id: user.id, email: user.email, username: user.username, role: user.role })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Kullanıcı oluşturulurken bir hata oluştu' }, { status: 500 })
  }
}
