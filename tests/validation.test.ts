import { describe, expect, it } from 'vitest'
import {
  consumableCreateSchema,
  consumableUpdateSchema,
  hardwareCreateSchema,
  hardwareUpdateSchema,
  licenseCreateSchema,
  licenseUpdateSchema,
  parseBody,
  parseDateParam,
  signupSchema,
  stockMovementSchema,
  userUpdateSchema,
} from '@/lib/validation'

const errorOf = (schema: Parameters<typeof parseBody>[0], body: unknown) => parseBody(schema, body).error

describe('donanım şeması', () => {
  it('formdan gelen metinleri kırpar, sayıları çevirir, varsayılanları uygular', () => {
    const r = parseBody(hardwareCreateSchema, { name: '  Dell 5540 ', quantity: '3', brand: '', serialNumber: '  ' })
    expect(r.error).toBeNull()
    expect(r.data).toEqual({
      name: 'Dell 5540', brand: null, model: null, serialNumber: null,
      quantity: 3, location: null, notes: null, lowStockThreshold: 5,
    })
  })

  it('ad yoksa ve adet negatifse Türkçe hata verir', () => {
    expect(errorOf(hardwareCreateSchema, { quantity: 1 })).toBe('Ürün adı zorunludur')
    expect(errorOf(hardwareCreateSchema, { name: 'X', quantity: -1 })).toBe('Adet negatif olamaz')
    expect(errorOf(hardwareCreateSchema, { name: 'X', quantity: 'abc' })).toBe('Adet geçerli bir sayı olmalıdır')
    expect(errorOf(hardwareCreateSchema, { name: 'X', lowStockThreshold: -2 })).toBe('Düşük stok eşiği geçerli bir pozitif sayı olmalıdır')
  })

  it('boş adet eklemede 0 sayılır', () => {
    expect(parseBody(hardwareCreateSchema, { name: 'X', quantity: '' }).data?.quantity).toBe(0)
  })

  it('güncellemede gönderilmeyen alanlara dokunmaz, boş gönderileni temizler', () => {
    const r = parseBody(hardwareUpdateSchema, { id: 'a1', brand: '', quantity: '7', createdAt: '2026-01-01' })
    expect(r.data).toEqual({
      name: undefined, brand: null, model: undefined, serialNumber: undefined,
      quantity: 7, location: undefined, notes: undefined, lowStockThreshold: undefined,
    })
  })

  it('güncellemede ad yalnız boşluktan oluşuyorsa reddeder', () => {
    expect(errorOf(hardwareUpdateSchema, { name: '   ' })).toBe('Ürün adı boş bırakılamaz')
  })
})

describe('lisans şeması', () => {
  it('bitiş tarihini Date yapar, boşsa null bırakır', () => {
    expect(parseBody(licenseCreateSchema, { softwareName: 'M365', expiryDate: '2027-01-31' }).data?.expiryDate).toEqual(new Date('2027-01-31'))
    expect(parseBody(licenseCreateSchema, { softwareName: 'M365', expiryDate: '' }).data?.expiryDate).toBeNull()
  })

  it('geçersiz tarihi reddeder (eskiden Prisma 500 veriyordu)', () => {
    expect(errorOf(licenseCreateSchema, { softwareName: 'M365', expiryDate: 'yarın' })).toBe('Geçerli bir son kullanma tarihi girin')
    expect(errorOf(licenseUpdateSchema, { expiryDate: '31.13.2027' })).toBe('Geçerli bir son kullanma tarihi girin')
  })

  it('güncellemede tarih gönderilmezse dokunmaz, boş gönderilirse siler', () => {
    expect(parseBody(licenseUpdateSchema, {}).data?.expiryDate).toBeUndefined()
    expect(parseBody(licenseUpdateSchema, { expiryDate: '' }).data?.expiryDate).toBeNull()
  })
})

describe('sarf malzemesi şeması', () => {
  it('birim boşsa "Adet" olur', () => {
    expect(parseBody(consumableCreateSchema, { name: 'Kablo' }).data?.unit).toBe('Adet')
    expect(parseBody(consumableCreateSchema, { name: 'Kablo', unit: ' Metre ' }).data?.unit).toBe('Metre')
    expect(parseBody(consumableUpdateSchema, {}).data?.unit).toBeUndefined()
    expect(parseBody(consumableUpdateSchema, { unit: '' }).data?.unit).toBe('Adet')
  })
})

describe('stok hareketi şeması', () => {
  const ok = { itemCategory: 'HARDWARE', itemId: 'h1', movementType: 'OUT', quantity: '2', description: '  ' }

  it('geçerli hareketi normalize eder', () => {
    expect(parseBody(stockMovementSchema, ok).data).toEqual({
      itemCategory: 'HARDWARE', itemId: 'h1', movementType: 'OUT', quantity: 2, description: null,
    })
  })

  it('eksik ve geçersiz alanları ayırt eder', () => {
    expect(errorOf(stockMovementSchema, { ...ok, itemCategory: undefined })).toBe('Eksik alanlar')
    expect(errorOf(stockMovementSchema, { ...ok, itemCategory: 'CAR' })).toBe('Geçersiz ürün kategorisi')
    expect(errorOf(stockMovementSchema, { ...ok, movementType: 'MOVE' })).toBe('Geçersiz hareket tipi')
    expect(errorOf(stockMovementSchema, { ...ok, itemId: '' })).toBe('Eksik alanlar')
    expect(errorOf(stockMovementSchema, { ...ok, quantity: 0 })).toBe("Miktar 0'dan büyük olmalı")
  })
})

describe('kullanıcı şemaları', () => {
  it('kullanıcı güncellemesi: kısa şifre, geçersiz e-posta, rol', () => {
    expect(errorOf(userUpdateSchema, {})).toBe('Kullanıcı ID gerekli')
    expect(errorOf(userUpdateSchema, { id: 'u1', password: '123' })).toBe('Şifre en az 8 karakter olmalıdır')
    expect(errorOf(userUpdateSchema, { id: 'u1', email: 'foo' })).toBe('Geçerli bir e-posta adresi girin')
    const r = parseBody(userUpdateSchema, { id: 'u1', email: ' A@B.COM ', role: 'ROOT' })
    expect(r.data?.email).toBe('a@b.com')
    expect(r.data?.role).toBeUndefined()
    expect(r.data?.password).toBeUndefined()
  })

  it('kayıt: zorunlu alanlar, e-postadan kullanıcı adı, rol', () => {
    expect(errorOf(signupSchema, { email: 'a@b.com' })).toBe('Lütfen tüm zorunlu alanları doldurun')
    expect(errorOf(signupSchema, { email: 'a@b.com', password: 'kisa' })).toBe('Şifre en az 8 karakter olmalıdır')
    expect(errorOf(signupSchema, { email: 'yanlis', password: 'uzunsifre1' })).toBe('Geçerli bir e-posta adresi girin')
    const r = parseBody(signupSchema, { email: ' Ali@Firma.com ', password: 'uzunsifre1', role: 'ADMIN' })
    expect(r.data).toMatchObject({ email: 'ali@firma.com', username: 'ali', role: 'ADMIN' })
    expect(parseBody(signupSchema, { email: 'a@b.com', password: 'uzunsifre1', role: 'x' }).data?.role).toBe('USER')
  })
})

describe('parseDateParam', () => {
  it('geçersiz tarihi yok sayar, gün sonunu ekler', () => {
    expect(parseDateParam(null)).toBeUndefined()
    expect(parseDateParam('abc')).toBeUndefined()
    expect(parseDateParam('2026-09-28', true)?.toISOString()).toBe('2026-09-28T23:59:59.999Z')
  })
})
