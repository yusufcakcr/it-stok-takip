import type { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'
import type { SessionUser } from '@/lib/api-auth'

type LogClient = Pick<Prisma.TransactionClient, 'activityLog'>

/** Günlükte ve hareket kayıtlarında gösterilecek kullanıcı adı. */
export function displayName(user: Pick<SessionUser, 'name' | 'username'>): string {
  return user.name ?? user.username ?? ''
}

/**
 * İşlem günlüğüne kayıt düşer. Şirket kuralı: yönetici işlemleri günlüğe yazılmaz.
 * Transaction içinde çağrılırken `client` olarak `tx` verilir.
 */
export async function logActivity(
  user: SessionUser,
  entry: { action: string; details: string; category: string },
  client: LogClient = prisma,
) {
  if (user.role === 'ADMIN') return
  await client.activityLog.create({
    data: { userId: user.id, userName: displayName(user), ...entry },
  })
}
