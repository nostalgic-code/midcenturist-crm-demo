'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { useSession } from 'next-auth/react'
import ProductForm from '@/components/cms/ProductForm'
import { adminCreateProduct, adminGetCategories, adminUploadImage } from '@/lib/api'
import type { ProductFormData } from '@/types/cms'

export default function NewProductPage() {
  const router  = useRouter()
  const { data: session } = useSession()
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (data: ProductFormData, action: 'draft' | 'publish') => {
    const token = (session as any)?.apiToken
    if (!token) {
      setError('Not authenticated. Please login again.')
      return
    }

    setError('')
    setLoading(true)
    try {
      // Fetch categories to find the category ID
      const categoriesData = await adminGetCategories().catch(() => ({ categories: [] }))
      const selectedCategory = categoriesData.categories?.find((c: any) => c.name === data.category)
      
      // Create the product payload
      const payload = {
        name: data.name,
        description: data.description,
        category_id: selectedCategory?.id,
        era: data.era,
        material: data.material,
        year: data.year,
        condition: data.condition,
        status: action === 'publish' ? 'live' : 'draft',
        badge: data.badge === 'none' ? null : data.badge,
        is_featured: false,
        is_unique: data.isUnique,
        instagram_post_id: data.instagramPostId || null,
        instagram_post_url: data.instagramPostUrl || null,
        price: data.price,
      }
      
      console.log('Product payload:', payload)

      // Create product
      const product = await adminCreateProduct(token, payload)
      console.log('Product created:', product)
      
      // Upload photos if any
      if (data.photos && data.photos.length > 0) {
        console.log(`Uploading ${data.photos.length} photos...`)
        const uploadErrors = []
        for (let i = 0; i < data.photos.length; i++) {
          const photo = data.photos[i]
          try {
            console.log(`Uploading photo ${i + 1}/${data.photos.length}: ${photo.name}`)
            const result = await adminUploadImage(token, product.id, photo, photo.name)
            console.log(`Photo ${i + 1} uploaded successfully:`, result)
          } catch (photoErr: any) {
            console.error(`Photo ${i + 1} upload error:`, photoErr)
            uploadErrors.push(`${photo.name}: ${photoErr.message}`)
          }
        }
        if (uploadErrors.length > 0) {
          console.warn('Some images failed to upload:', uploadErrors)
          // Still proceed to products page since product was created
        }
      }

      router.push('/products')
    } catch (err: any) {
      console.error('Product creation error:', err)
      setError(err.message || 'Failed to save product. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      {error && (
        <div className="mb-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-status-arch">{error}</div>
      )}
      <ProductForm onSubmit={handleSubmit} isLoading={loading} />
    </div>
  )
}
