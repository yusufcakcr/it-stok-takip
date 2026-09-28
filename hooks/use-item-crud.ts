'use client'

import { useCallback, useEffect, useState } from 'react'
import { toast } from 'sonner'
import type { FormValues } from '@/components/item-form-dialog'

interface CrudMessages {
  created: string
  updated: string
  deleted: string
  confirmDelete: string
}

async function errorOf(res: Response, fallback: string): Promise<string> {
  const data: unknown = await res.json().catch(() => null)
  const error = data && typeof data === 'object' && 'error' in data ? data.error : null
  return typeof error === 'string' ? error : fallback
}

/** Donanım, lisans ve sarf malzemesi sayfalarının ortak liste / kaydet / sil akışı. */
export function useItemCrud<T extends { id: string }>(endpoint: string, messages: CrudMessages) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch(endpoint)
      if (res.ok) setItems(await res.json())
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [endpoint])

  useEffect(() => { refresh() }, [refresh])

  /** Formdan gelen veriyi kaydeder; hata olursa form içinde gösterilsin diye fırlatır. */
  const save = async (data: FormValues) => {
    const isUpdate = Boolean(data.id)
    const res = await fetch(endpoint, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error(await errorOf(res, 'Hata oluştu'))
    toast.success(isUpdate ? messages.updated : messages.created)
    refresh()
  }

  const remove = async (id: string) => {
    if (!confirm(messages.confirmDelete)) return
    const res = await fetch(`${endpoint}?id=${encodeURIComponent(id)}`, { method: 'DELETE' })
    if (res.ok) {
      toast.success(messages.deleted)
      refresh()
    } else {
      toast.error(await errorOf(res, 'Silme işlemi başarısız'))
    }
  }

  return { items, loading, refresh, save, remove }
}
