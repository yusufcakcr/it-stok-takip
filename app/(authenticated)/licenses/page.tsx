'use client'

import { useState } from 'react'
import { Key, Plus, Pencil, Trash2, ArrowLeftRight, AlertTriangle, Search, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ItemFormDialog } from '@/components/item-form-dialog'
import { StockMovementDialog } from '@/components/stock-movement-dialog'
import { TablePagination } from '@/components/table-pagination'
import { useItemCrud } from '@/hooks/use-item-crud'
import { usePagination } from '@/hooks/use-pagination'
import { isLowStock } from '@/lib/stock'
import type { LicenseItem } from '@/lib/types'

const fields = [
  { name: 'softwareName', label: 'Yazılım Adı', required: true, placeholder: 'Örn: Microsoft 365, Adobe CC' },
  { name: 'licenseKey', label: 'Lisans Anahtarı', placeholder: 'Örn: XXXX-YYYY-ZZZZ' },
  { name: 'quantity', label: 'Adet / Kullanıcı Sayısı', type: 'number', required: true, placeholder: '0' },
  { name: 'expiryDate', label: 'Bitiş Tarihi', type: 'date' },
  { name: 'lowStockThreshold', label: 'Düşük Stok Eşiği', type: 'number', placeholder: '5' },
  { name: 'notes', label: 'Notlar', type: 'textarea', placeholder: 'İsteğe bağlı ek açıklamalar...' },
]

export default function LicensesPage() {
  const { items, loading, refresh, save, remove } = useItemCrud<LicenseItem>('/api/licenses', {
    created: 'Yeni lisans eklendi',
    updated: 'Lisans güncellendi',
    deleted: 'Lisans silindi',
    confirmDelete: 'Bu lisansı silmek istediğinize emin misiniz?',
  })
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<LicenseItem | null>(null)
  const [movementItem, setMovementItem] = useState<LicenseItem | null>(null)

  const q = search.toLowerCase()
  const filtered = items.filter((i) =>
    [i.softwareName, i.licenseKey].some((v) => (v ?? '').toLowerCase().includes(q))
  )
  const pager = usePagination(filtered)

  const isExpiringSoon = (date?: string | null) => {
    if (!date) return false
    const d = new Date(date)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000
  }

  const isExpired = (date?: string | null) => {
    if (!date) return false
    return new Date(date) < new Date()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Key className="w-6 h-6 text-emerald-400" /> Lisans Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">Yazılım lisanslarını ve bitiş tarihlerini yönetin</p>
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" /> Lisans Ekle
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => { setSearch(e.target.value); pager.setPage(1) }} placeholder="Lisans ara..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{search ? 'Arama sonucu bulunamadı' : 'Henüz lisans eklenmemiş'}</div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-xl shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Yazılım</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Lisans Anahtarı</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Bitiş Tarihi</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Stok</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {pager.pageItems.map((item) => {
                const isLow = isLowStock(item)
                const expSoon = isExpiringSoon(item?.expiryDate)
                const expired = isExpired(item?.expiryDate)
                return (
                  <tr
                    key={item?.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        {isLow && <span title="Düşük Stok" className="inline-flex"><AlertTriangle className="w-4 h-4 text-red-400 shrink-0" aria-label="Düşük Stok" /></span>}
                        <span>{item?.softwareName ?? '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                      {item?.licenseKey ? '****' + (item.licenseKey?.slice?.(-4) ?? '') : '-'}
                    </td>
                    <td className="py-3 px-4">
                      {item?.expiryDate ? (
                        <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full font-medium ${
                          expired ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                          expSoon ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {expired && <AlertTriangle className="w-3 h-3" />}
                          {expSoon && <CalendarClock className="w-3 h-3" />}
                          {expired ? `Süresi Doldu (${new Date(item.expiryDate).toLocaleDateString('tr-TR')})` : new Date(item.expiryDate).toLocaleDateString('tr-TR')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground text-xs">Süresiz</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-mono ${isLow ? 'text-red-400 font-bold' : ''}`}>{item?.quantity ?? 0}</span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setMovementItem(item)} title="Stok Giriş / Çıkış">
                          <ArrowLeftRight className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon-sm" onClick={() => { setEditItem({ ...item, expiryDate: item?.expiryDate ? item.expiryDate.split('T')[0] : '' }); setFormOpen(true) }} title="Düzenle">
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
        title={editItem ? 'Lisans Düzenle' : 'Yeni Lisans Ekle'}
        fields={fields}
        initialData={editItem}
        onSubmit={save}
      />

      {movementItem && (
        <StockMovementDialog
          open={!!movementItem}
          onClose={() => setMovementItem(null)}
          itemId={movementItem.id}
          itemName={movementItem.softwareName}
          itemCategory="LICENSE"
          currentQuantity={movementItem.quantity}
          onSuccess={refresh}
        />
      )}
    </div>
  )
}
