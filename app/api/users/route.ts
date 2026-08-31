export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(users?.map((u: any) => ({ ...u, createdAt: u?.createdAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    console.error('Get users error:', error)
    return NextResponse.json({ error: 'Kullanıcılar alınırken hata oluştu' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })

    if (id === session.user.id) {
      return NextResponse.json({ error: 'Kendinizi silemezsiniz' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Check if target is admin and is the only admin
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Sistemdeki tek yönetici silinemez' }, { status: 400 })
      }
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Kullanıcı silinirken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user || (session.user as any)?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    }
    const body = await request.json()
    const { id, password, role, name, email } = body
    if (!id) return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Prevent last admin demotion
    if (role === 'USER' && targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Sistemdeki tek yöneticinin rolü düşürülemez' }, { status: 400 })
      }
    }

    const data: any = {}
    if (password) {
      if (String(password).length < 6) {
        return NextResponse.json({ error: 'Şifre en az 6 karakter olmalıdır' }, { status: 400 })
      }
      data.password = await bcrypt.hash(String(password), 12)
    }
    if (role && (role === 'ADMIN' || role === 'USER')) {
      data.role = role
    }
    if (name !== undefined) {
      data.name = String(name).trim() || targetUser.username
    }
    if (email !== undefined && String(email).trim()) {
      data.email = String(email).trim()
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
    })
    return NextResponse.json({ ...user, createdAt: user?.createdAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    console.error('Update user error:', error)
    return NextResponse.json({ error: 'Kullanıcı güncellenirken hata oluştu' }, { status: 500 })
  }
}
