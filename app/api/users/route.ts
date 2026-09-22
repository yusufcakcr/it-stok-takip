export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { MIN_PASSWORD_LENGTH } from '@/lib/constants'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const guard = await requireUser({ admin: true })
    if (guard.error) return guard.error

    const users = await prisma.user.findMany({
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    })
    return NextResponse.json(users?.map((u: any) => ({ ...u, createdAt: u?.createdAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    return serverError('Get users error', error, 'Kullanıcılar alınırken hata oluştu')
  }
}

export async function DELETE(request: Request) {
  try {
    const guard = await requireUser({ admin: true })
    if (guard.error) return guard.error

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })

    if (id === guard.user.id) {
      return NextResponse.json({ error: 'Kendinizi silemezsiniz' }, { status: 400 })
    }

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Sistemde en az bir yönetici kalmalı
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Sistemdeki tek yönetici silinemez' }, { status: 400 })
      }
    }

    await prisma.user.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return serverError('Delete user error', error, 'Kullanıcı silinirken hata oluştu')
  }
}

export async function PUT(request: Request) {
  try {
    const guard = await requireUser({ admin: true })
    if (guard.error) return guard.error

    const body = await request.json()
    const { id, password, role, name, email } = body
    if (!id) return NextResponse.json({ error: 'Kullanıcı ID gerekli' }, { status: 400 })

    const targetUser = await prisma.user.findUnique({ where: { id } })
    if (!targetUser) {
      return NextResponse.json({ error: 'Kullanıcı bulunamadı' }, { status: 404 })
    }

    // Son yöneticinin rolü düşürülemez (kendi rolünü düşürme dahil)
    if (role === 'USER' && targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (adminCount <= 1) {
        return NextResponse.json({ error: 'Sistemdeki tek yöneticinin rolü düşürülemez' }, { status: 400 })
      }
    }

    const data: any = {}
    if (password) {
      if (String(password).length < MIN_PASSWORD_LENGTH) {
        return NextResponse.json({ error: `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır` }, { status: 400 })
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
      const nextEmail = String(email).trim().toLowerCase()
      // E-posta benzersiz; çakışmayı Prisma hatası yerine anlaşılır mesajla bildir
      const clash = await prisma.user.findFirst({ where: { email: nextEmail, NOT: { id } } })
      if (clash) return NextResponse.json({ error: 'Bu e-posta başka bir kullanıcıda kayıtlı' }, { status: 400 })
      data.email = nextEmail
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }

    const user = await prisma.user.update({
      where: { id },
      data,
      select: { id: true, email: true, username: true, name: true, role: true, createdAt: true },
    })
    return NextResponse.json({ ...user, createdAt: user?.createdAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    return serverError('Update user error', error, 'Kullanıcı güncellenirken hata oluştu')
  }
}
