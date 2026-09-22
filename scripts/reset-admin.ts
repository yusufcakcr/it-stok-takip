/**
 * Sızmış kimlik bilgilerini temizleme aracı.
 *
 * İki iş yapar:
 *   1. Depo geçmişinde şifresi açığa çıkmış platform kalıntısı hesabı siler
 *      (varsayılan: abacus-f92d92f8@example.com — RESET_REMOVE_EMAIL ile değiştirilebilir).
 *   2. Belirtilen yöneticinin şifresini yeniden belirler.
 *
 * Kullanım (.env içindeki DATABASE_URL okunur):
 *   RESET_ADMIN_EMAIL=admin@itstok.com RESET_ADMIN_PASSWORD='yeni-guclu-sifre' npm run reset-admin
 *
 * Silme işlemini atlamak için: RESET_SKIP_REMOVE=1
 * Yalnızca ne yapacağını görmek için: RESET_DRY_RUN=1
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

const LEAKED_EMAIL = process.env.RESET_REMOVE_EMAIL?.trim().toLowerCase() || 'abacus-f92d92f8@example.com'
const MIN_LENGTH = 8

async function main() {
  const dryRun = process.env.RESET_DRY_RUN === '1'
  const adminEmail = process.env.RESET_ADMIN_EMAIL?.trim().toLowerCase()
  const newPassword = process.env.RESET_ADMIN_PASSWORD

  const users = await prisma.user.findMany({ select: { email: true, username: true, role: true } })
  console.log(`Veritabanındaki kullanıcılar (${users.length}):`)
  for (const u of users) console.log(`  - ${u.email} (@${u.username}) — ${u.role}`)

  // 1) Sızmış hesabı kaldır
  if (process.env.RESET_SKIP_REMOVE !== '1') {
    const leaked = await prisma.user.findUnique({ where: { email: LEAKED_EMAIL } })
    if (!leaked) {
      console.log(`\nSızmış hesap bulunamadı (${LEAKED_EMAIL}) — yapılacak bir şey yok.`)
    } else if (dryRun) {
      console.log(`\n[kuru çalışma] Silinecekti: ${LEAKED_EMAIL}`)
    } else {
      // Son yönetici silinip sistem kilitlenmesin
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
      if (leaked.role === 'ADMIN' && adminCount <= 1) {
        console.error(`\nDURDURULDU: ${LEAKED_EMAIL} sistemdeki tek yönetici. Önce yeni bir yönetici oluşturun.`)
      } else {
        await prisma.user.delete({ where: { email: LEAKED_EMAIL } })
        console.log(`\nSilindi: ${LEAKED_EMAIL}`)
      }
    }
  }

  // 2) Yönetici şifresini yenile
  if (!adminEmail || !newPassword) {
    console.log('\nRESET_ADMIN_EMAIL / RESET_ADMIN_PASSWORD verilmedi — şifre değiştirilmedi.')
    return
  }
  if (newPassword.length < MIN_LENGTH) {
    throw new Error(`RESET_ADMIN_PASSWORD en az ${MIN_LENGTH} karakter olmalıdır`)
  }

  const target = await prisma.user.findUnique({ where: { email: adminEmail } })
  if (!target) {
    throw new Error(`Kullanıcı bulunamadı: ${adminEmail}`)
  }
  if (dryRun) {
    console.log(`[kuru çalışma] Şifresi değiştirilecekti: ${adminEmail}`)
    return
  }

  await prisma.user.update({
    where: { email: adminEmail },
    data: { password: await bcrypt.hash(newPassword, 12), role: 'ADMIN' },
  })
  console.log(`Şifre güncellendi ve rol ADMIN yapıldı: ${adminEmail}`)
}

main()
  .catch((e) => {
    console.error(e.message ?? e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
