import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function check() {
  try {
    const users = await prisma.user.findMany()
    console.log('--- MEVCUT KULLANICILAR ---')
    for (const u of users) {
      console.log(`ID: ${u.id}, Kullanici: ${u.username}, Email: ${u.email}, Rol: ${u.role}`)
    }

    // Check admin123 against admin user
    const admin = await prisma.user.findFirst({ where: { username: 'admin' } })
    if (admin) {
      const match = await bcrypt.compare('admin123', admin.password)
      console.log(`'admin123' sifresi eslesiyor mu?: ${match}`)
    } else {
      console.log("UYARI: 'admin' kullanicisi veritabaninda bulunamadi!")
    }
  } catch (err) {
    console.error('Veritabani hatasi:', err.message)
  } finally {
    await prisma.$disconnect()
  }
}

check()
