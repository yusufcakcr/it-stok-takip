'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TablePaginationProps {
  page: number
  pageCount: number
  from: number
  to: number
  total: number
  onPageChange: (page: number) => void
}

/** Tablo altındaki "1–25 / 80" göstergesi ve önceki/sonraki düğmeleri. Tek sayfada gizlenir. */
export function TablePagination({ page, pageCount, from, to, total, onPageChange }: TablePaginationProps) {
  if (pageCount <= 1) return null
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3 border-t border-border text-sm text-muted-foreground">
      <span>{from}–{to} / {total}</span>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page - 1)} disabled={page <= 1} title="Önceki sayfa">
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <span>Sayfa {page} / {pageCount}</span>
        <Button variant="ghost" size="icon-sm" onClick={() => onPageChange(page + 1)} disabled={page >= pageCount} title="Sonraki sayfa">
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
