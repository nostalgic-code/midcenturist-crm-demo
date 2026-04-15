'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import ProductForm from '@/components/cms/ProductForm'
import { adminGetProduct, adminUpdateProduct, adminUploadImage } from '@/lib/api'
import type { ProductFormData } from '@/types/cms'
import type { Product, ProductStatus } from '@/lib/api'

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const { data: session } = useSession()
  const id     = params.id as string

  const [product, setProduct]  = useState<Product | null>(null)
  const [loading, setLoading]  = useState(true)
  const [error, setError]      = useState('')
  const [saving, setSaving]    = useState(false)

  const token = (session as any)?.apiToken

  useEffect(() => {
    if (!token) return
    adminGetProduct(token, id)
      .then(setProduct)
      .catch(() => setError('Product not found.'))
      .finally(() => setLoading(false))
  }, [id, token])

  const handleSubmit = async (data: ProductFormData, action: 'draft' | 'publish') => {
    if (!token) {
      setError('Not authenticated.')
      return
    }

    setError('')
    setSaving(true)
    try {
      const payload = {
        name: data.name,
        description: data.description,
        era: data.era,
        material: data.material,
        year: data.year,
        condition: data.condition,
        status: (action === 'publish' ? 'live' : 'draft') as ProductStatus,
        badge: data.badge === 'none' ? null : data.badge,
        is_unique: data.isUnique,
        instagram_post_id: data.instagramPostId || null,
        instagram_post_url: data.instagramPostUrl || null,
      }
      
      // Update product
      await adminUpdateProduct(token, id, payload)
      console.log('Product updated')
      
      // Upload new photos if any
      if (data.photos && data.photos.length > 0) {
        console.log(`Uploading ${data.photos.length} new images...`)
        const uploadErrors = []
        for (let i = 0; i < data.photos.length; i++) {
          const photo = data.photos[i]
          try {
            console.log(`Uploading photo ${i + 1}/${data.photos.length}: ${photo.name}`)
            const result = await adminUploadImage(token, id, photo, photo.name)
            console.log(`Photo ${i + 1} uploaded successfully:`, result)
          } catch (photoErr: any) {
            console.error(`Photo ${i + 1} upload error:`, photoErr)
            uploadErrors.push(`${photo.name}: ${photoErr.message}`)
          }
        }
        if (uploadErrors.length > 0) {
          console.warn('Some images failed to upload:', uploadErrors)
        }
      }
      
      router.push('/products')
    } catch (err: any) {
      setError(err.message || 'Failed to update product. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="h-64 animate-pulse rounded-lg bg-white border border-brand-rule" />
  if (error)   return <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>
  if (!product) return null

  const initialData: Partial<ProductFormData> = {
    name:            product.name,
    category:        product.category?.name || '',
    era:             product.era || '',
    material:        product.material || '',
    year:            product.year || new Date().getFullYear(),
    condition:       product.condition || 'Excellent',
    price:           product.variants?.[0]?.price || 0,
    originalPrice:   product.variants?.[0]?.sale_price || undefined,
    description:     product.description || '',
    badge:           product.badge ?? 'none',
    status:          (product.status === 'live' || product.status === 'draft') ? product.status : 'draft',
    instagramPostId: product.instagram_post_id || undefined,
    instagramPostUrl: product.instagram_post_url || undefined,
    isUnique:        product.is_unique,
    photos:          [],
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {product.instagram_post_id && (
        <div className="rounded-lg bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Synced from Instagram post: <strong>{product.instagram_post_id}</strong>
        </div>
      )}

      {product.images && product.images.length > 0 && (
        <div className="rounded-lg border border-brand-rule bg-white p-6 space-y-3">
          <h3 className="font-semibold text-sm">Current Images ({product.images.length})</h3>
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {product.images.map((img, i) => {
              // API now returns full absolute URLs
              const imageUrl = img.url.startsWith('http') ? img.url : `${process.env.NEXT_PUBLIC_API_URL || 'https://midcenturist-api.onrender.com'}${img.url}`
              console.log(`Image ${i + 1}: ${imageUrl}`)
              return (
                <div key={img.id} className="relative aspect-square rounded overflow-hidden bg-brand-off border border-brand-rule">
                  <img 
                    src={imageUrl} 
                    alt={img.alt_text || `Product image ${i + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      console.error(`Failed to load image: ${imageUrl}`, e)
                      e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="100" height="100"%3E%3Crect fill="%23f0f0f0" width="100" height="100"/%3E%3Ctext x="50" y="50" text-anchor="middle" dy=".3em" font-family="sans-serif" font-size="12" fill="%23999"%3EImage not found%3C/text%3E%3C/svg%3E'
                    }}
                  />
                  {img.is_primary && (
                    <span className="absolute bottom-0 left-0 right-0 bg-brand-black/60 py-0.5 text-center text-[10px] text-white">
                      Primary
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>
      )}
      
      <ProductForm initialData={initialData} onSubmit={handleSubmit} isLoading={saving} />
    </div>
  )
}
