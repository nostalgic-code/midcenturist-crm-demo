'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus, faTrash, faArrowRight } from '@fortawesome/free-solid-svg-icons'
import UpcomingForm from '@/components/cms/UpcomingForm'
import { getUpcoming, createUpcoming, deleteUpcoming, convertUpcomingToProduct } from '@/lib/api'
import type { UpcomingItem } from '@/types/cms'

const STATUS_STYLES: Record<UpcomingItem['status'], string> = {
  'coming-soon':         'bg-brand-off text-brand-muted',
  'sourced':             'bg-blue-100 text-blue-700',
  'in-restoration':      'bg-yellow-100 text-status-draft',
  'expected-this-week':  'bg-green-100 text-status-live',
}

const STATUS_LABELS: Record<UpcomingItem['status'], string> = {
  'coming-soon':         'Coming Soon',
  'sourced':             'Sourced',
  'in-restoration':      'In Restoration',
  'expected-this-week':  'Expected This Week',
}

export default function UpcomingPage() {
  const router = useRouter()
  const [items, setItems]       = useState<UpcomingItem[]>([])
  const [loading, setLoading]   = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [converting, setConverting] = useState<string | null>(null)

  const load = () => {
    setLoading(true)
    getUpcoming()
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleCreate = async (data: Omit<UpcomingItem, 'id' | 'notifyCount' | 'createdAt'>) => {
    await createUpcoming(data)
    load()
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Remove this upcoming item?')) return
    await deleteUpcoming(id)
    setItems((prev) => prev.filter((i) => i.id !== id))
  }

  const handleConvert = async (id: string) => {
    setConverting(id)
    try {
      const product = await convertUpcomingToProduct(id)
      router.push(`/products/${product.id}`)
    } finally {
      setConverting(null)
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-brand-muted">{items.length} upcoming item{items.length !== 1 ? 's' : ''}</p>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded bg-brand-black px-4 py-2 text-sm font-medium text-white hover:bg-brand-black/80 transition-colors"
        >
          <FontAwesomeIcon icon={faPlus} className="h-3.5 w-3.5" />
          Add Item
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-brand-rule bg-white p-6">
          <h2 className="mb-4 font-serif text-base font-semibold text-brand-black">New Upcoming Item</h2>
          <UpcomingForm onSubmit={handleCreate} onClose={() => setShowForm(false)} />
        </div>
      )}

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-white border border-brand-rule" />
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-brand-rule bg-white py-16 text-center">
          <p className="text-brand-muted">No upcoming items yet. Add your first piece.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => (
            <div key={item.id} className="flex items-start gap-4 rounded-lg border border-brand-rule bg-white p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="font-medium text-brand-black">{item.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[item.status]}`}>
                    {STATUS_LABELS[item.status]}
                  </span>
                </div>
                {item.description && (
                  <p className="mt-1 text-sm text-brand-muted">{item.description}</p>
                )}
                <div className="mt-2 flex items-center gap-4 text-xs text-brand-muted">
                  {item.estimatedPrice && (
                    <span>Est. R{item.estimatedPrice.toLocaleString()}</span>
                  )}
                  <span>{item.notifyCount} notify request{item.notifyCount !== 1 ? 's' : ''}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleConvert(item.id)}
                  disabled={converting === item.id}
                  className="flex items-center gap-1.5 rounded border border-brand-rule px-3 py-1.5 text-xs text-brand-black hover:bg-brand-off transition-colors disabled:opacity-50"
                >
                  Convert to Product
                  <FontAwesomeIcon icon={faArrowRight} className="h-3 w-3" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="flex h-8 w-8 items-center justify-center rounded hover:bg-red-50 transition-colors"
                >
                  <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5 text-status-arch" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
