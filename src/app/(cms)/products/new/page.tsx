'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import ProductForm from '@/components/cms/ProductForm'
import { createProduct } from '@/lib/api'
import type { ProductFormData } from '@/types/cms'

export default function NewProductPage() {
  const router  = useRouter()
  const [error, setError] = useState('')

  const handleSubmit = async (data: ProductFormData, action: 'draft' | 'publish') => {
    setError('')
    try {
      const payload = { ...data, status: action === 'publish' ? 'live' : 'draft' } as ProductFormData
      await createProduct(payload)
      router.push('/products')
    } catch {
      setError('Failed to save product. Please try again.')
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>
      )}
      <ProductForm onSubmit={handleSubmit} />
    </div>
  )
}
