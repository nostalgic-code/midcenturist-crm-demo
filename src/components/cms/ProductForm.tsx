'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faCloudArrowUp, faXmark, faGripVertical } from '@fortawesome/free-solid-svg-icons'
import type { ProductFormData } from '@/types/cms'

const CATEGORIES = [
  'Seating',
  'Sideboards & Storage',
  'Lighting',
  'Coffee & Side Tables',
  'Bedroom',
  'Home Décor',
]

const CONDITIONS = ['Excellent', 'Very Good', 'Good', 'Restored'] as const

interface ProductFormProps {
  initialData?: Partial<ProductFormData>
  onSubmit: (data: ProductFormData, action: 'draft' | 'publish') => Promise<void>
  isLoading?: boolean
}

type FieldErrors = Partial<Record<keyof ProductFormData, string>>

function validate(data: Omit<ProductFormData, 'photos'>): FieldErrors {
  const errors: FieldErrors = {}
  if (!data.name.trim())     errors.name = 'Name is required'
  if (!data.category)        errors.category = 'Category is required'
  if (!data.era.trim())      errors.era = 'Era is required'
  if (!data.material.trim()) errors.material = 'Material is required'
  if (!data.year || data.year < 1900) errors.year = 'Valid year is required'
  if (!data.price || data.price <= 0) errors.price = 'Price is required'
  if (!data.description.trim()) errors.description = 'Description is required'
  return errors
}

export default function ProductForm({ initialData, onSubmit, isLoading }: ProductFormProps) {
  const [form, setForm] = useState<Omit<ProductFormData, 'photos'>>({
    name:            initialData?.name ?? '',
    category:        initialData?.category ?? '',
    era:             initialData?.era ?? '',
    material:        initialData?.material ?? '',
    year:            initialData?.year ?? new Date().getFullYear(),
    condition:       initialData?.condition ?? 'Excellent',
    price:           initialData?.price ?? 0,
    originalPrice:   initialData?.originalPrice,
    description:     initialData?.description ?? '',
    badge:           initialData?.badge ?? 'none',
    status:          initialData?.status ?? 'draft',
    isUnique:        initialData?.isUnique ?? false,
    instagramPostId:  initialData?.instagramPostId ?? '',
    instagramPostUrl: initialData?.instagramPostUrl ?? '',
  })
  const [photos, setPhotos]       = useState<File[]>([])
  const [previews, setPreviews]   = useState<string[]>([])
  const [errors, setErrors]       = useState<FieldErrors>({})
  const [dragOver, setDragOver]   = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return
    const incoming = Array.from(files).slice(0, 6 - photos.length)
    const newPreviews = incoming.map((f) => URL.createObjectURL(f))
    setPhotos((prev) => [...prev, ...incoming])
    setPreviews((prev) => [...prev, ...newPreviews])
  }, [photos.length])

  const removePhoto = (i: number) => {
    setPhotos((prev) => prev.filter((_, idx) => idx !== i))
    setPreviews((prev) => prev.filter((_, idx) => idx !== i))
  }

  const set = <K extends keyof typeof form>(key: K, val: (typeof form)[K]) => {
    setForm((prev) => ({ ...prev, [key]: val }))
    setErrors((prev) => ({ ...prev, [key]: undefined }))
  }

  const handleSubmit = async (action: 'draft' | 'publish') => {
    const errs = validate(form)
    if (Object.keys(errs).length > 0) {
      setErrors(errs)
      return
    }
    await onSubmit({ ...form, photos }, action)
  }

  const inputCls = (field: keyof ProductFormData) =>
    `w-full rounded border px-3 py-2 text-sm outline-none focus:border-brand-black transition-colors ${
      errors[field] ? 'border-status-arch' : 'border-brand-rule'
    }`

  return (
    <div className="space-y-8">
      {/* Basic info */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <h2 className="font-serif text-lg font-semibold text-brand-black">Product Details</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Name *</label>
            <input className={inputCls('name')} value={form.name} onChange={(e) => set('name', e.target.value)} />
            {errors.name && <p className="mt-1 text-xs text-status-arch">{errors.name}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Category *</label>
            <select className={inputCls('category')} value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">Select category</option>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            {errors.category && <p className="mt-1 text-xs text-status-arch">{errors.category}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Era *</label>
            <input placeholder="e.g. Solid Teak · 1962" className={inputCls('era')} value={form.era} onChange={(e) => set('era', e.target.value)} />
            {errors.era && <p className="mt-1 text-xs text-status-arch">{errors.era}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Material *</label>
            <input className={inputCls('material')} value={form.material} onChange={(e) => set('material', e.target.value)} />
            {errors.material && <p className="mt-1 text-xs text-status-arch">{errors.material}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Year *</label>
            <input type="number" className={inputCls('year')} value={form.year} onChange={(e) => set('year', Number(e.target.value))} />
            {errors.year && <p className="mt-1 text-xs text-status-arch">{errors.year}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Condition *</label>
            <select className={inputCls('condition')} value={form.condition} onChange={(e) => set('condition', e.target.value as ProductFormData['condition'])}>
              {CONDITIONS.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Price (R) *</label>
            <input type="number" className={inputCls('price')} value={form.price || ''} onChange={(e) => set('price', Number(e.target.value))} />
            {errors.price && <p className="mt-1 text-xs text-status-arch">{errors.price}</p>}
          </div>

          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Original Price (R)</label>
            <input type="number" className={inputCls('originalPrice')} value={form.originalPrice ?? ''} onChange={(e) => set('originalPrice', e.target.value ? Number(e.target.value) : undefined)} placeholder="Leave blank if no sale" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Description *</label>
          <textarea
            className={`${inputCls('description')} resize-none`}
            rows={5}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
          {errors.description && <p className="mt-1 text-xs text-status-arch">{errors.description}</p>}
        </div>
      </section>

      {/* Photos */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-4">
        <h2 className="font-serif text-lg font-semibold text-brand-black">Photos</h2>
        <p className="text-xs text-brand-muted">Up to 6 photos. First image is the cover.</p>

        <div
          className={`flex min-h-32 cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 transition-colors ${
            dragOver ? 'border-brand-black bg-brand-off' : 'border-brand-rule hover:border-brand-muted'
          }`}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(e.dataTransfer.files) }}
          onClick={() => fileRef.current?.click()}
        >
          <FontAwesomeIcon icon={faCloudArrowUp} className="h-8 w-8 text-brand-muted" />
          <p className="text-sm text-brand-muted">Drag &amp; drop or click to upload</p>
          <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
        </div>

        {previews.length > 0 && (
          <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {previews.map((src, i) => (
              <div key={i} className="group relative aspect-square rounded overflow-hidden bg-brand-off">
                <Image src={src} alt="" fill className="object-cover" />
                {i === 0 && (
                  <span className="absolute bottom-0 left-0 right-0 bg-brand-black/60 py-0.5 text-center text-[10px] text-white">
                    Cover
                  </span>
                )}
                <button
                  onClick={(e) => { e.stopPropagation(); removePhoto(i) }}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-black/70 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FontAwesomeIcon icon={faXmark} className="h-2.5 w-2.5 text-white" />
                </button>
                <FontAwesomeIcon icon={faGripVertical} className="absolute left-1 top-1 h-3 w-3 text-white/60 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Publishing */}
      <section className="rounded-lg border border-brand-rule bg-white p-6 space-y-5">
        <h2 className="font-serif text-lg font-semibold text-brand-black">Publishing</h2>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Badge</label>
            <select className="w-full rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black" value={form.badge ?? 'none'} onChange={(e) => set('badge', e.target.value as ProductFormData['badge'])}>
              <option value="none">No badge</option>
              <option value="New In">New In</option>
              <option value="Last One">Last One</option>
              <option value="Sale">Sale</option>
            </select>
          </div>

          <div className="flex items-center gap-3 pt-6">
            <button
              type="button"
              onClick={() => set('isUnique', !form.isUnique)}
              className={`relative h-6 w-11 rounded-full transition-colors ${form.isUnique ? 'bg-brand-black' : 'bg-brand-rule'}`}
            >
              <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${form.isUnique ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
            <label className="text-sm text-brand-black">Unique item (featured in 2 spots)</label>
          </div>
        </div>

        <div>
          <label className="mb-1 block text-xs uppercase tracking-widest text-brand-muted">Instagram Post URL</label>
          <input
            className="w-full rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
            placeholder="https://instagram.com/p/..."
            value={form.instagramPostUrl ?? ''}
            onChange={(e) => set('instagramPostUrl', e.target.value)}
          />
        </div>
      </section>

      {/* Actions */}
      <div className="flex items-center gap-3 justify-end">
        <button
          disabled={isLoading}
          onClick={() => handleSubmit('draft')}
          className="rounded border border-brand-rule px-6 py-2.5 text-sm font-medium text-brand-black hover:bg-brand-off transition-colors disabled:opacity-50"
        >
          Save as Draft
        </button>
        <button
          disabled={isLoading}
          onClick={() => handleSubmit('publish')}
          className="rounded bg-brand-black px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-black/80 transition-colors disabled:opacity-50"
        >
          Publish
        </button>
      </div>
    </div>
  )
}
