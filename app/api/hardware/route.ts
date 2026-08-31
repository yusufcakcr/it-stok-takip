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
        category: 'HARDWARE',
      },
    })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const items = await prisma.hardware.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(items?.map((i: any) => ({ ...i, createdAt: i?.createdAt?.toISOString?.() ?? '', updatedAt: i?.updatedAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    console.error('Get hardware error:', error)
    return NextResponse.json({ error: 'Donanım listesi alınırken hata oluştu' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const body = await request.json()

    const name = body.name ? String(body.name).trim() : ''
    if (!name) {
      return NextResponse.json({ error: 'Ürün adı zorunludur' }, { status: 400 })
    }

    const qty = parseInt(body.quantity) || 0
    if (qty < 0) {
      return NextResponse.json({ error: 'Adet negatif olamaz' }, { status: 400 })
    }

    const threshold = body.lowStockThreshold !== undefined ? parseInt(body.lowStockThreshold) : 5
    if (isNaN(threshold) || threshold < 0) {
      return NextResponse.json({ error: 'Düşük stok eşiği geçerli bir pozitif sayı olmalıdır' }, { status: 400 })
    }

    const item = await prisma.hardware.create({
      data: {
        name,
        brand: body.brand ? String(body.brand).trim() : null,
        model: body.model ? String(body.model).trim() : null,
        serialNumber: body.serialNumber ? String(body.serialNumber).trim() : null,
        quantity: qty,
        location: body.location ? String(body.location).trim() : null,
        notes: body.notes ? String(body.notes).trim() : null,
        lowStockThreshold: threshold,
      },
    })
    await logActivity(session, 'DONANIM_EKLE', `${item.name} eklendi (${qty} adet)`)
    return NextResponse.json({ ...item, createdAt: item?.createdAt?.toISOString?.() ?? '', updatedAt: item?.updatedAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    console.error('Create hardware error:', error)
    return NextResponse.json({ error: 'Donanım eklenirken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Donanım ID zorunludur' }, { status: 400 })
    }

    const existing = await prisma.hardware.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Güncellenecek donanım bulunamadı' }, { status: 404 })
    }

    const name = body.name ? String(body.name).trim() : existing.name
    if (!name) {
      return NextResponse.json({ error: 'Ürün adı boş bırakılamaz' }, { status: 400 })
    }

    const qty = body.quantity !== undefined ? parseInt(body.quantity) : existing.quantity
    if (qty < 0) {
      return NextResponse.json({ error: 'Adet negatif olamaz' }, { status: 400 })
    }

    const threshold = body.lowStockThreshold !== undefined ? parseInt(body.lowStockThreshold) : existing.lowStockThreshold
    if (isNaN(threshold) || threshold < 0) {
      return NextResponse.json({ error: 'Düşük stok eşiği geçerli bir pozitif sayı olmalıdır' }, { status: 400 })
    }

    const item = await prisma.hardware.update({
      where: { id: body.id },
      data: {
        name,
        brand: body.brand !== undefined ? (body.brand ? String(body.brand).trim() : null) : existing.brand,
        model: body.model !== undefined ? (body.model ? String(body.model).trim() : null) : existing.model,
        serialNumber: body.serialNumber !== undefined ? (body.serialNumber ? String(body.serialNumber).trim() : null) : existing.serialNumber,
        quantity: qty,
        location: body.location !== undefined ? (body.location ? String(body.location).trim() : null) : existing.location,
        notes: body.notes !== undefined ? (body.notes ? String(body.notes).trim() : null) : existing.notes,
        lowStockThreshold: threshold,
      },
    })
    await logActivity(session, 'DONANIM_GUNCELLE', `${item.name} güncellendi`)
    return NextResponse.json({ ...item, createdAt: item?.createdAt?.toISOString?.() ?? '', updatedAt: item?.updatedAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    console.error('Update hardware error:', error)
    return NextResponse.json({ error: 'Donanım güncellenirken hata oluştu' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Donanım ID gerekli' }, { status: 400 })

    const existing = await prisma.hardware.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Silinecek donanım bulunamadı' }, { status: 404 })
    }

    const item = await prisma.hardware.delete({ where: { id } })
    await logActivity(session, 'DONANIM_SIL', `${item.name} silindi`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete hardware error:', error)
    return NextResponse.json({ error: 'Donanım silinirken hata oluştu' }, { status: 500 })
  }
}
