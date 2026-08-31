'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, Printer, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export default function ReportsPage() {
  const [reportType, setReportType] = useState('stock')
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const fetchReport = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({ type: reportType })
      if (startDate) params.set('startDate', startDate)
      if (endDate) params.set('endDate', endDate)
      const res = await fetch(`/api/reports?${params.toString()}`)
      if (res.ok) setData(await res.json())
    } catch (e: any) { console.error(e) }
    finally { setLoading(false) }
  }, [reportType, startDate, endDate])

  useEffect(() => { fetchReport() }, [fetchReport])

  const categoryLabels: Record<string, string> = {
    'HARDWARE': 'Donanım', 'LICENSE': 'Lisans', 'CONSUMABLE': 'Sarf Malzemesi',
    'IN': 'Giriş', 'OUT': 'Çıkış',
  }

  const exportToCSV = () => {
    if (!data) return
    let csvContent = '\uFEFF' // UTF-8 BOM for Excel Turkish Characters
    const filename = `it_stok_rapor_${reportType}_${new Date().toISOString().slice(0, 10)}.csv`

    if (reportType === 'stock') {
      csvContent += 'Kategori;Ürün Adı;Marka/Model;Konum/Birim/Bitiş Tarihi;Stok;Eşik\n'
      data.hardware?.forEach((i: any) => {
        csvContent += `Donanım;"${i.name || ''}";"${[i.brand, i.model].filter(Boolean).join(' ')}";"${i.location || ''}";${i.quantity || 0};${i.lowStockThreshold || 5}\n`
      })
      data.licenses?.forEach((i: any) => {
        csvContent += `Lisans;"${i.softwareName || ''}";"-";"${i.expiryDate ? new Date(i.expiryDate).toLocaleDateString('tr-TR') : '-'}";${i.quantity || 0};${i.lowStockThreshold || 5}\n`
      })
      data.consumables?.forEach((i: any) => {
        csvContent += `Sarf Malzemesi;"${i.name || ''}";"${i.brand || ''}";"${i.unit || 'Adet'}";${i.quantity || 0};${i.lowStockThreshold || 5}\n`
      })
    } else if (reportType === 'movements' && Array.isArray(data)) {
      csvContent += 'Tarih;Kullanıcı;Ürün;Kategori;İşlem Tipi;Miktar;Açıklama\n'
      data.forEach((m: any) => {
        csvContent += `"${m.createdAt ? new Date(m.createdAt).toLocaleString('tr-TR') : '-'}";"${m.userName || ''}";"${m.itemName || ''}";"${categoryLabels[m.itemCategory] || m.itemCategory || ''}";"${categoryLabels[m.movementType] || m.movementType || ''}";${m.quantity || 0};"${m.description || ''}"\n`
      })
    } else if (reportType === 'lowstock' && Array.isArray(data)) {
      csvContent += 'Ürün;Kategori;Mevcut Stok;Eşik\n'
      data.forEach((i: any) => {
        csvContent += `"${i.itemName || ''}";"${i.category || ''}";${i.quantity || 0};${i.lowStockThreshold || 5}\n`
      })
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-display font-bold tracking-tight flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-cyan-400" /> Raporlar
          </h1>
          <p className="text-muted-foreground mt-1">Stok ve hareket raporlarını görüntüleyin ve dışa aktarın</p>
        </div>
        <div className="flex items-center gap-2 no-print">
          <Button variant="secondary" onClick={exportToCSV} disabled={!data || loading}>
            <Download className="w-4 h-4" /> CSV İndir
          </Button>
          <Button variant="secondary" onClick={() => window.print()}>
            <Printer className="w-4 h-4" /> Yazdır
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-end no-print bg-card p-4 rounded-xl border border-border">
        <div>
          <label className="text-xs text-muted-foreground font-medium mb-1 block">Rapor Tipi</label>
          <select
            value={reportType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setReportType(e.target.value)}
            className="h-10 bg-muted border border-input rounded-lg px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring block"
          >
            <option value="stock">Genel Stok Durumu</option>
            <option value="movements">Stok Hareketleri Raporu</option>
            <option value="lowstock">Düşük Stok Raporu</option>
          </select>
        </div>
        {reportType === 'movements' && (
          <>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Başlangıç Tarihi</label>
              <Input type="date" value={startDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartDate(e.target.value)} className="w-40" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground font-medium mb-1 block">Bitiş Tarihi</label>
              <Input type="date" value={endDate} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndDate(e.target.value)} className="w-40" />
            </div>
          </>
        )}
        <Button variant="secondary" onClick={fetchReport}><Filter className="w-4 h-4" /> Raporu Getir</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" /></div>
      ) : reportType === 'stock' && data ? (
        <div className="space-y-6">
          {/* Hardware */}
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h3 className="font-display font-semibold mb-3">Donanım Stok Durumu</h3>
            {(data?.hardware?.length ?? 0) === 0 ? <p className="text-muted-foreground text-sm">Veri bulunamadı</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ürün</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Marka/Model</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Konum</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Stok</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Eşik</th>
                </tr></thead>
                <tbody>{data?.hardware?.map((i: any) => (
                  <tr key={i?.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium">{i?.name ?? '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{[i?.brand, i?.model].filter(Boolean).join(' ') || '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{i?.location ?? '-'}</td>
                    <td className={`py-2 px-3 text-right font-mono ${(i?.quantity ?? 0) <= (i?.lowStockThreshold ?? 5) ? 'text-red-400 font-bold' : ''}`}>{i?.quantity ?? 0}</td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">{i?.lowStockThreshold ?? 5}</td>
                  </tr>
                )) ?? null}</tbody>
              </table>
            )}
          </div>
          {/* Licenses */}
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h3 className="font-display font-semibold mb-3">Lisans Stok Durumu</h3>
            {(data?.licenses?.length ?? 0) === 0 ? <p className="text-muted-foreground text-sm">Veri bulunamadı</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Yazılım</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Bitiş Tarihi</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Stok</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Eşik</th>
                </tr></thead>
                <tbody>{data?.licenses?.map((i: any) => (
                  <tr key={i?.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium">{i?.softwareName ?? '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{i?.expiryDate ? new Date(i.expiryDate).toLocaleDateString('tr-TR') : '-'}</td>
                    <td className={`py-2 px-3 text-right font-mono ${(i?.quantity ?? 0) <= (i?.lowStockThreshold ?? 5) ? 'text-red-400 font-bold' : ''}`}>{i?.quantity ?? 0}</td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">{i?.lowStockThreshold ?? 5}</td>
                  </tr>
                )) ?? null}</tbody>
              </table>
            )}
          </div>
          {/* Consumables */}
          <div className="bg-card rounded-xl p-5 shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
            <h3 className="font-display font-semibold mb-3">Sarf Malzemesi Stok Durumu</h3>
            {(data?.consumables?.length ?? 0) === 0 ? <p className="text-muted-foreground text-sm">Veri bulunamadı</p> : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ürün</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Marka</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Birim</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Stok</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Eşik</th>
                </tr></thead>
                <tbody>{data?.consumables?.map((i: any) => (
                  <tr key={i?.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium">{i?.name ?? '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{i?.brand ?? '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{i?.unit ?? 'Adet'}</td>
                    <td className={`py-2 px-3 text-right font-mono ${(i?.quantity ?? 0) <= (i?.lowStockThreshold ?? 5) ? 'text-red-400 font-bold' : ''}`}>{i?.quantity ?? 0}</td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">{i?.lowStockThreshold ?? 5}</td>
                  </tr>
                )) ?? null}</tbody>
              </table>
            )}
          </div>
        </div>
      ) : reportType === 'movements' && Array.isArray(data) ? (
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h3 className="font-display font-semibold mb-3">Stok Hareketleri</h3>
          {data.length === 0 ? <p className="text-muted-foreground text-sm">Hareket kaydı bulunamadı</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tarih</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Kullanıcı</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ürün</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Kategori</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tip</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Miktar</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Açıklama</th>
                </tr></thead>
                <tbody>{data.map((m: any) => (
                  <tr key={m?.id} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-3 font-mono text-xs text-muted-foreground">{m?.createdAt ? new Date(m.createdAt).toLocaleString('tr-TR') : '-'}</td>
                    <td className="py-2 px-3">{m?.userName ?? '-'}</td>
                    <td className="py-2 px-3 font-medium">{m?.itemName ?? '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground text-xs">{categoryLabels?.[m?.itemCategory] ?? m?.itemCategory ?? '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-medium ${m?.movementType === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {categoryLabels?.[m?.movementType] ?? m?.movementType ?? '-'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{m?.quantity ?? 0}</td>
                    <td className="py-2 px-3 text-muted-foreground">{m?.description ?? '-'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      ) : reportType === 'lowstock' && Array.isArray(data) ? (
        <div className="bg-card rounded-xl p-5 shadow-sm border border-border" style={{ boxShadow: 'var(--shadow-md)' }}>
          <h3 className="font-display font-semibold mb-3">Düşük Stok Raporu</h3>
          {data.length === 0 ? <p className="text-muted-foreground text-sm">Düşük stoklu ürün bulunmamaktadır ✅</p> : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border bg-muted/30">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ürün</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Kategori</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Mevcut</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Eşik</th>
                </tr></thead>
                <tbody>{data.map((i: any, idx: number) => (
                  <tr key={idx} className="border-b border-border/50 hover:bg-muted/20">
                    <td className="py-2 px-3 font-medium text-red-400">{i?.itemName ?? '-'}</td>
                    <td className="py-2 px-3 text-muted-foreground">{i?.category ?? '-'}</td>
                    <td className="py-2 px-3 text-right font-mono text-red-400 font-bold">{i?.quantity ?? 0}</td>
                    <td className="py-2 px-3 text-right font-mono text-muted-foreground">{i?.lowStockThreshold ?? 5}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}
    </div>
  )
}
