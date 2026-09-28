'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { X } from 'lucide-react'

export interface Field {
  name: string
  label: string
  type?: string
  required?: boolean
  placeholder?: string
}

export type FormValues = Record<string, unknown>

interface ItemFormDialogProps {
  open: boolean
  onClose: () => void
  title: string
  fields: Field[]
  initialData?: object | null
  onSubmit: (data: FormValues) => Promise<void>
}

function displayValue(value: unknown): string {
  return value === null || value === undefined ? '' : String(value)
}

export function ItemFormDialog({ open, onClose, title, fields, initialData, onSubmit }: ItemFormDialogProps) {
  const [formData, setFormData] = useState<FormValues>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    setFormData(initialData ? { ...initialData } : {})
  }, [initialData, open])

  if (!open) return null

  const setField = (name: string, value: string) => setFormData((prev) => ({ ...prev, [name]: value }))

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await onSubmit(formData)
      onClose()
      setFormData({})
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Hata oluştu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div className="bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto" style={{ boxShadow: 'var(--shadow-lg)' }} onClick={(e: React.MouseEvent) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold">{title}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>

        {error && <p className="text-destructive text-sm bg-destructive/10 rounded-lg p-2 mb-3">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-3">
          {fields.map((field) => (
            <div key={field.name}>
              <label className="text-sm font-medium">{field.label}{field.required && <span className="text-destructive"> *</span>}</label>
              {field.type === 'textarea' ? (
                <textarea
                  className="w-full bg-muted border border-input rounded-lg px-3 py-2 text-sm mt-1 focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  value={displayValue(formData[field.name])}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setField(field.name, e.target.value)}
                  placeholder={field.placeholder}
                />
              ) : (
                <Input
                  type={field.type || 'text'}
                  value={displayValue(formData[field.name])}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setField(field.name, e.target.value)}
                  required={field.required}
                  placeholder={field.placeholder}
                  className="mt-1"
                />
              )}
            </div>
          ))}
          <Button type="submit" className="w-full" loading={loading}>
            {initialData ? 'Güncelle' : 'Ekle'}
          </Button>
        </form>
      </div>
    </div>
  )
}
