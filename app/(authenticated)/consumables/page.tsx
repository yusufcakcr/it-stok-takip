'use client'

import { useEffect, useState, useCallback } from 'react'
import { Package, Plus, Pencil, Trash2, ArrowLeftRight, AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ItemFormDialog } from '@/components/item-form-dialog'
import { StockMovementDialog } from '@/components/stock-movement-dialog'
import { toast } from 'sonner'

const fields = [
  { name: 'name', label: 'Ürün Adı', required: true, placeholder: 'Örn: CAT6 Kablo, Termal Macun' },
  { name: 'brand', label: 'Marka', placeholder: 'Örn: SanDisk, Duracell, Arctic' },
  { name: 'quantity', label: 'Adet / Miktar', type: 'number', required: true, placeholder: '0' },
  { name: 'unit', label: 'Birim', placeholder: 'Örn: Adet, Kutu, Paket, Metre' },
  { name: 'lowStockThreshold', label: 'Düşük Stok Eşiği', type: 'number', placeholder: '5' },
  { name: 'notes', label: 'Notlar', type: 'textarea', placeholder: 'İsteğe bağlı ek açıklamalar...' },
]

export default function ConsumablesPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [formOpen, setFormOpen] = useState(false)
  const [editItem, setEditItem] = useState<any>(null)
  const [movementItem, setMovementItem] = useState<any>(null)

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch('/api/consumables')
      if (res.ok) setItems(await res.json())
    } catch (e: any) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchItems() }, [fetchItems])

  const handleSubmit = async (data: any) => {
    const method = data?.id ? 'PUT' : 'POST'
    const res = await fetch('/api/consumables', {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    const resData = await res.json()
    if (!res.ok) {
      throw new Error(resData?.error ?? 'Hata oluştu')
    }
    toast.success(data?.id ? 'Sarf malzemesi güncellendi' : 'Yeni sarf malzemesi eklendi')
    fetchItems()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Bu sarf malzemesini silmek istediğinize emin misiniz?')) return
    const res = await fetch(`/api/consumables?id=${id}`, { method: 'DELETE' })
    const resData = await res.json()
    if (res.ok) {
      toast.success('Sarf malzemesi silindi')
      fetchItems()
    } else {
      toast.error(resData?.error ?? 'Silme işlemi başarısız')
    }
  }

  const filtered = items?.filter((i: any) =>
    (i?.name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (i?.brand ?? '').toLowerCase().includes(search.toLowerCase())
  ) ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-400" /> Sarf Malzemesi Yönetimi
          </h1>
          <p className="text-muted-foreground mt-1">Sarf malzemelerini ve stok seviyelerini yönetin</p>
        </div>
        <Button onClick={() => { setEditItem(null); setFormOpen(true) }}>
          <Plus className="w-4 h-4" /> Sarf Malzemesi Ekle
        </Button>
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input value={search} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearch(e.target.value)} placeholder="Sarf malzemesi ara..." className="pl-10" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">{search ? 'Arama sonucu bulunamadı' : 'Henüz sarf malzemesi eklenmemiş'}</div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-xl shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Ürün</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Marka</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Birim</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">Stok</th>
                <th className="text-right py-3 px-4 text-muted-foreground font-medium">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((item: any) => {
                const isLow = (item?.quantity ?? 0) <= (item?.lowStockThreshold ?? 5)
                return (
                  <tr
                    key={item?.id}
                    className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium">
                      <div className="flex items-center gap-2">
                        {isLow && <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" title="Düşük Stok" />}
                        <span>{item?.name ?? '-'}</span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">{item?.brand ?? '-'}</td>
                    <td className="py-3 px-4 text-muted-foreground">{item?.unit ?? 'Adet'}</td>
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
        title={editItem ? 'Sarf Malzemesi Düzenle' : 'Yeni Sarf Malzemesi Ekle'}
        fields={fields}
        initialData={editItem}
        onSubmit={handleSubmit}
      />

      {movementItem && (
        <StockMovementDialog
          open={!!movementItem}
          onClose={() => setMovementItem(null)}
          itemId={movementItem?.id}
          itemName={movementItem?.name ?? ''}
          itemCategory="CONSUMABLE"
          currentQuantity={movementItem?.quantity ?? 0}
          onSuccess={fetchItems}
        />
      )}
    </div>
  )
}
