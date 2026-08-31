export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

export async function GET(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 })
    
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')

    const where: any = {}
    if (userId) where.userId = userId
    if (category) where.category = category
    if (action) where.action = { contains: action }
    if (startDate || endDate) {
      where.createdAt = {}
      if (startDate) where.createdAt.gte = new Date(startDate)
      if (endDate) where.createdAt.lte = new Date(endDate + 'T23:59:59.999Z')
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 500,
    })

    return NextResponse.json(logs?.map((l: any) => ({ ...l, createdAt: l?.createdAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: 'Hata' }, { status: 500 })
  }
}
