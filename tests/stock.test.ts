import { describe, expect, it } from 'vitest'
import { expiringWithin, isLowStock, totalQuantity } from '@/lib/stock'
import { serialize } from '@/lib/serialize'

describe('stok hesapları', () => {
  it('eşiğe eşit veya altındaki adet düşük stoktur, eşik yoksa 5 kullanılır', () => {
    expect(isLowStock({ quantity: 5, lowStockThreshold: 5 })).toBe(true)
    expect(isLowStock({ quantity: 6, lowStockThreshold: 5 })).toBe(false)
    expect(isLowStock({ quantity: 4 })).toBe(true)
    expect(isLowStock({ quantity: 0, lowStockThreshold: 0 })).toBe(true)
  })

  it('toplam adet', () => {
    expect(totalQuantity([{ quantity: 2 }, { quantity: 3 }, {}])).toBe(5)
  })

  it('30 gün içinde veya geçmişte biten lisansları seçer', () => {
    const now = new Date('2026-09-28T00:00:00Z')
    const day = 24 * 60 * 60 * 1000
    const licenses = [
      { id: 'yakın', expiryDate: new Date(now.getTime() + 10 * day) },
      { id: 'uzak', expiryDate: new Date(now.getTime() + 60 * day) },
      { id: 'geçmiş', expiryDate: new Date(now.getTime() - day) },
      { id: 'süresiz', expiryDate: null },
    ]
    expect(expiringWithin(licenses, 30, now).map((l) => l.id)).toEqual(['yakın', 'geçmiş'])
  })
})

describe('serialize', () => {
  it('Date alanlarını ISO metne çevirir, null ve diğerlerine dokunmaz', () => {
    const row = { id: 'a', createdAt: new Date('2026-01-02T03:04:05.000Z'), expiryDate: null, quantity: 3 }
    expect(serialize(row)).toEqual({ id: 'a', createdAt: '2026-01-02T03:04:05.000Z', expiryDate: null, quantity: 3 })
  })
})
