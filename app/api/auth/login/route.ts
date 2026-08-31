export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: 'Kullanıcı adı ve şifre gerekli' }, { status: 400 })
    }

    const user = await prisma.user.findFirst({
      where: { OR: [{ email }, { username: email }] }
    })

    if (!user) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) {
      return NextResponse.json({ error: 'Şifre hatalı' }, { status: 401 })
    }

    return NextResponse.json({ id: user.id, email: user.email, role: user.role, username: user.username })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Giriş hatası' }, { status: 500 })
  }
}
