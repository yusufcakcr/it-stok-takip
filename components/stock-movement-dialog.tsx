'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ArrowDownCircle, ArrowUpCircle, X } from 'lucide-react'

interface StockMovementDialogProps {
  open: boolean
  onClose: () => void
  itemId: string
  itemName: string
  itemCategory: 'HARDWARE' | 'LICENSE' | 'CONSUMABLE'
  currentQuantity: number
  onSuccess: () => void
}

export function StockMovementDialog({ open, onClose, itemId, itemName, itemCategory, currentQuantity, onSuccess }: StockMovementDialogProps) {
  const [movementType, setMovementType] = useState<'IN' | 'OUT'>('IN')
  const [quantity, setQuantity] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  if (!open) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await fetch('/api/stock-movement', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemCategory, itemId, movementType, quantity, description }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data?.error ?? 'Hata oluştu')
      } else {
        onSuccess()
        onClose()
        setQuantity('')
        setDescription('')
      }
    } catch {
      setError('Bağlantı hatası')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 w-full max-w-md" style={{ boxShadow: 'var(--shadow-lg)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">Stok Hareketi</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">{itemName} • Mevcut: <span className="font-mono">{currentQuantity}</span></p>

        {error && <p className="text-destructive text-sm bg-destructive/10 rounded-lg p-2 mb-3">{error}</p>}

        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMovementType('IN')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              movementType === 'IN' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-muted text-muted-foreground'
            }`}
          >
            <ArrowDownCircle className="w-4 h-4" /> Stok Giriş
          </button>
          <button
            onClick={() => setMovementType('OUT')}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
              movementType === 'OUT' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-muted text-muted-foreground'
            }`}
          >
            <ArrowUpCircle className="w-4 h-4" /> Stok Çıkış
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-sm font-medium">Miktar</label>
            <Input type="number" min="1" value={quantity} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuantity(e.target.value)} required />
          </div>
          <div>
            <label className="text-sm font-medium">Açıklama</label>
            <Input value={description} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDescription(e.target.value)} placeholder="İsteğe bağlı" />
          </div>
          <Button type="submit" className="w-full" loading={loading}>
            {movementType === 'IN' ? 'Stok Girişi Yap' : 'Stok Çıkışı Yap'}
          </Button>
        </form>
      </div>
    </div>
  )
}
