import { z } from 'zod'
import { MIN_PASSWORD_LENGTH } from '@/lib/constants'

/**
 * API istek gövdeleri için zod şemaları. Formlar sayıları metin olarak gönderdiği için
 * alanlar önce normalize edilir (kırpma, sayıya çevirme), sonra doğrulanır.
 * Hata mesajları kullanıcıya gösterildiği için Türkçedir.
 */

const toInt = (v: unknown): number => (typeof v === 'number' ? Math.trunc(v) : parseInt(String(v), 10))
const isBlank = (v: unknown) => v === undefined || v === null || v === ''

const count = (negative: string, invalid: string) =>
  z.number({ invalid_type_error: invalid, required_error: invalid }).int(invalid).min(0, negative)

const QTY_NEGATIVE = 'Adet negatif olamaz'
const QTY_INVALID = 'Adet geçerli bir sayı olmalıdır'
const THRESHOLD_INVALID = 'Düşük stok eşiği geçerli bir pozitif sayı olmalıdır'
const DATE_INVALID = 'Geçerli bir son kullanma tarihi girin'
const DEFAULT_UNIT = 'Adet'
const DEFAULT_THRESHOLD = 5

/** Boş veya yoksa null, doluysa kırpılmış metin. */
const text = z.unknown().transform((v) => (v ? String(v).trim() || null : null))
/** Güncellemede gönderilmeyen alan undefined kalır (Prisma o alana dokunmaz). */
const patchText = z.unknown().transform((v) => (v === undefined ? undefined : v ? String(v).trim() || null : null))

const requiredName = (message: string) =>
  z.unknown().transform((v) => (v ? String(v).trim() : '')).pipe(z.string().min(1, message))
const patchName = (message: string) =>
  z.unknown().transform((v) => (v ? String(v).trim() : undefined)).pipe(z.string().min(1, message).optional())

const quantity = z.unknown().transform((v) => (isBlank(v) ? 0 : toInt(v))).pipe(count(QTY_NEGATIVE, QTY_INVALID))
const patchQuantity = z.unknown().transform((v) => (isBlank(v) ? undefined : toInt(v))).pipe(count(QTY_NEGATIVE, QTY_INVALID).optional())

const threshold = z.unknown().transform((v) => (isBlank(v) ? DEFAULT_THRESHOLD : toInt(v))).pipe(count(THRESHOLD_INVALID, THRESHOLD_INVALID))
const patchThreshold = z.unknown().transform((v) => (isBlank(v) ? undefined : toInt(v))).pipe(count(THRESHOLD_INVALID, THRESHOLD_INVALID).optional())

const validDate = z.custom<Date | null>((d) => d === null || (d instanceof Date && !Number.isNaN(d.getTime())), DATE_INVALID)
const date = z.unknown().transform((v) => (v ? new Date(String(v)) : null)).pipe(validDate)
const patchDate = z.unknown().transform((v) => (v === undefined ? undefined : v ? new Date(String(v)) : null)).pipe(validDate.optional())

const unit = z.unknown().transform((v) => (v ? String(v).trim() || DEFAULT_UNIT : DEFAULT_UNIT))
const patchUnit = z.unknown().transform((v) => (v === undefined ? undefined : v ? String(v).trim() || DEFAULT_UNIT : DEFAULT_UNIT))

export const hardwareCreateSchema = z.object({
  name: requiredName('Ürün adı zorunludur'),
  brand: text,
  model: text,
  serialNumber: text,
  quantity,
  location: text,
  notes: text,
  lowStockThreshold: threshold,
})

export const hardwareUpdateSchema = z.object({
  name: patchName('Ürün adı boş bırakılamaz'),
  brand: patchText,
  model: patchText,
  serialNumber: patchText,
  quantity: patchQuantity,
  location: patchText,
  notes: patchText,
  lowStockThreshold: patchThreshold,
})

export const licenseCreateSchema = z.object({
  softwareName: requiredName('Yazılım adı zorunludur'),
  licenseKey: text,
  quantity,
  expiryDate: date,
  notes: text,
  lowStockThreshold: threshold,
})

export const licenseUpdateSchema = z.object({
  softwareName: patchName('Yazılım adı boş bırakılamaz'),
  licenseKey: patchText,
  quantity: patchQuantity,
  expiryDate: patchDate,
  notes: patchText,
  lowStockThreshold: patchThreshold,
})

export const consumableCreateSchema = z.object({
  name: requiredName('Ürün adı zorunludur'),
  brand: text,
  quantity,
  unit,
  notes: text,
  lowStockThreshold: threshold,
})

export const consumableUpdateSchema = z.object({
  name: patchName('Ürün adı boş bırakılamaz'),
  brand: patchText,
  quantity: patchQuantity,
  unit: patchUnit,
  notes: patchText,
  lowStockThreshold: patchThreshold,
})

/** Eksik alan ile geçersiz değeri ayrı mesajla bildiren enum alanı. */
const choice = <const T extends readonly [string, ...string[]]>(values: T, invalid: string) =>
  z.unknown().superRefine((v, ctx) => {
    if (isBlank(v)) ctx.addIssue({ code: 'custom', message: 'Eksik alanlar' })
    else if (!values.includes(String(v))) ctx.addIssue({ code: 'custom', message: invalid })
  }).transform((v) => String(v) as T[number])

export const stockMovementSchema = z.object({
  itemCategory: choice(['HARDWARE', 'LICENSE', 'CONSUMABLE'], 'Geçersiz ürün kategorisi'),
  itemId: z.unknown().transform((v) => (v ? String(v) : '')).pipe(z.string().min(1, 'Eksik alanlar')),
  movementType: choice(['IN', 'OUT'], 'Geçersiz hareket tipi'),
  quantity: z.unknown().transform((v) => (isBlank(v) ? NaN : toInt(v)))
    .pipe(z.number({ invalid_type_error: 'Eksik alanlar' }).int().positive("Miktar 0'dan büyük olmalı")),
  description: text,
})

const password = z.string().min(MIN_PASSWORD_LENGTH, `Şifre en az ${MIN_PASSWORD_LENGTH} karakter olmalıdır`)
const email = z.string().email('Geçerli bir e-posta adresi girin')

export const userUpdateSchema = z.object({
  id: z.unknown().transform((v) => (v ? String(v) : '')).pipe(z.string().min(1, 'Kullanıcı ID gerekli')),
  password: z.unknown().transform((v) => (v ? String(v) : undefined)).pipe(password.optional()),
  role: z.unknown().transform((v) => (v === 'ADMIN' || v === 'USER' ? v : undefined)),
  name: z.unknown().transform((v) => (v === undefined ? undefined : String(v).trim())),
  email: z.unknown().transform((v) => (isBlank(v) || !String(v).trim() ? undefined : String(v).trim().toLowerCase())).pipe(email.optional()),
})

export const signupSchema = z
  .object({
    email: z.unknown().transform((v) => (v ? String(v).trim().toLowerCase() : '')),
    password: z.unknown().transform((v) => (v ? String(v) : '')),
    name: z.unknown().transform((v) => (v ? String(v).trim() : '')),
    username: z.unknown().transform((v) => (v ? String(v).trim() : '')),
    role: z.unknown().transform((v): 'ADMIN' | 'USER' => (v === 'ADMIN' ? 'ADMIN' : 'USER')),
  })
  .transform((d) => ({ ...d, username: d.username || (d.email ? d.email.split('@')[0] : '') }))
  .superRefine((d, ctx) => {
    if (!d.email || !d.password || !d.username) {
      ctx.addIssue({ code: 'custom', message: 'Lütfen tüm zorunlu alanları doldurun' })
      return
    }
    for (const [schema, value] of [[email, d.email], [password, d.password]] as const) {
      const r = schema.safeParse(value)
      if (!r.success) ctx.addIssue({ code: 'custom', message: r.error.issues[0].message })
    }
  })

export type ParseResult<T> = { data: T; error: null } | { data: null; error: string }

/** Şemayı uygular; başarısızsa kullanıcıya gösterilecek ilk hata mesajını döner. */
export function parseBody<S extends z.ZodTypeAny>(schema: S, body: unknown): ParseResult<z.output<S>> {
  const result = schema.safeParse(body ?? {})
  if (result.success) return { data: result.data, error: null }
  return { data: null, error: result.error.issues[0]?.message ?? 'Geçersiz istek' }
}

/** "YYYY-MM-DD" sorgu parametresini tarihe çevirir; geçersizse yok sayar (Prisma'da 500'e yol açmasın). */
export function parseDateParam(value: string | null, endOfDay = false): Date | undefined {
  if (!value) return undefined
  const d = new Date(endOfDay ? `${value}T23:59:59.999Z` : value)
  return Number.isNaN(d.getTime()) ? undefined : d
}

/** Gövde JSON değilse null döner (rota 400 verir, 500 değil). */
export async function readJson(request: Request): Promise<unknown | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}
