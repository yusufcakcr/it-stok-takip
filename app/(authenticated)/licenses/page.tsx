'use client'

import { useEffect, useState, useCallback } from 'react'
import { Key, Plus, Pencil, Trash2, ArrowLeftRight, AlertTriangle, Search, CalendarClock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ItemFormDialog } from '@/components/item-form-dialog'
import { StockMovementDialog } from '@/components/stock-movement-dialog'
import { toast } from 'sonner'

const fields = [
  { name: 'softwareName', label: 'Yazılım Adı', required: true, placeholder: 'Örn: Microsoft 365, Adobe CC' },
  { name: 'licenseKey', label: 'Lisans Anahtarı', placeholder: 'Örn: XXXX-YYYY-ZZZZ' },
  { name: 'quantity', label: 'Adet / Kullanıcı Sayısı', type: 'number', required: true, placeholder: '0' },
  { name: 'expiryDate', label: 'Bitiş Tarihi', type: 'date' },
  { name: 'lowStockThreshold', label: 'Düşük Stok Eşiği', type: 'number', placeholder: '5' },
  { name: 'notes', label: 'Notlar', type: 'textarea', placeholder: 'İsteğe bağlı ek açıklamalar...' },
]

export default function LicensesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [movementItem, setMovementItem] = useState<any>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/licenses')
      if (res.ok) setItems(await res.json())
    } catch (e: any) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSubmit = async (data: any) => {
    const method = data?.id ? 'PUT' : 'POST'
    const res = await fetch('/api/licenses', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const resData = await res.json()
    if (!res.ok) {
      throw new Error(resData?.error ?? 'Hata oluştu')
    }
    toast.success(data?.id ? 'Lisans güncellendi' : 'Yeni lisans eklendi')
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu lisansı silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/licenses?id=${id}`, { method: 'DELETE' })
    const resData = await res.json()
    if (res.ok) {
      toast.success('Lisans silindi')
      fetchItems()
    } else {
      toast.error(resData?.error ?? 'Silme işlemi başarısız')
    }
  }

  const filtered = items?.filter((i: any) =>
    (i?.softwareName ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i?.licenseKey ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? []

  const isExpiringSoon = (date: string | null) => {
    if (!date) return false
    const d = new Date(date)
    const now = new Date()
    const diff = d.getTime() - now.getTime()
    return diff > 0 && diff <= 30 * 24 * 60 * 60 * 1000
  }

  const isExpired = (date: string | null) => {
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
        <Input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} placeholder="Lisans ara..." className="pl-10" />
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
              {filtered.map((item: any) => {
                const isLow = (item?.quantity ?? 0) <= (item?.lowStockThreshold ?? 5)
                const expSoon = isExpiringSoon(item?.expiryDate)
                const expired = isExpired(item?.expiryDate)
                return (
                  <tr
                    key={item?.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" title="Düşük Stok" />}
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
                        <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item?.id)} title="Sil">
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <ItemFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditItem(null) }}
        title={editItem ? 'Lisans Düzenle' : 'Yeni Lisans Ekle'}
        fields={fields}
        initialData={editItem}
        onSubmit={handleSubmit}
      />

      {movementItem && (
        <StockMovementDialog
          open={!!movementItem}
          onClose={() => setMovementItem(null)}
          itemId={movementItem?.id}
          itemName={movementItem?.softwareName ?? ''}
          itemCategory="LICENSE"
          currentQuantity={movementItem?.quantity ?? 0}
          onSuccess={fetchItems}
        />
      )}
    </div>
  )
}
