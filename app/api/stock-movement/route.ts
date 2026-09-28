export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { displayName, logActivity } from '@/lib/activity'
import { MAX_PAGE_SIZE } from '@/lib/constants'
import { serialize, serializeAll } from '@/lib/serialize'
import { parseBody, readJson, stockMovementSchema } from '@/lib/validation'

type Category = 'HARDWARE' | 'LICENSE' | 'CONSUMABLE'
type Tx = Prisma.TransactionClient

class MovementError extends Error {
  constructor(message: string, readonly status: number) {
    super(message)
  }
}

/**
 * Kategoriye göre ürünün adını okur ve stoğu atomik olarak değiştirir.
 * Okunan değerin üzerine yazmak yerine increment/decrement kullanılır; aksi halde aynı anda gelen
 * iki hareketten biri kaybolur (lost update). Çıkışta stok yetmiyorsa koşullu güncelleme hiçbir
 * satırı etkilemez ve hata verilir.
 */
async function applyMovement(tx: Tx, category: Category, id: string, delta: number): Promise<string> {
  const quantity = delta < 0 ? { decrement: -delta } : { increment: delta }
  const where = delta < 0 ? { id, quantity: { gte: -delta } } : { id }

  let name: string | undefined
  let affected: number
  switch (category) {
    case 'HARDWARE':
      name = (await tx.hardware.findUnique({ where: { id }, select: { name: true } }))?.name
      affected = name === undefined ? 0 : (await tx.hardware.updateMany({ where, data: { quantity } })).count
      break
    case 'LICENSE':
      name = (await tx.license.findUnique({ where: { id }, select: { softwareName: true } }))?.softwareName
      affected = name === undefined ? 0 : (await tx.license.updateMany({ where, data: { quantity } })).count
      break
    case 'CONSUMABLE':
      name = (await tx.consumable.findUnique({ where: { id }, select: { name: true } }))?.name
      affected = name === undefined ? 0 : (await tx.consumable.updateMany({ where, data: { quantity } })).count
      break
  }
  if (name === undefined) throw new MovementError('Ürün bulunamadı', 404)
  if (affected === 0) throw new MovementError('Yetersiz stok', 400)
  return name
}

export async function POST(request: Request) {
  try {
    const guard = await requireUser()
    if (guard.error) return guard.error
    const user = guard.user

    const body = await readJson(request)
    if (body === null) return NextResponse.json({ error: 'Geçersiz istek gövdesi' }, { status: 400 })
    const parsed = parseBody(stockMovementSchema, body)
    if (parsed.error !== null) return NextResponse.json({ error: parsed.error }, { status: 400 })
    const { itemCategory, itemId, movementType, quantity: qty, description } = parsed.data
    const delta = movementType === 'IN' ? qty : -qty

    const result = await prisma.$transaction(async (tx) => {
      const itemName = await applyMovement(tx, itemCategory, itemId, delta)

      const movement = await tx.stockMovement.create({
        data: { itemCategory, itemId, itemName, movementType, quantity: qty, description, userId: user.id, userName: displayName(user) },
      })

      await logActivity(user, {
        action: movementType === 'IN' ? 'STOK_GIRIS' : 'STOK_CIKIS',
        details: `${itemName} - ${qty} adet ${movementType === 'IN' ? 'giriş' : 'çıkış'} (net ${delta > 0 ? '+' : ''}${delta})`,
        category: itemCategory,
      }, tx)

      return movement
    })

    return NextResponse.json(serialize(result))
  } catch (error) {
    if (error instanceof MovementError) return NextResponse.json({ error: error.message }, { status: error.status })
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
    return NextResponse.json(serializeAll(movements))
  } catch (error) {
    return serverError('Get stock movements error', error, 'Stok hareketleri alınırken hata oluştu')
  }
}
