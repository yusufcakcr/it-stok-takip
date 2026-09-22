export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { MAX_PAGE_SIZE } from '@/lib/constants'

/** İşlem günlüğü tüm kullanıcıların hareketini içerdiği için yalnızca yöneticiye açıktır. */
export async function GET(request: Request) {
  try {
    const guard = await requireUser({ admin: true })
    if (guard.error) return guard.error

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const startDate = searchParams.get('startDate')
    const endDate = searchParams.get('endDate')
    const action = searchParams.get('action')

    const where: any = {}
    if (userId) where.userId = userId
    if (category) where.category = category
    if (action) where.action = { contains: action, mode: 'insensitive' }
    if (startDate || endDate) {
      where.createdAt = {}
      // Geçersiz tarih parametresi Prisma'da 500'e yol açtığı için burada elenir
      const from = startDate ? new Date(startDate) : null
      const to = endDate ? new Date(`${endDate}T23:59:59.999Z`) : null
      if (from && !Number.isNaN(from.getTime())) where.createdAt.gte = from
      if (to && !Number.isNaN(to.getTime())) where.createdAt.lte = to
      if (!Object.keys(where.createdAt).length) delete where.createdAt
    }

    const logs = await prisma.activityLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: MAX_PAGE_SIZE,
    })

    return NextResponse.json(logs?.map((l: any) => ({ ...l, createdAt: l?.createdAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    return serverError('Get logs error', error, 'İşlem günlüğü alınırken hata oluştu')
  }
}
