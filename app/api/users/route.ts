export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { serialize, serializeAll } from '@/lib/serialize'
import { parseBody, readJson, userUpdateSchema } from '@/lib/validation'
import bcrypt from 'bcryptjs'

const PUBLIC_FIELDS = { id: true, email: true, username: true, name: true, role: true, createdAt: true } as const

export async function GET() {
  try {
    const guard = await requireUser({ admin: true })
    if (guard.error) return guard.error

    const users = await prisma.user.findMany({ select: PUBLIC_FIELDS, orderBy: { createdAt: 'asc' } })
    return NextResponse.json(serializeAll(users))
  } catch (error) {
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
  } catch (error) {
    return serverError('Delete user error', error, 'Kullanıcı silinirken hata oluştu')
  }
}

export async function PUT(request: Request) {
  try {
    const guard = await requireUser({ admin: true })
    if (guard.error) return guard.error

    const body = await readJson(request)
    if (body === null) return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    const parsed = parseBody(userUpdateSchema, body)
    if (parsed.error !== null) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { id, password, role, name, email } = parsed.data

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

    const data: Prisma.UserUpdateInput = {}
    if (password) data.password = await bcrypt.hash(password, 12)
    if (role) data.role = role
    if (name !== undefined) data.name = name || targetUser.username
    if (email) {
      // E-posta benzersiz; çakışmayı Prisma hatası yerine anlaşılır mesajla bildir
      const clash = await prisma.user.findFirst({ where: { email, NOT: { id } } })
      if (clash) return NextResponse.json({ error: 'Bu e-posta başka bir kullanıcıda kayıtlı' }, { status: 400 })
      data.email = email
    }

    if (!Object.keys(data).length) {
      return NextResponse.json({ error: 'Güncellenecek alan yok' }, { status: 400 })
    }

    const user = await prisma.user.update({ where: { id }, data, select: PUBLIC_FIELDS })
    return NextResponse.json(serialize(user))
  } catch (error) {
    return serverError('Update user error', error, 'Kullanıcı güncellenirken hata oluştu')
  }
}
