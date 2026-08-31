export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })

    const [hardwareCount, licenseCount, consumableCount, hardwareItems, licenseItems, consumableItems, recentMovements] = await Promise.all([
      prisma.hardware.count(),
      prisma.license.count(),
      prisma.consumable.count(),
      prisma.hardware.findMany(),
      prisma.license.findMany(),
      prisma.consumable.findMany(),
      prisma.stockMovement.findMany({ orderBy: { createdAt: 'desc' }, take: 10 }),
    ])

    const hardwareTotal = hardwareItems?.reduce((sum: number, i: any) => sum + (i?.quantity ?? 0), 0) ?? 0
    const licenseTotal = licenseItems?.reduce((sum: number, i: any) => sum + (i?.quantity ?? 0), 0) ?? 0
    const consumableTotal = consumableItems?.reduce((sum: number, i: any) => sum + (i?.quantity ?? 0), 0) ?? 0

    const lowStockItems: any[] = []
    hardwareItems?.forEach((item: any) => {
      if ((item?.quantity ?? 0) <= (item?.lowStockThreshold ?? 5)) {
        lowStockItems.push({ ...item, category: 'HARDWARE', categoryLabel: 'Donanım' })
      }
    })
    licenseItems?.forEach((item: any) => {
      if ((item?.quantity ?? 0) <= (item?.lowStockThreshold ?? 5)) {
        lowStockItems.push({ ...item, category: 'LICENSE', categoryLabel: 'Lisans', name: item?.softwareName })
      }
    })
    consumableItems?.forEach((item: any) => {
      if ((item?.quantity ?? 0) <= (item?.lowStockThreshold ?? 5)) {
        lowStockItems.push({ ...item, category: 'CONSUMABLE', categoryLabel: 'Sarf Malzemesi' })
      }
    })

    // Expiring licenses (within 30 days)
    const now = new Date()
    const thirtyDays = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
    const expiringLicenses = licenseItems?.filter((l: any) => l?.expiryDate && new Date(l.expiryDate) <= thirtyDays) ?? []

    return NextResponse.json({
      counts: { hardware: hardwareCount, license: licenseCount, consumable: consumableCount },
      totals: { hardware: hardwareTotal, license: licenseTotal, consumable: consumableTotal },
      lowStockItems,
      expiringLicenses,
      recentMovements: recentMovements?.map((m: any) => ({
        ...m,
        createdAt: m?.createdAt?.toISOString?.() ?? '',
      })) ?? [],
    })
  } catch (error: any) {
    console.error('Dashboard error:', error)
    return NextResponse.json({ error: 'Veri alınırken hata' }, { status: 500 })
  }
}
