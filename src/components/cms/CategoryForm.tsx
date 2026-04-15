'use client'

import { useState } from 'react'
import { adminCreateCategory } from '@/lib/api'

interface CategoryFormProps {
  token: string
}

export default function CategoryForm({ token }: CategoryFormProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!name.trim()) {
      setError('Category name is required')
      return
    }

    setLoading(true)
    try {
      await adminCreateCategory(token, { name: name.trim() })
      setSuccess(`Category "${name}" created successfully!`)
      setName('')
      // Optionally trigger a page refresh to see the new category
      setTimeout(() => window.location.reload(), 1500)
    } catch (err: any) {
      setError(err.message || 'Failed to create category')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="rounded-lg border border-brand-rule bg-white p-6 space-y-4">
      <h2 className="font-serif text-lg font-semibold text-brand-black">Add Category</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">
            Category Name *
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Seating, Lighting, etc."
            className="w-full rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black transition-colors"
            disabled={loading}
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 px-3 py-2 text-xs text-status-arch">
            {error}
          </div>
        )}

        {success && (
          <div className="rounded-lg bg-green-50 px-3 py-2 text-xs text-status-live">
            {success}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-black px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-black/80 transition-colors disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Category'}
        </button>
      </form>
    </div>
  )
}
