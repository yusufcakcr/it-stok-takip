export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import { requireUser, serverError } from '@/lib/api-auth'
import { MAX_PAGE_SIZE } from '@/lib/constants'
import { serializeAll } from '@/lib/serialize'
import { parseDateParam } from '@/lib/validation'

/** İşlem günlüğü tüm kullanıcıların hareketini içerdiği için yalnızca yöneticiye açıktır. */
export async function GET(request: Request) {
  try {
    const guard = await requireUser({ admin: true })
    if (guard.error) return guard.error

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const category = searchParams.get('category')
    const action = searchParams.get('action')
    const gte = parseDateParam(searchParams.get('startDate'))
    const lte = parseDateParam(searchParams.get('endDate'), true)

    const where: Prisma.ActivityLogWhereInput = {
      ...(userId ? { userId } : {}),
      ...(category ? { category } : {}),
      ...(action ? { action: { contains: action, mode: 'insensitive' as const } } : {}),
      ...(gte || lte ? { createdAt: { gte, lte } } : {}),
    }

    const logs = await prisma.activityLog.findMany({ where, orderBy: { createdAt: 'desc' }, take: MAX_PAGE_SIZE })
    return NextResponse.json(serializeAll(logs))
  } catch (error) {
    return serverError('Get logs error', error, 'İşlem günlüğü alınırken hata oluştu')
  }
}
