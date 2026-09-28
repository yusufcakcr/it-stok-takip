/** Prisma satırındaki Date alanlarını JSON yanıtı için ISO metnine çevirir. */
export type Serialized<T> = {
  [K in keyof T]: T[K] extends Date ? string : T[K] extends Date | null ? string | null : T[K]
}

export function serialize<T extends object>(row: T): Serialized<T> {
  const out: Record<string, unknown> = {}
  for (const [key, value] of Object.entries(row)) {
    out[key] = value instanceof Date ? value.toISOString() : value
  }
  return out as Serialized<T>
}

export function serializeAll<T extends object>(rows: T[]): Serialized<T>[] {
  return rows.map(serialize)
}
