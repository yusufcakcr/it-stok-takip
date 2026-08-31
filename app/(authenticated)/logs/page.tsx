'use client'

import { useEffect, useState, useCallback } from 'react'
import { ClipboardList, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function LogsPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [category, setCategory] = useState('')
  const [searchText, setSearchText] = useState('')

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      if (category) params.set('category', category)
      const res = await fetch(`/api/logs?${params.toString()}`)
      if (res.ok) setLogs(await res.json())
    } catch (e: any) { console.error(e) }
    finally { setLoading(false) }
  }, [startDate, endDate, category])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = logs?.filter((l: any) =>
    !searchText ||
    (l?.userName ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (l?.action ?? '').toLowerCase().includes(searchText.toLowerCase()) ||
    (l?.details ?? '').toLowerCase().includes(searchText.toLowerCase())
  ) ?? []

  const actionLabels: Record<string, string> = {
    'DONANIM_EKLE': 'Donanım Ekleme',
    'DONANIM_GUNCELLE': 'Donanım Güncelleme',
    'DONANIM_SIL': 'Donanım Silme',
    'LISANS_EKLE': 'Lisans Ekleme',
    'LISANS_GUNCELLE': 'Lisans Güncelleme',
    'LISANS_SIL': 'Lisans Silme',
    'SARF_EKLE': 'Sarf Ekleme',
    'SARF_GUNCELLE': 'Sarf Güncelleme',
    'SARF_SIL': 'Sarf Silme',
    'STOK_GIRIS': 'Stok Giriş',
    'STOK_CIKIS': 'Stok Çıkış',
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
          <ClipboardList className="w-6 h-6 text-purple-400" /> İşlem Logları
        </h1>
        <p className="text-muted-foreground mt-1">Kullanıcı işlem geçmişi (proje kuralı: sadece normal kullanıcılar)</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end bg-card p-4 rounded-xl border border-border">
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Başlangıç Tarihi</label>
          <Input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Bitiş Tarihi</label>
          <Input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} className="w-40" />
        </div>
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Kategori</label>
          <select
            value={category}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCategory(e.target.value)}
            className="h-10 bg-muted border border-input rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
          >
            <option value="">Tüm Kategoriler</option>
            <option value="HARDWARE">Donanım</option>
            <option value="LICENSE">Lisans</option>
            <option value="CONSUMABLE">Sarf Malzemesi</option>
          </select>
        </div>
        <div className="relative flex-1 min-w-[180px]">
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Arama</label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input value={searchText} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchText(e.target.value)} placeholder="Kullanıcı, işlem veya detay..." className="pl-10 w-full" />
          </div>
        </div>
        <Button variant="secondary" onClick={fetchLogs}><Filter className="w-4 h-4" /> Filtrele</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">Kriterlere uygun işlem logu bulunamadı</div>
      ) : (
        <div className="overflow-x-auto bg-card rounded-xl shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Tarih</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kullanıcı</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">İşlem</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Detay</th>
                <th className="text-left py-3 px-4 text-muted-foreground font-medium">Kategori</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((log: any) => (
                <tr
                  key={log?.id}
                  className="border-b border-border/50 hover:bg-muted/30 transition-colors"
                >
                  <td className="py-3 px-4 font-mono text-xs text-muted-foreground">
                    {log?.createdAt ? new Date(log.createdAt).toLocaleString('tr-TR') : '-'}
                  </td>
                  <td className="py-3 px-4 font-medium">{log?.userName ?? '-'}</td>
                  <td className="py-3 px-4">
                    <span className="bg-primary/10 text-primary font-medium text-xs px-2.5 py-1 rounded-full">
                      {actionLabels?.[log?.action] ?? log?.action ?? '-'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">{log?.details ?? '-'}</td>
                  <td className="py-3 px-4 text-muted-foreground text-xs">
                    {log?.category === 'HARDWARE' ? 'Donanım' : log?.category === 'LICENSE' ? 'Lisans' : log?.category === 'CONSUMABLE' ? 'Sarf Malzemesi' : log?.category ?? '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
