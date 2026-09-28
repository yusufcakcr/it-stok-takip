export const dynamic = "force-dynamic";
import { prisma } from '@/lib/db'
import { createItemRoutes } from '@/lib/item-routes'
import { hardwareCreateSchema, hardwareUpdateSchema } from '@/lib/validation'

export const { GET, POST, PUT, DELETE } = createItemRoutes({
  category: 'HARDWARE',
  createSchema: hardwareCreateSchema,
  updateSchema: hardwareUpdateSchema,
  db: {
    list: () => prisma.hardware.findMany({ orderBy: { createdAt: 'desc' } }),
    find: (id) => prisma.hardware.findUnique({ where: { id } }),
    create: (data) => prisma.hardware.create({ data }),
    update: (id, data) => prisma.hardware.update({ where: { id }, data }),
    remove: (id) => prisma.hardware.delete({ where: { id } }),
  },
  nameOf: (item) => item.name,
  createdDetails: (item) => `${item.name} eklendi (${item.quantity} adet)`,
  actions: { create: 'DONANIM_EKLE', update: 'DONANIM_GUNCELLE', remove: 'DONANIM_SIL' },
  messages: {
    list: 'Donanım listesi alınırken hata oluştu',
    create: 'Donanım eklenirken hata oluştu',
    update: 'Donanım güncellenirken hata oluştu',
    remove: 'Donanım silinirken hata oluştu',
    idRequired: 'Donanım ID zorunludur',
    idMissing: 'Donanım ID gerekli',
    notFoundUpdate: 'Güncellenecek donanım bulunamadı',
    notFoundDelete: 'Silinecek donanım bulunamadı',
  },
})
