import { NextResponse } from 'next/server'
import type { z } from 'zod'
import { requireUser, serverError } from '@/lib/api-auth'
import { logActivity } from '@/lib/activity'
import { serialize, serializeAll } from '@/lib/serialize'
import { parseBody, readJson } from '@/lib/validation'

type ItemRow = { id: string; quantity: number; createdAt: Date; updatedAt: Date }

export interface ItemRouteConfig<Row extends ItemRow, Create, Update> {
  category: 'HARDWARE' | 'LICENSE' | 'CONSUMABLE'
  createSchema: z.ZodType<Create, z.ZodTypeDef, unknown>
  updateSchema: z.ZodType<Update, z.ZodTypeDef, unknown>
  db: {
    list(): Promise<Row[]>
    find(id: string): Promise<Row | null>
    create(data: Create): Promise<Row>
    update(id: string, data: Update): Promise<Row>
    remove(id: string): Promise<Row>
  }
  nameOf(row: Row): string
  /** Ekleme kaydının günlük metni, ör. "Mouse eklendi (5 adet)". */
  createdDetails(row: Row): string
  actions: { create: string; update: string; remove: string }
  messages: {
    list: string
    create: string
    update: string
    remove: string
    idRequired: string
    idMissing: string
    notFoundUpdate: string
    notFoundDelete: string
  }
}

/**
 * Donanım, lisans ve sarf malzemesi rotaları aynı akışı izler: oturum kontrolü →
 * doğrulama → kayıt → işlem günlüğü. Farklar yalnızca şema, tablo ve mesajlardadır.
 */
export function createItemRoutes<Row extends ItemRow, Create, Update>(cfg: ItemRouteConfig<Row, Create, Update>) {
  const bad = (error: string, status = 400) => NextResponse.json({ error }, { status })

  async function GET() {
    try {
      const guard = await requireUser()
      if (guard.error) return guard.error
      return NextResponse.json(serializeAll(await cfg.db.list()))
    } catch (error) {
      return serverError(`Get ${cfg.category} error`, error, cfg.messages.list)
    }
  }

  async function POST(request: Request) {
    try {
      const guard = await requireUser()
      if (guard.error) return guard.error
      const body = await readJson(request)
      if (body === null) return bad('Geçersiz istek gövdesi')

      const parsed = parseBody(cfg.createSchema, body)
      if (parsed.error !== null) return bad(parsed.error)

      const item = await cfg.db.create(parsed.data)
      await logActivity(guard.user, { action: cfg.actions.create, details: cfg.createdDetails(item), category: cfg.category })
      return NextResponse.json(serialize(item))
    } catch (error) {
      return serverError(`Create ${cfg.category} error`, error, cfg.messages.create)
    }
  }

  async function PUT(request: Request) {
    try {
      const guard = await requireUser()
      if (guard.error) return guard.error
      const body = await readJson(request)
      if (body === null) return bad('Geçersiz istek gövdesi')

      const id = typeof body === 'object' && body && 'id' in body && body.id ? String(body.id) : ''
      if (!id) return bad(cfg.messages.idRequired)
      if (!(await cfg.db.find(id))) return bad(cfg.messages.notFoundUpdate, 404)

      const parsed = parseBody(cfg.updateSchema, body)
      if (parsed.error !== null) return bad(parsed.error)

      const item = await cfg.db.update(id, parsed.data)
      await logActivity(guard.user, { action: cfg.actions.update, details: `${cfg.nameOf(item)} güncellendi`, category: cfg.category })
      return NextResponse.json(serialize(item))
    } catch (error) {
      return serverError(`Update ${cfg.category} error`, error, cfg.messages.update)
    }
  }

  async function DELETE(request: Request) {
    try {
      const guard = await requireUser()
      if (guard.error) return guard.error
      const id = new URL(request.url).searchParams.get('id')
      if (!id) return bad(cfg.messages.idMissing)
      if (!(await cfg.db.find(id))) return bad(cfg.messages.notFoundDelete, 404)

      const item = await cfg.db.remove(id)
      await logActivity(guard.user, { action: cfg.actions.remove, details: `${cfg.nameOf(item)} silindi`, category: cfg.category })
      return NextResponse.json({ success: true })
    } catch (error) {
      return serverError(`Delete ${cfg.category} error`, error, cfg.messages.remove)
    }
  }

  return { GET, POST, PUT, DELETE }
}
