'use client'

import { useState } from 'react'
import { Monitor, Plus, Pencil, Trash2, ArrowLeftRight, AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ItemFormDialog } from '@/components/item-form-dialog'
import { StockMovementDialog } from '@/components/stock-movement-dialog'
import { TablePagination } from '@/components/table-pagination'
import { useItemCrud } from '@/hooks/use-item-crud'
import { usePagination } from '@/hooks/use-pagination'
import { isLowStock } from '@/lib/stock'
import type { HardwareItem } from '@/lib/types'

const fields = [
  { name: 'name', label: 'Ürün Adı', required: true, placeholder: 'Örn: Dell Latitude 5540' },
  { name: 'brand', label: 'Marka', placeholder: 'Örn: Dell, HP, Lenovo' },
  { name: 'model', label: 'Model', placeholder: 'Örn: Latitude 5540' },
  { name: 'serialNumber', label: 'Seri No', placeholder: 'Örn: SN-928374' },
  { name: 'quantity', label: 'Adet', type: 'number', required: true, placeholder: '0' },
  { name: 'location', label: 'Konum', placeholder: 'Örn: Sunucu Odası, IT Deposu' },
  { name: 'lowStockThreshold', label: 'Düşük Stok Eşiği', type: 'number', placeholder: '5' },
  { name: 'notes', label: 'Notlar', type: 'textarea', placeholder: 'İsteğe bağlı ek açıklamalar...' },
]

export default function HardwarePage() {
  const { items, loading, refresh, save, remove } = useItemCrud<HardwareItem>('/api/hardware', {
    created: 'Yeni donanım eklendi',
    updated: 'Donanım güncellendi',
    deleted: 'Donanım silindi',
    confirmDelete: 'Bu donanımı silmek istediğinize emin misiniz?',
  })
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<HardwareItem | null>(null)
  const [movementItem, setMovementItem] = useState<HardwareItem | null>(null)

  const q = search.toLowerCase()
  const filtered = items.filter((i) =>
    [i.name, i.brand, i.model, i.serialNumber].some((v) => (v ?? '').toLowerCase().includes(q))
  )
  const pager = usePagination(filtered)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Monitor className="w-6 h-6 text-blue-400" /> Donanım Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">IT donanım envanterini yönetin</p>
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" /> Donanım Ekle
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); pager.setPage(1) }} placeholder="Donanım ara..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{search ? 'Arama sonucu bulunamadı' : 'Henüz donanım eklenmemiş'}</div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-xl shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Ürün</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Marka/Model</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Seri No</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Konum</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Stok</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((item) => {
                const isLow = isLowStock(item)
                return (
                  <tr
                    key={item?.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        {isLow && <span title="Düşük Stok" className="inline-flex"><AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-label="Düşük Stok" /></span>}
                        <span>{item?.name ?? '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{[item?.brand, item?.model].filter(Boolean).join(' ') || '-'}</td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">{item?.serialNumber ?? '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item?.location ?? '-'}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono ${isLow ? 'text-red-400 font-bold' : ''}`}>{item?.quantity ?? 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setMovementItem(item)} title="Stok Giriş / Çıkış">
                          <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem(item); setFormOpen(true) }} title="Düzenle">
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => remove(item.id)} title="Sil">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
          <TablePagination {...pager} onPageChange={pager.setPage} />
        </div>
      )}

      <ItemFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        title={editItem ? 'Donanım Düzenle' : 'Yeni Donanım Ekle'}
        fields={fields}
        initialData={editItem}
        onSubmit={save}
      />

      {movementItem && (
        <StockMovementDialog
          open={!!movementItem}
          onClose={() => setMovementItem(null)}
          itemId={movementItem.id}
          itemName={movementItem.name}
          itemCategory="HARDWARE"
          currentQuantity={movementItem.quantity}
          onSuccess={refresh}
        />
      )}
    </div>
  )
}
