'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons'
import ProductTable from '@/components/cms/ProductTable'
import { adminGetProducts, adminMarkSold, adminDeleteProduct } from '@/lib/api'
import type { Product } from '@/lib/api'

const CATEGORIES = [
  'All',
  'Seating',
  'Sideboards & Storage',
  'Lighting',
  'Coffee & Side Tables',
  'Bedroom',
  'Home Décor',
]

const PAGE_SIZE = 20

export default function ProductsPage() {
  const { data: session } = useSession()
  const [products, setProducts] = useState<Product[]>([])
  const [total, setTotal]       = useState(0)
  const [page, setPage]         = useState(1)
  const [loading, setLoading]   = useState(true)
  const [search, setSearch]     = useState('')
  const [status, setStatus]     = useState('')
  const [category, setCategory] = useState('')
  const [sort, setSort]         = useState('newest')
  const [confirm, setConfirm]   = useState<{ action: 'sold' | 'delete'; id: string } | null>(null)

  const token = (session as any)?.apiToken

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await adminGetProducts(token, { search, status: (status as any) || undefined, category: category === 'All' ? '' : category, sort: (sort as any), page })
      setProducts(res.products)
      setTotal(res.total)
    } catch {
      /* handled gracefully */
    } finally {
      setLoading(false)
    }
  }, [search, status, category, sort, page, token])

  useEffect(() => { load() }, [load])

  const handleMarkSold = (id: string) => setConfirm({ action: 'sold', id })
  const handleDelete   = (id: string) => setConfirm({ action: 'delete', id })

  const handleConfirm = async () => {
    if (!confirm || !token) return
    if (confirm.action === 'sold') await adminMarkSold(token, confirm.id)
    else await adminDeleteProduct(token, confirm.id)
    setConfirm(null)
    load()
  }

  const totalPages = Math.ceil(total / PAGE_SIZE)

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted" />
          <input
            type="search"
            placeholder="Search products…"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
            className="w-full rounded border border-brand-rule py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-black transition-colors"
          />
        </div>

        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); setPage(1) }}
          className="rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
        >
          <option value="">All Statuses</option>
          <option value="live">Live</option>
          <option value="draft">Draft</option>
          <option value="sold">Sold</option>
          <option value="archived">Archived</option>
        </select>

        <select
          value={category}
          onChange={(e) => { setCategory(e.target.value); setPage(1) }}
          className="rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>

        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
        >
          <option value="newest">Newest</option>
          <option value="price-desc">Price: High–Low</option>
          <option value="price-asc">Price: Low–High</option>
          <option value="name-asc">Name A–Z</option>
        </select>

        <span className="ml-auto text-xs text-brand-muted">{total} product{total !== 1 ? 's' : ''}</span>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-white border border-brand-rule" />
      ) : (
        <ProductTable products={products} onMarkSold={handleMarkSold} onDelete={handleDelete} />
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
            className="flex h-8 w-8 items-center justify-center rounded border border-brand-rule disabled:opacity-40 hover:bg-brand-off transition-colors"
          >
            <FontAwesomeIcon icon={faChevronLeft} className="h-3 w-3" />
          </button>
          <span className="text-sm text-brand-muted">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="flex h-8 w-8 items-center justify-center rounded border border-brand-rule disabled:opacity-40 hover:bg-brand-off transition-colors"
          >
            <FontAwesomeIcon icon={faChevronRight} className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Confirm dialog */}
      {confirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30" onClick={() => setConfirm(null)} />
          <div className="relative z-10 w-full max-w-sm rounded-xl bg-white p-6 shadow-xl">
            <h3 className="font-serif text-lg font-semibold text-brand-black">
              {confirm.action === 'sold' ? 'Mark as Sold?' : 'Delete Product?'}
            </h3>
            <p className="mt-2 text-sm text-brand-muted">
              {confirm.action === 'sold'
                ? 'This will mark the product as sold and start the 30-day auto-archive countdown.'
                : 'This action cannot be undone. The product and its images will be permanently deleted.'}
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setConfirm(null)}
                className="rounded border border-brand-rule px-5 py-2 text-sm hover:bg-brand-off transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirm}
                className={`rounded px-5 py-2 text-sm font-medium text-white transition-colors ${
                  confirm.action === 'delete' ? 'bg-status-arch hover:bg-red-700' : 'bg-brand-black hover:bg-brand-black/80'
                }`}
              >
                {confirm.action === 'sold' ? 'Mark as Sold' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
