export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { auth } from '@/auth'

async function logActivity(session: any, action: string, details: string) {
  if (session?.user && (session.user as any)?.role !== 'ADMIN') {
    await prisma.activityLog.create({
      data: {
        userId: session.user.id,
        userName: session.user.name ?? (session.user as any)?.username ?? '',
        action,
        details,
        category: 'LICENSE',
      },
    })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const items = await prisma.license.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(items?.map((i: any) => ({ ...i, createdAt: i?.createdAt?.toISOString?.() ?? '', updatedAt: i?.updatedAt?.toISOString?.() ?? '', expiryDate: i?.expiryDate?.toISOString?.() ?? null })) ?? [])
  } catch (error: any) {
    console.error('Get licenses error:', error)
    return NextResponse.json({ error: 'Lisans listesi alınırken hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const body = await request.json()

    const softwareName = body.softwareName ? String(body.softwareName).trim() : ''
    if (!softwareName) {
      return NextResponse.json({ error: 'Yazılım adı zorunludur' }, { status: 400 })
    }

    const qty = parseInt(body.quantity) || 0
    if (qty < 0) {
      return NextResponse.json({ error: 'Adet negatif olamaz' }, { status: 400 })
    }

    const threshold = body.lowStockThreshold !== undefined ? parseInt(body.lowStockThreshold) : 5
    if (isNaN(threshold) || threshold < 0) {
      return NextResponse.json({ error: 'Düşük stok eşiği geçerli bir pozitif sayı olmalıdır' }, { status: 400 })
    }

    const item = await prisma.license.create({
      data: {
        softwareName,
        licenseKey: body.licenseKey ? String(body.licenseKey).trim() : null,
        quantity: qty,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        notes: body.notes ? String(body.notes).trim() : null,
        lowStockThreshold: threshold,
      },
    })
    await logActivity(session, 'LISANS_EKLE', `${item.softwareName} eklendi (${qty} adet)`)
    return NextResponse.json({ ...item, createdAt: item?.createdAt?.toISOString?.() ?? '', updatedAt: item?.updatedAt?.toISOString?.() ?? '', expiryDate: item?.expiryDate?.toISOString?.() ?? null })
  } catch (error: any) {
    console.error('Create license error:', error)
    return NextResponse.json({ error: 'Lisans eklenirken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Lisans ID zorunludur' }, { status: 400 })
    }

    const existing = await prisma.license.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Güncellenecek lisans bulunamadı' }, { status: 404 })
    }

    const softwareName = body.softwareName ? String(body.softwareName).trim() : existing.softwareName
    if (!softwareName) {
      return NextResponse.json({ error: 'Yazılım adı boş bırakılamaz' }, { status: 400 })
    }

    const qty = body.quantity !== undefined ? parseInt(body.quantity) : existing.quantity
    if (qty < 0) {
      return NextResponse.json({ error: 'Adet negatif olamaz' }, { status: 400 })
    }

    const threshold = body.lowStockThreshold !== undefined ? parseInt(body.lowStockThreshold) : existing.lowStockThreshold
    if (isNaN(threshold) || threshold < 0) {
      return NextResponse.json({ error: 'Düşük stok eşiği geçerli bir pozitif sayı olmalıdır' }, { status: 400 })
    }

    const item = await prisma.license.update({
      where: { id: body.id },
      data: {
        softwareName,
        licenseKey: body.licenseKey !== undefined ? (body.licenseKey ? String(body.licenseKey).trim() : null) : existing.licenseKey,
        quantity: qty,
        expiryDate: body.expiryDate !== undefined ? (body.expiryDate ? new Date(body.expiryDate) : null) : existing.expiryDate,
        notes: body.notes !== undefined ? (body.notes ? String(body.notes).trim() : null) : existing.notes,
        lowStockThreshold: threshold,
      },
    })
    await logActivity(session, 'LISANS_GUNCELLE', `${item.softwareName} güncellendi`)
    return NextResponse.json({ ...item, createdAt: item?.createdAt?.toISOString?.() ?? '', updatedAt: item?.updatedAt?.toISOString?.() ?? '', expiryDate: item?.expiryDate?.toISOString?.() ?? null })
  } catch (error: any) {
    console.error('Update license error:', error)
    return NextResponse.json({ error: 'Lisans güncellenirken hata oluştu' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Lisans ID gerekli' }, { status: 400 })

    const existing = await prisma.license.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Silinecek lisans bulunamadı' }, { status: 404 })
    }

    const item = await prisma.license.delete({ where: { id } })
    await logActivity(session, 'LISANS_SIL', `${item.softwareName} silindi`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete license error:', error)
    return NextResponse.json({ error: 'Lisans silinirken hata oluştu' }, { status: 500 })
  }
}
