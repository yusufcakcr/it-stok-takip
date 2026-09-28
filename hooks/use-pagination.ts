'use client'

import { useState } from 'react'

export const DEFAULT_TABLE_PAGE_SIZE = 25

/** İstemci tarafı sayfalama. Liste küçülürse (arama/silme) sayfa numarası son sayfaya çekilir. */
export function usePagination<T>(items: T[], pageSize = DEFAULT_TABLE_PAGE_SIZE) {
  const [requestedPage, setPage] = useState(1)
  const pageCount = Math.max(1, Math.ceil(items.length / pageSize))
  const page = Math.min(Math.max(requestedPage, 1), pageCount)
  const start = (page - 1) * pageSize

  return {
    pageItems: items.slice(start, start + pageSize),
    page,
    pageCount,
    setPage,
    total: items.length,
    from: items.length ? start + 1 : 0,
    to: Math.min(start + pageSize, items.length),
  }
}
