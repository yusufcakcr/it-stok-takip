'use client'

import { useEffect, useState, useCallback } from 'react'
import { Monitor, Key, Package, AlertTriangle, ArrowDownCircle, ArrowUpCircle, TrendingDown, CalendarClock } from 'lucide-react'

interface DashboardData {
  counts: { hardware: number; license: number; consumable: number }
  totals: { hardware: number; license: number; consumable: number }
  lowStockItems: any[]
  expiringLicenses: any[]
  recentMovements: any[]
}

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0)
  useEffect(() => {
    const duration = 600
    const startTime = Date.now()
    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      setDisplay(Math.floor(progress * value))
      if (progress < 1) requestAnimationFrame(animate)
      else setDisplay(value)
    }
    animate()
  }, [value])
  return <span className="font-mono">{display}</span>
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch('/api/dashboard')
      if (res.ok) {
        const json = await res.json()
        setData(json)
      }
    } catch (e: any) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="animate-spin w-8 h-8 border-2 border-primary border-t-transparent rounded-full" />
      </div>
    )
  }

  const stats = [
    { label: 'Donanım', count: data?.counts?.hardware ?? 0, total: data?.totals?.hardware ?? 0, icon: Monitor, color: 'text-blue-400', bg: 'bg-blue-400/10' },
    { label: 'Lisans', count: data?.counts?.license ?? 0, total: data?.totals?.license ?? 0, icon: Key, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
    { label: 'Sarf Malzemesi', count: data?.counts?.consumable ?? 0, total: data?.totals?.consumable ?? 0, icon: Package, color: 'text-amber-400', bg: 'bg-amber-400/10' },
    { label: 'Düşük Stok Uyarısı', count: data?.lowStockItems?.length ?? 0, total: 0, icon: AlertTriangle, color: 'text-red-400', bg: 'bg-red-400/10', isWarning: true },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">Gösterge Paneli</h1>
        <p className="text-muted-foreground mt-1">IT stok durumunun genel özeti</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat: any) => {
          const Icon = stat.icon
          return (
            <div
              key={stat.label}
              className="bg-card rounded-xl p-5 hover:bg-card/80 transition-all shadow-sm"
              style={{ boxShadow: 'var(--shadow-md)' }}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`w-10 h-10 ${stat.bg} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold"><AnimatedNumber value={stat.count} /></p>
              <p className="text-sm text-muted-foreground mt-1">
                {stat.isWarning ? 'Ürün eşiğin altında' : `${stat.label} türü • Toplam ${stat.total} adet`}
              </p>
            </div>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Warnings */}
        <div
          className="bg-card rounded-xl p-5 shadow-sm"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <TrendingDown className="w-5 h-5 text-red-400" />
            <h2 className="font-display font-semibold">Düşük Stok Uyarıları</h2>
          </div>
          {(data?.lowStockItems?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Tüm stoklar yeterli seviyede ✅</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.lowStockItems?.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between bg-red-500/5 border border-red-500/20 rounded-lg px-3 py-2">
                  <div>
                    <p className="text-sm font-medium">{item?.name ?? item?.softwareName ?? '-'}</p>
                    <p className="text-xs text-muted-foreground">{item?.categoryLabel ?? ''}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-red-400">{item?.quantity ?? 0} adet</p>
                    <p className="text-xs text-muted-foreground">Eşik: {item?.lowStockThreshold ?? 5}</p>
                  </div>
                </div>
              )) ?? null}
            </div>
          )}
        </div>

        {/* Expiring / Expired Licenses */}
        <div
          className="bg-card rounded-xl p-5 shadow-sm"
          style={{ boxShadow: 'var(--shadow-md)' }}
        >
          <div className="flex items-center gap-2 mb-4">
            <CalendarClock className="w-5 h-5 text-amber-400" />
            <h2 className="font-display font-semibold">Süresi Dolan ve Yaklaşan Lisanslar</h2>
          </div>
          {(data?.expiringLicenses?.length ?? 0) === 0 ? (
            <p className="text-muted-foreground text-sm py-4 text-center">Süresi dolmuş veya dolacak lisans yok ✅</p>
          ) : (
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {data?.expiringLicenses?.map((lic: any, i: number) => {
                const isPast = lic?.expiryDate ? new Date(lic.expiryDate) < new Date() : false
                return (
                  <div key={i} className={`flex items-center justify-between rounded-lg px-3 py-2 border ${isPast ? 'bg-red-500/10 border-red-500/30' : 'bg-amber-500/5 border-amber-500/20'}`}>
                    <div>
                      <p className="text-sm font-medium">{lic?.softwareName ?? '-'}</p>
                      <p className="text-xs text-muted-foreground font-mono">{lic?.licenseKey ? '****' + (lic.licenseKey?.slice?.(-4) ?? '') : 'Lisans Anahtarı Yok'}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-mono font-semibold ${isPast ? 'text-red-400' : 'text-amber-400'}`}>
                        {isPast ? 'Süresi Doldu' : 'Süresi Yaklaşıyor'}
                      </p>
                      <p className="text-xs text-muted-foreground font-mono">
                        {lic?.expiryDate ? new Date(lic.expiryDate).toLocaleDateString('tr-TR') : '-'}
                      </p>
                    </div>
                  </div>
                )
              }) ?? null}
            </div>
          )}
        </div>
      </div>

      {/* Recent Movements */}
      <div
        className="bg-card rounded-xl p-5 shadow-sm"
        style={{ boxShadow: 'var(--shadow-md)' }}
      >
        <h2 className="font-display font-semibold mb-4">Son Stok Hareketleri</h2>
        {(data?.recentMovements?.length ?? 0) === 0 ? (
          <p className="text-muted-foreground text-sm py-4 text-center">Henüz stok hareketi yok</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tarih</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Kullanıcı</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Ürün</th>
                  <th className="text-left py-2 px-3 text-muted-foreground font-medium">Tip</th>
                  <th className="text-right py-2 px-3 text-muted-foreground font-medium">Miktar</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentMovements?.map((m: any) => (
                  <tr key={m?.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-2 px-3 font-mono text-xs">{m?.createdAt ? new Date(m.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                    <td className="py-2 px-3">{m?.userName ?? '-'}</td>
                    <td className="py-2 px-3">{m?.itemName ?? '-'}</td>
                    <td className="py-2 px-3">
                      <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${m?.movementType === 'IN' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                        {m?.movementType === 'IN' ? <ArrowDownCircle className="w-3 h-3" /> : <ArrowUpCircle className="w-3 h-3" />}
                        {m?.movementType === 'IN' ? 'Giriş' : 'Çıkış'}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono">{m?.quantity ?? 0}</td>
                  </tr>
                )) ?? null}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
