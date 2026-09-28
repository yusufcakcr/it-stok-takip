/** Stok hesapları: API rotaları ve sayfalar aynı kuralı kullanır. */

export const DEFAULT_LOW_STOCK_THRESHOLD = 5

type Stocked = { quantity?: number | null; lowStockThreshold?: number | null }

/** Adet, düşük stok eşiğine eşit veya altındaysa ürün "düşük stok" sayılır. */
export function isLowStock(item: Stocked): boolean {
  return (item.quantity ?? 0) <= (item.lowStockThreshold ?? DEFAULT_LOW_STOCK_THRESHOLD)
}

export function totalQuantity(items: Stocked[]): number {
  return items.reduce((sum, i) => sum + (i.quantity ?? 0), 0)
}

/** Son kullanma tarihi verilen gün sayısı içinde (veya geçmiş) olan lisanslar. */
export function expiringWithin<T extends { expiryDate: Date | null }>(licenses: T[], days: number, now = new Date()): T[] {
  const limit = now.getTime() + days * 24 * 60 * 60 * 1000
  return licenses.filter((l) => l.expiryDate !== null && l.expiryDate.getTime() <= limit)
}

export const CATEGORY_LABELS = {
  HARDWARE: 'Donanım',
  LICENSE: 'Lisans',
  CONSUMABLE: 'Sarf Malzemesi',
} as const
