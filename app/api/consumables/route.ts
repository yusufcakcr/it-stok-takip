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
        category: 'CONSUMABLE',
      },
    })
  }
}

export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const items = await prisma.consumable.findMany({ orderBy: { createdAt: 'desc' } })
    return NextResponse.json(items?.map((i: any) => ({ ...i, createdAt: i?.createdAt?.toISOString?.() ?? '', updatedAt: i?.updatedAt?.toISOString?.() ?? '' })) ?? [])
  } catch (error: any) {
    console.error('Get consumables error:', error)
    return NextResponse.json({ error: 'Sarf malzemeleri listesi alınırken hata oluştu' }, { status: 500 })
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

    const item = await prisma.consumable.create({
      data: {
        name,
        brand: body.brand ? String(body.brand).trim() : null,
        quantity: qty,
        unit: body.unit ? String(body.unit).trim() : 'Adet',
        notes: body.notes ? String(body.notes).trim() : null,
        lowStockThreshold: threshold,
      },
    })
    await logActivity(session, 'SARF_EKLE', `${item.name} eklendi (${qty} ${item.unit || 'Adet'})`)
    return NextResponse.json({ ...item, createdAt: item?.createdAt?.toISOString?.() ?? '', updatedAt: item?.updatedAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    console.error('Create consumable error:', error)
    return NextResponse.json({ error: 'Sarf malzemesi eklenirken hata oluştu' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const body = await request.json()

    if (!body.id) {
      return NextResponse.json({ error: 'Sarf malzemesi ID zorunludur' }, { status: 400 })
    }

    const existing = await prisma.consumable.findUnique({ where: { id: body.id } })
    if (!existing) {
      return NextResponse.json({ error: 'Güncellenecek sarf malzemesi bulunamadı' }, { status: 404 })
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

    const item = await prisma.consumable.update({
      where: { id: body.id },
      data: {
        name,
        brand: body.brand !== undefined ? (body.brand ? String(body.brand).trim() : null) : existing.brand,
        quantity: qty,
        unit: body.unit !== undefined ? (body.unit ? String(body.unit).trim() : 'Adet') : existing.unit,
        notes: body.notes !== undefined ? (body.notes ? String(body.notes).trim() : null) : existing.notes,
        lowStockThreshold: threshold,
      },
    })
    await logActivity(session, 'SARF_GUNCELLE', `${item.name} güncellendi`)
    return NextResponse.json({ ...item, createdAt: item?.createdAt?.toISOString?.() ?? '', updatedAt: item?.updatedAt?.toISOString?.() ?? '' })
  } catch (error: any) {
    console.error('Update consumable error:', error)
    return NextResponse.json({ error: 'Sarf malzemesi güncellenirken hata oluştu' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 })
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Sarf malzemesi ID gerekli' }, { status: 400 })

    const existing = await prisma.consumable.findUnique({ where: { id } })
    if (!existing) {
      return NextResponse.json({ error: 'Silinecek sarf malzemesi bulunamadı' }, { status: 404 })
    }

    const item = await prisma.consumable.delete({ where: { id } })
    await logActivity(session, 'SARF_SIL', `${item.name} silindi`)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Delete consumable error:', error)
    return NextResponse.json({ error: 'Sarf malzemesi silinirken hata oluştu' }, { status: 500 })
  }
}
