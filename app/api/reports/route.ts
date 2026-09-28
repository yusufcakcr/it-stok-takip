export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { serialize, serializeAll } from '@/lib/serialize'
import { CATEGORY_LABELS, isLowStock } from '@/lib/stock'
import { parseDateParam } from '@/lib/validation'

export async function GET(request: Request) {
  try {
    const guard = await requireUser()
    if (guard.error) return guard.error

    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'stock'

    if (type === 'stock') {
      const [hardware, licenses, consumables] = await Promise.all([
        prisma.hardware.findMany({ orderBy: { name: 'asc' } }),
        prisma.license.findMany({ orderBy: { softwareName: 'asc' } }),
        prisma.consumable.findMany({ orderBy: { name: 'asc' } }),
      ])
      return NextResponse.json({
        hardware: serializeAll(hardware),
        licenses: serializeAll(licenses),
        consumables: serializeAll(consumables),
      })
    }

    if (type === 'movements') {
      const gte = parseDateParam(searchParams.get('startDate'))
      const lte = parseDateParam(searchParams.get('endDate'), true)
      const where: Prisma.StockMovementWhereInput = gte || lte ? { createdAt: { gte, lte } } : {}
      const movements = await prisma.stockMovement.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 })
      return NextResponse.json(serializeAll(movements))
    }

    if (type === 'lowstock') {
      const [hardware, licenses, consumables] = await Promise.all([
        prisma.hardware.findMany(),
        prisma.license.findMany(),
        prisma.consumable.findMany(),
      ])
      return NextResponse.json([
        ...hardware.filter(isLowStock).map((i) => ({ ...serialize(i), category: CATEGORY_LABELS.HARDWARE, itemName: i.name })),
        ...licenses.filter(isLowStock).map((i) => ({ ...serialize(i), category: CATEGORY_LABELS.LICENSE, itemName: i.softwareName })),
        ...consumables.filter(isLowStock).map((i) => ({ ...serialize(i), category: CATEGORY_LABELS.CONSUMABLE, itemName: i.name })),
      ])
    }

    return NextResponse.json({ error: 'Geçersiz rapor tipi' }, { status: 400 })
  } catch (error) {
    return serverError('Reports error', error, 'Rapor oluşturulurken hata oluştu')
  }
}
