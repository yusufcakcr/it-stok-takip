export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { MAX_PAGE_SIZE } from '@/lib/constants'

const CATEGORIES = ['HARDWARE', 'LICENSE', 'CONSUMABLE'] as const
const MOVEMENTS = ['IN', 'OUT'] as const
type Category = (typeof CATEGORIES)[number]

/** Kategoriye göre Prisma modeli ve ürün adını taşıyan alan. */
const MODEL = {
  HARDWARE: { table: 'hardware', nameField: 'name' },
  LICENSE: { table: 'license', nameField: 'softwareName' },
  CONSUMABLE: { table: 'consumable', nameField: 'name' },
} as const

export async function POST(request: Request) {
  try {
    const guard = await requireUser()
    if (guard.error) return guard.error
    const user = guard.user

    const body = await request.json()
    const { itemId, description } = body
    const itemCategory = body.itemCategory as Category
    const movementType = body.movementType as 'IN' | 'OUT'

    if (!itemCategory || !itemId || !movementType || !body.quantity) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 })
    }
    if (!CATEGORIES.includes(itemCategory)) {
      return NextResponse.json({ error: 'Geçersiz ürün kategorisi' }, { status: 400 })
    }
    if (!MOVEMENTS.includes(movementType)) {
      return NextResponse.json({ error: 'Geçersiz hareket tipi' }, { status: 400 })
    }

    const qty = parseInt(body.quantity)
    if (!Number.isFinite(qty) || qty <= 0) {
      return NextResponse.json({ error: 'Miktar 0\'dan büyük olmalı' }, { status: 400 })
    }

    const { table, nameField } = MODEL[itemCategory]
    const delta = movementType === 'IN' ? qty : -qty

    const result = await prisma.$transaction(async (tx) => {
      const model = (tx as any)[table]

      const item = await model.findUnique({ where: { id: itemId } })
      if (!item) throw new Error('Ürün bulunamadı')
      const itemName: string = item[nameField]

      // Okunan değerin üzerine yazmak yerine atomik increment/decrement kullanılır; aksi halde
      // aynı anda gelen iki hareketten biri kaybolur (lost update) ve stok yanlış kalır.
      // Çıkışta stok yetmiyorsa koşullu güncelleme hiçbir satırı etkilemez ve hata verilir.
      if (movementType === 'OUT') {
        const affected = await model.updateMany({
          where: { id: itemId, quantity: { gte: qty } },
          data: { quantity: { decrement: qty } },
        })
        if (affected.count === 0) throw new Error('Yetersiz stok')
      } else {
        await model.update({ where: { id: itemId }, data: { quantity: { increment: qty } } })
      }

      const movement = await tx.stockMovement.create({
        data: {
          itemCategory,
          itemId,
          itemName,
          movementType,
          quantity: qty,
          description: description ? String(description).trim() || null : null,
          userId: user.id,
          userName: user.name ?? user.username ?? '',
        },
      })

      // Şirket kuralı: yönetici işlemleri günlüğe yazılmaz
      if (user.role !== 'ADMIN') {
        await tx.activityLog.create({
          data: {
            userId: user.id,
            userName: user.name ?? user.username ?? '',
            action: movementType === 'IN' ? 'STOK_GIRIS' : 'STOK_CIKIS',
            details: `${itemName} - ${qty} adet ${movementType === 'IN' ? 'giriş' : 'çıkış'} (net ${delta > 0 ? '+' : ''}${delta})`,
            category: itemCategory,
          },
        })
      }

      return movement
    })

    return NextResponse.json({ ...result, createdAt: result?.createdAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    const message = error?.message ?? ''
    if (message === 'Ürün bulunamadı') return NextResponse.json({ error: message }, { status: 404 })
    if (message === 'Yetersiz stok') return NextResponse.json({ error: message }, { status: 400 })
    return serverError('Stock movement error', error, 'Stok hareketi kaydedilemedi')
  }
}

export async function GET(request: Request) {
  try {
    const guard = await requireUser()
    if (guard.error) return guard.error

    const { searchParams } = new URL(request.url)
    const parsed = parseInt(searchParams.get('limit') ?? '')
    const limit = Number.isFinite(parsed) ? Math.min(Math.max(parsed, 1), MAX_PAGE_SIZE) : 100

    const movements = await prisma.stockMovement.findMany({ orderBy: { createdAt: 'desc' }, take: limit })
    return NextResponse.json(movements?.map((m: any) => ({ ...m, createdAt: m?.createdAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    return serverError('Get stock movements error', error, 'Stok hareketleri alınırken hata oluştu')
  }
}
