import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  // Hidden test account (required by platform)
  const testPassword = await bcrypt.hash('g#Tsoz4J2a', 12)
  await prisma.user.upsert({
    where: { email: 'abacus-f92d92f8@example.com' },
    update: {},
    create: {
      email: 'abacus-f92d92f8@example.com',
      username: 'abacus-test',
      name: 'Test Admin',
      password: testPassword,
      role: 'ADMIN',
    },
  })

  // Default Admin user requested by user/specification
  const adminPassword = await bcrypt.hash('admin123', 12)
  await prisma.user.upsert({
    where: { email: 'admin@itstok.com' },
    update: {
      password: adminPassword,
      role: 'ADMIN',
    },
    create: {
      email: 'admin@itstok.com',
      username: 'admin',
      name: 'Admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  })

  // Sample hardware
  const hardwareData = [
    { name: 'Dell Latitude 5540', brand: 'Dell', model: 'Latitude 5540', serialNumber: 'DL5540-001', quantity: 12, location: 'IT Deposu', lowStockThreshold: 3, notes: 'i7, 16GB RAM' },
    { name: 'HP ProDisplay P24h', brand: 'HP', model: 'P24h G5', serialNumber: null, quantity: 8, location: 'IT Deposu', lowStockThreshold: 2, notes: '24" IPS Monitör' },
    { name: 'Logitech MK270', brand: 'Logitech', model: 'MK270', serialNumber: null, quantity: 15, location: 'Depo A', lowStockThreshold: 5, notes: 'Kablosuz klavye-mouse seti' },
    { name: 'Lenovo ThinkPad Dock', brand: 'Lenovo', model: 'USB-C Dock Gen2', serialNumber: null, quantity: 4, location: 'IT Deposu', lowStockThreshold: 3, notes: 'USB-C Docking Station' },
    { name: 'Cisco IP Phone 8845', brand: 'Cisco', model: '8845', serialNumber: null, quantity: 2, location: 'Sunucu Odası', lowStockThreshold: 3, notes: 'IP Telefon' },
  ]

  for (const hw of hardwareData) {
    const id = hw.name.replace(/\s/g, '-').toLowerCase()
    await prisma.hardware.upsert({
      where: { id },
      update: hw,
      create: { ...hw, id },
    })
  }

  // Sample licenses
  const licenseData = [
    { softwareName: 'Microsoft 365 Business', licenseKey: 'M365-XXXX-YYYY-ZZZZ', quantity: 50, expiryDate: new Date('2025-12-31'), lowStockThreshold: 10, notes: 'Yıllık abonelik' },
    { softwareName: 'Adobe Creative Cloud', licenseKey: 'ACC-XXXX-YYYY', quantity: 5, expiryDate: new Date('2025-06-30'), lowStockThreshold: 2, notes: 'Tasarım ekibi' },
    { softwareName: 'AutoCAD 2024', licenseKey: 'ACAD-XXXX', quantity: 3, expiryDate: new Date('2026-03-15'), lowStockThreshold: 1, notes: 'Mühendislik' },
    { softwareName: 'Kaspersky Endpoint Security', licenseKey: 'KES-XXXX-YYYY', quantity: 100, expiryDate: new Date('2025-09-30'), lowStockThreshold: 20, notes: 'Antivirüs' },
  ]

  for (const lic of licenseData) {
    const id = lic.softwareName.replace(/\s/g, '-').toLowerCase()
    await prisma.license.upsert({
      where: { id },
      update: lic,
      create: { ...lic, id },
    })
  }

  // Sample consumables
  const consumableData = [
    { name: 'USB Flash Bellek 32GB', brand: 'SanDisk', quantity: 20, unit: 'Adet', lowStockThreshold: 5, notes: 'USB 3.0' },
    { name: 'CAT6 Patch Kablo 1m', brand: 'Dexlan', quantity: 50, unit: 'Adet', lowStockThreshold: 10, notes: null },
    { name: 'HDMI Kablo 2m', brand: 'Ugreen', quantity: 8, unit: 'Adet', lowStockThreshold: 5, notes: 'HDMI 2.0' },
    { name: 'AA Pil', brand: 'Duracell', quantity: 3, unit: 'Paket', lowStockThreshold: 5, notes: '4\'lü paket' },
    { name: 'Termal Macun', brand: 'Arctic', quantity: 2, unit: 'Adet', lowStockThreshold: 3, notes: 'MX-4' },
  ]

  for (const con of consumableData) {
    const id = con.name.replace(/\s/g, '-').toLowerCase()
    await prisma.consumable.upsert({
      where: { id },
      update: con,
      create: { ...con, id },
    })
  }

  console.log('Seed completed successfully!')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
