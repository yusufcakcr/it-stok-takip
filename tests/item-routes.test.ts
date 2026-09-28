import { beforeEach, describe, expect, it, vi } from 'vitest'

const auth = vi.hoisted(() => ({ user: { id: 'u1', name: 'Ayşe', username: 'ayse', role: 'USER' as 'USER' | 'ADMIN' } as { id: string; name: string; username: string; role: 'USER' | 'ADMIN' } | null }))
const logActivity = vi.hoisted(() => vi.fn())

vi.mock('@/lib/api-auth', async () => {
  const { NextResponse } = await import('next/server')
  return {
    requireUser: async () =>
      auth.user
        ? { user: auth.user, error: null }
        : { user: null, error: NextResponse.json({ error: 'Yetkisiz erişim' }, { status: 401 }) },
    serverError: (_ctx: string, _err: unknown, message: string) => NextResponse.json({ error: message }, { status: 500 }),
  }
})
vi.mock('@/lib/activity', () => ({ logActivity }))

import { createItemRoutes } from '@/lib/item-routes'
import { hardwareCreateSchema, hardwareUpdateSchema } from '@/lib/validation'

type Row = { id: string; name: string; quantity: number; createdAt: Date; updatedAt: Date }
const now = new Date('2026-09-28T10:00:00.000Z')

function setup() {
  const rows = new Map<string, Row>([['h1', { id: 'h1', name: 'Mouse', quantity: 4, createdAt: now, updatedAt: now }]])
  const db = {
    list: vi.fn(async () => [...rows.values()]),
    find: vi.fn(async (id: string) => rows.get(id) ?? null),
    create: vi.fn(async (data: { name: string; quantity: number }) => {
      const row = { id: 'h2', name: data.name, quantity: data.quantity, createdAt: now, updatedAt: now }
      rows.set(row.id, row)
      return row
    }),
    update: vi.fn(async (id: string, data: { name?: string; quantity?: number }) => {
      const row = { ...rows.get(id)!, ...Object.fromEntries(Object.entries(data).filter(([, v]) => v !== undefined)) }
      rows.set(id, row)
      return row
    }),
    remove: vi.fn(async (id: string) => {
      const row = rows.get(id)!
      rows.delete(id)
      return row
    }),
  }
  const routes = createItemRoutes({
    category: 'HARDWARE',
    createSchema: hardwareCreateSchema,
    updateSchema: hardwareUpdateSchema,
    db,
    nameOf: (r) => r.name,
    createdDetails: (r) => `${r.name} eklendi (${r.quantity} adet)`,
    actions: { create: 'EKLE', update: 'GUNCELLE', remove: 'SIL' },
    messages: {
      list: 'liste hatası', create: 'ekleme hatası', update: 'güncelleme hatası', remove: 'silme hatası',
      idRequired: 'ID zorunlu', idMissing: 'ID gerekli', notFoundUpdate: 'güncellenecek yok', notFoundDelete: 'silinecek yok',
    },
  })
  return { db, routes }
}

const json = (method: string, body: unknown) =>
  new Request('http://test/api/hardware', { method, headers: { 'Content-Type': 'application/json' }, body: typeof body === 'string' ? body : JSON.stringify(body) })

beforeEach(() => {
  auth.user = { id: 'u1', name: 'Ayşe', username: 'ayse', role: 'USER' }
  logActivity.mockClear()
})

describe('createItemRoutes', () => {
  it('oturum yoksa 401 döner ve veritabanına dokunmaz', async () => {
    auth.user = null
    const { db, routes } = setup()
    const res = await routes.GET()
    expect(res.status).toBe(401)
    expect(db.list).not.toHaveBeenCalled()
  })

  it('listeyi tarihleri ISO metin olarak döner', async () => {
    const { routes } = setup()
    const res = await routes.GET()
    expect(await res.json()).toEqual([{ id: 'h1', name: 'Mouse', quantity: 4, createdAt: now.toISOString(), updatedAt: now.toISOString() }])
  })

  it('geçersiz gövdede 400 ve Türkçe mesaj döner, kayıt açmaz', async () => {
    const { db, routes } = setup()
    const res = await routes.POST(json('POST', { quantity: 2 }))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'Ürün adı zorunludur' })
    expect(db.create).not.toHaveBeenCalled()
  })

  it('JSON olmayan gövdede 500 yerine 400 döner', async () => {
    const { routes } = setup()
    const res = await routes.POST(json('POST', '{bozuk'))
    expect(res.status).toBe(400)
  })

  it('ekleme sonrası işlem günlüğüne yazar', async () => {
    const { routes } = setup()
    const res = await routes.POST(json('POST', { name: ' Klavye ', quantity: '3' }))
    expect(res.status).toBe(200)
    expect((await res.json()).name).toBe('Klavye')
    expect(logActivity).toHaveBeenCalledWith(auth.user, { action: 'EKLE', details: 'Klavye eklendi (3 adet)', category: 'HARDWARE' })
  })

  it('güncellemede ID yoksa 400, kayıt yoksa 404 döner', async () => {
    const { routes } = setup()
    expect((await routes.PUT(json('PUT', { name: 'X' }))).status).toBe(400)
    expect((await routes.PUT(json('PUT', { id: 'yok', name: 'X' }))).status).toBe(404)
  })

  it('güncellemede gönderilmeyen alanlar korunur', async () => {
    const { routes } = setup()
    const res = await routes.PUT(json('PUT', { id: 'h1', quantity: '9' }))
    expect(await res.json()).toMatchObject({ id: 'h1', name: 'Mouse', quantity: 9 })
  })

  it('silmede ID yoksa 400, kayıt yoksa 404, varsa siler', async () => {
    const { db, routes } = setup()
    expect((await routes.DELETE(new Request('http://test/api/hardware', { method: 'DELETE' }))).status).toBe(400)
    expect((await routes.DELETE(new Request('http://test/api/hardware?id=yok', { method: 'DELETE' }))).status).toBe(404)
    const res = await routes.DELETE(new Request('http://test/api/hardware?id=h1', { method: 'DELETE' }))
    expect(await res.json()).toEqual({ success: true })
    expect(db.remove).toHaveBeenCalledWith('h1')
  })

  it('veritabanı hatasında ayrıntıyı sızdırmadan 500 döner', async () => {
    const { db, routes } = setup()
    db.list.mockRejectedValueOnce(new Error('connection refused at 10.0.0.5'))
    const res = await routes.GET()
    expect(res.status).toBe(500)
    expect(await res.json()).toEqual({ error: 'liste hatası' })
  })
})
