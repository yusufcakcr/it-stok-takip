export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const body = await request.json()
    const { itemCategory, itemId, movementType, quantity, description } = body

    if (!itemCategory || !itemId || !movementType || !quantity) {
      return NextResponse.json({ error: 'Eksik alanlar' }, { status: 400 })
    }

    const qty = parseInt(quantity)
    if (qty <= 0) return NextResponse.json({ error: 'Miktar 0\'dan büyük olmalı' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      let itemName = ''
      const delta = movementType === 'IN' ? qty : -qty

      if (itemCategory === 'HARDWARE') {
        const item = await tx.hardware.findUnique({ where: { id: itemId } })
        if (!item) throw new Error('Ürün bulunamadı')
        if (movementType === 'OUT' && (item?.quantity ?? 0) < qty) {
          throw new Error('Yetersiz stok')
        }
        itemName = item.name
        await tx.hardware.update({ where: { id: itemId }, data: { quantity: (item?.quantity ?? 0) + delta } })
      } else if (itemCategory === 'LICENSE') {
        const item = await tx.license.findUnique({ where: { id: itemId } })
        if (!item) throw new Error('Ürün bulunamadı')
        if (movementType === 'OUT' && (item?.quantity ?? 0) < qty) {
          throw new Error('Yetersiz stok')
        }
        itemName = item.softwareName
        await tx.license.update({ where: { id: itemId }, data: { quantity: (item?.quantity ?? 0) + delta } })
      } else if (itemCategory === 'CONSUMABLE') {
        const item = await tx.consumable.findUnique({ where: { id: itemId } })
        if (!item) throw new Error('Ürün bulunamadı')
        if (movementType === 'OUT' && (item?.quantity ?? 0) < qty) {
          throw new Error('Yetersiz stok')
        }
        itemName = item.name
        await tx.consumable.update({ where: { id: itemId }, data: { quantity: (item?.quantity ?? 0) + delta } })
      }

      const movement = await tx.stockMovement.create({
        data: {
          itemCategory,
          itemId,
          itemName,
          movementType,
          quantity: qty,
          description: description || null,
          userId: session.user.id,
          userName: session.user.name ?? (session.user as any)?.username ?? '',
        },
      })

      // Log for non-admin
      if ((session.user as any)?.role !== 'ADMIN') {
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            userName: session.user.name ?? (session.user as any)?.username ?? '',
            action: movementType === 'IN' ? 'STOK_GIRIS' : 'STOK_CIKIS',
            details: `${itemName} - ${qty} adet ${movementType === 'IN' ? 'giriş' : 'çıkış'}`,
            category: itemCategory,
          },
        })
      }

      return movement
    })

    return NextResponse.json({ ...result, createdAt: result?.createdAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    const message = error?.message ?? 'Stok hareketi kaydedilemedi'
    const status = ['Ürün bulunamadı'].includes(message) ? 404 : ['Yetersiz stok'].includes(message) ? 400 : 500
    console.error('Stock movement error:', error)
    return NextResponse.json({ error: message }, { status })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    const movements = await prisma.stockMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
    return NextResponse.json(movements?.map((m: any) => ({ ...m, createdAt: m?.createdAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Hata' }, { status: 500 })
  }
}
