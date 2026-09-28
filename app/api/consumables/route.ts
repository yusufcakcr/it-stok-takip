export const dynamic = "force-dynamic";
import { prisma } from '@/lib/db'
import { createItemRoutes } from '@/lib/item-routes'
import { consumableCreateSchema, consumableUpdateSchema } from '@/lib/validation'

export const { GET, POST, PUT, DELETE } = createItemRoutes({
  category: 'CONSUMABLE',
  createSchema: consumableCreateSchema,
  updateSchema: consumableUpdateSchema,
  db: {
    list: () => prisma.consumable.findMany({ orderBy: { createdAt: 'desc' } }),
    find: (id) => prisma.consumable.findUnique({ where: { id } }),
    create: (data) => prisma.consumable.create({ data }),
    update: (id, data) => prisma.consumable.update({ where: { id }, data }),
    remove: (id) => prisma.consumable.delete({ where: { id } }),
  },
  nameOf: (item) => item.name,
  createdDetails: (item) => `${item.name} eklendi (${item.quantity} ${item.unit || 'Adet'})`,
  actions: { create: 'SARF_EKLE', update: 'SARF_GUNCELLE', remove: 'SARF_SIL' },
  messages: {
    list: 'Sarf malzemeleri listesi alınırken hata oluştu',
    create: 'Sarf malzemesi eklenirken hata oluştu',
    update: 'Sarf malzemesi güncellenirken hata oluştu',
    remove: 'Sarf malzemesi silinirken hata oluştu',
    idRequired: 'Sarf malzemesi ID zorunludur',
    idMissing: 'Sarf malzemesi ID gerekli',
    notFoundUpdate: 'Güncellenecek sarf malzemesi bulunamadı',
    notFoundDelete: 'Silinecek sarf malzemesi bulunamadı',
  },
})
