'use client'

import type { Category } from '@/lib/api'

interface CategoryListProps {
  categories: Category[]
  token: string
}

export default function CategoryList({ categories }: CategoryListProps) {
  return (
    <div className="rounded-lg border border-brand-rule bg-white p-6 space-y-4">
      <h2 className="font-serif text-lg font-semibold text-brand-black">
        Categories ({categories.length})
      </h2>

      {categories.length === 0 ? (
        <div className="py-8 text-center">
          <p className="text-sm text-brand-muted">No categories yet. Create one to get started.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between rounded-lg border border-brand-rule/50 bg-brand-off px-4 py-3"
            >
              <div>
                <p className="text-sm font-medium text-brand-black">{cat.name}</p>
                <p className="text-xs text-brand-muted">{cat.slug}</p>
              </div>
              {cat.children && cat.children.length > 0 && (
                <span className="text-xs px-2 py-1 rounded-full bg-brand-black text-white">
                  {cat.children.length} subcats
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
