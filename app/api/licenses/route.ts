export const dynamic = "force-dynamic";
import { prisma } from '@/lib/db'
import { createItemRoutes } from '@/lib/item-routes'
import { licenseCreateSchema, licenseUpdateSchema } from '@/lib/validation'

export const { GET, POST, PUT, DELETE } = createItemRoutes({
  category: 'LICENSE',
  createSchema: licenseCreateSchema,
  updateSchema: licenseUpdateSchema,
  db: {
    list: () => prisma.license.findMany({ orderBy: { createdAt: 'desc' } }),
    find: (id) => prisma.license.findUnique({ where: { id } }),
    create: (data) => prisma.license.create({ data }),
    update: (id, data) => prisma.license.update({ where: { id }, data }),
    remove: (id) => prisma.license.delete({ where: { id } }),
  },
  nameOf: (item) => item.softwareName,
  createdDetails: (item) => `${item.softwareName} eklendi (${item.quantity} adet)`,
  actions: { create: 'LISANS_EKLE', update: 'LISANS_GUNCELLE', remove: 'LISANS_SIL' },
  messages: {
    list: 'Lisans listesi alınırken hata oluştu',
    create: 'Lisans eklenirken hata oluştu',
    update: 'Lisans güncellenirken hata oluştu',
    remove: 'Lisans silinirken hata oluştu',
    idRequired: 'Lisans ID zorunludur',
    idMissing: 'Lisans ID gerekli',
    notFoundUpdate: 'Güncellenecek lisans bulunamadı',
    notFoundDelete: 'Silinecek lisans bulunamadı',
  },
})
