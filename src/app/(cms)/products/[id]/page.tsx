'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import ProductForm from '@/components/cms/ProductForm'
import { getProduct, updateProduct } from '@/lib/api'
import type { Product, ProductFormData } from '@/types/cms'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const id     = params.id as string

  const [product, setProduct]  = useState<Product | null>(null)
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState('')

  useEffect(() => {
    getProduct(id)
      .then(setProduct)
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [id])

  const handleSubmit = async (data: ProductFormData, action: 'draft' | 'publish') => {
    setError('')
    try {
      const payload = { ...data, status: action === 'publish' ? 'live' : 'draft' } as ProductFormData
      await updateProduct(id, payload)
      router.push('/products')
    } catch {
      setError('Failed to update product. Please try again.')
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-white border border-brand-rule" />
  if (error)   return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>
  if (!product) return null

  const initialData: Partial<ProductFormData> = {
    name:            product.name,
    category:        product.category,
    era:             product.era,
    material:        product.material,
    year:            product.year,
    price:           product.price,
    originalPrice:   product.originalPrice,
    badge:           product.badge ?? 'none',
    status:          product.status === 'live' || product.status === 'draft' ? product.status : 'draft',
    instagramPostId: product.instagramPostId,
    photos:          [],
  }

  return (
    <div className="mx-auto max-w-3xl">
      {product.instagramPostId && (
        <div className="mb-5 rounded-lg bg-brand-off px-4 py-3 text-sm text-brand-muted">
          Synced from Instagram post: <strong>{product.instagramPostId}</strong>
        </div>
      )}
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>
      )}
      <ProductForm initialData={initialData} onSubmit={handleSubmit} />
    </div>
  )
}
