export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const userCount = await prisma.user.count()

    const body = await request.json()
    const rawEmail = body.email ? String(body.email).trim() : ''
    const rawPassword = body.password ? String(body.password) : ''
    const rawName = body.name ? String(body.name).trim() : ''
    const rawUsername = body.username ? String(body.username).trim() : (rawEmail ? rawEmail.split('@')[0] : '')

    if (!rawEmail || !rawPassword || !rawUsername) {
      return NextResponse.json({ error: 'Lütfen tüm zorunlu alanları doldurun' }, { status: 400 })
    }

    if (rawPassword.length < 6) {
      return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 })
    }

    if (userCount >= 5) {
      return NextResponse.json({ error: 'Maksimum 5 kullanıcı oluşturulabilir' }, { status: 400 })
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

    const hashedPassword = await bcrypt.hash(rawPassword, 12)
    // Public signup is strictly locked to USER role for security
    const user = await prisma.user.create({
      data: {
        email: rawEmail,
        username: rawUsername,
        name: rawName || rawUsername,
        password: hashedPassword,
        role: 'USER',
      },
    })

    return NextResponse.json({ id: user.id, email: user.email, username: user.username, role: user.role })
  } catch (error: any) {
    console.error('Signup error:', error)
    return NextResponse.json({ error: 'Kullanıcı oluşturulurken bir hata oluştu' }, { status: 500 })
  }
}
