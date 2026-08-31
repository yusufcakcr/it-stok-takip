export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') ?? 'stock'
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')

    if (type === 'stock') {
      const [hardware, licenses, consumables] = await Promise.all([
        prisma.hardware.findMany({ orderBy: { name: 'asc' } }),
        prisma.license.findMany({ orderBy: { softwareName: 'asc' } }),
        prisma.consumable.findMany({ orderBy: { name: 'asc' } }),
      ])
      return NextResponse.json({
        hardware: hardware?.map((i: any) => ({ ...i, createdAt: i?.createdAt?.toISOString?.() ?? '', updatedAt: i?.updatedAt?.toISOString?.() ?? '' })) ?? [],
        licenses: licenses?.map((i: any) => ({ ...i, createdAt: i?.createdAt?.toISOString?.() ?? '', updatedAt: i?.updatedAt?.toISOString?.() ?? '', expiryDate: i?.expiryDate?.toISOString?.() ?? null })) ?? [],
        consumables: consumables?.map((i: any) => ({ ...i, createdAt: i?.createdAt?.toISOString?.() ?? '', updatedAt: i?.updatedAt?.toISOString?.() ?? '' })) ?? [],
      })
    } else if (type === 'movements') {
      const where: any = {}
      if (startDate || endDate) {
        where.createdAt = {}
        if (startDate) where.createdAt.gte = new Date(startDate)
        if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
      }
      const movements = await prisma.stockMovement.findMany({ where, orderBy: { createdAt: 'desc' }, take: 1000 })
      return NextResponse.json(movements?.map((m: any) => ({ ...m, createdAt: m?.createdAt?.toISOString?.() ?? '' })) ?? [])
    } else if (type === 'lowstock') {
      const [hardware, licenses, consumables] = await Promise.all([
        prisma.hardware.findMany(),
        prisma.license.findMany(),
        prisma.consumable.findMany(),
      ])
      const items: any[] = []
      hardware?.forEach((i: any) => {
        if ((i?.quantity ?? 0) <= (i?.lowStockThreshold ?? 5)) items.push({ ...i, category: 'Donanım', itemName: i.name })
      })
      licenses?.forEach((i: any) => {
        if ((i?.quantity ?? 0) <= (i?.lowStockThreshold ?? 5)) items.push({ ...i, category: 'Lisans', itemName: i.softwareName })
      })
      consumables?.forEach((i: any) => {
        if ((i?.quantity ?? 0) <= (i?.lowStockThreshold ?? 5)) items.push({ ...i, category: 'Sarf Malzemesi', itemName: i.name })
      })
      return NextResponse.json(items)
    }

    return NextResponse.json({ error: 'Geçersiz rapor tipi' }, { status: 400 })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Hata' }, { status: 500 })
  }
}
