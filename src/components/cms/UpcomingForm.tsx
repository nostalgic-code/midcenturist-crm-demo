'use client'

import { useState } from 'react'
import type { UpcomingItem } from '@/types/cms'

const STATUSES: { value: UpcomingItem['status']; label: string }[] = [
  { value: 'coming-soon',         label: 'Coming Soon' },
  { value: 'sourced',             label: 'Sourced' },
  { value: 'in-restoration',     label: 'In Restoration' },
  { value: 'expected-this-week', label: 'Expected This Week' },
]

interface UpcomingFormProps {
  onSubmit: (data: Omit<UpcomingItem, 'id' | 'notifyCount' | 'createdAt'>) => Promise<void>
  onClose: () => void
  isLoading?: boolean
}

export default function UpcomingForm({ onSubmit, onClose, isLoading }: UpcomingFormProps) {
  const [name, setName]           = useState('')
  const [description, setDesc]    = useState('')
  const [estimatedPrice, setPrice] = useState('')
  const [status, setStatus]       = useState<UpcomingItem['status']>('coming-soon')
  const [error, setError]         = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) { setError('Name is required'); return }
    await onSubmit({
      name: name.trim(),
      description: description.trim() || undefined,
      estimatedPrice: estimatedPrice ? Number(estimatedPrice) : undefined,
      status,
    })
    onClose()
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Name *</label>
        <input
          className={`w-full rounded border px-3 py-2 text-sm outline-none focus:border-brand-black transition-colors ${error ? 'border-status-arch' : 'border-brand-rule'}`}
          value={name}
          onChange={(e) => { setName(e.target.value); setError('') }}
          placeholder="e.g. Danish Rosewood Credenza"
        />
        {error && <p className="mt-1 text-xs text-status-arch">{error}</p>}
      </div>

      <div>
        <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Description</label>
        <textarea
          className="w-full resize-none rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black transition-colors"
          rows={3}
          value={description}
          onChange={(e) => setDesc(e.target.value)}
          placeholder="Brief description of the piece"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Estimated Price (R)</label>
          <input
            type="number"
            className="w-full rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black transition-colors"
            value={estimatedPrice}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Optional"
          />
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Status</label>
          <select
            className="w-full rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black transition-colors"
            value={status}
            onChange={(e) => setStatus(e.target.value as UpcomingItem['status'])}
          >
            {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-3 pt-2">
        <button type="button" onClick={onClose} className="rounded border border-brand-rule px-5 py-2 text-sm text-brand-muted hover:bg-brand-off transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="rounded bg-brand-black px-5 py-2 text-sm font-medium text-white hover:bg-brand-black/80 transition-colors disabled:opacity-50"
        >
          Add Item
        </button>
      </div>
    </form>
  )
}
