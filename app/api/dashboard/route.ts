export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { serialize, serializeAll } from '@/lib/serialize'
import { CATEGORY_LABELS, expiringWithin, isLowStock, totalQuantity } from '@/lib/stock'

export async function GET() {
  try {
    const guard = await requireUser()
    if (guard.error) return guard.error

    const [hardware, licenses, consumables, recentMovements] = await Promise.all([
      prisma.hardware.findMany(),
      prisma.license.findMany(),
      prisma.consumable.findMany(),
      prisma.stockMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ])

    const lowStockItems = [
      ...hardware.filter(isLowStock).map((i) => ({ ...serialize(i), category: 'HARDWARE' as const, categoryLabel: CATEGORY_LABELS.HARDWARE })),
      ...licenses.filter(isLowStock).map((i) => ({ ...serialize(i), category: 'LICENSE' as const, categoryLabel: CATEGORY_LABELS.LICENSE, name: i.softwareName })),
      ...consumables.filter(isLowStock).map((i) => ({ ...serialize(i), category: 'CONSUMABLE' as const, categoryLabel: CATEGORY_LABELS.CONSUMABLE })),
    ]

    return NextResponse.json({
      counts: { hardware: hardware.length, license: licenses.length, consumable: consumables.length },
      totals: { hardware: totalQuantity(hardware), license: totalQuantity(licenses), consumable: totalQuantity(consumables) },
      lowStockItems,
      expiringLicenses: serializeAll(expiringWithin(licenses, 30)),
      recentMovements: serializeAll(recentMovements),
    })
  } catch (error) {
    return serverError('Dashboard error', error, 'Veri alınırken hata')
  }
}
