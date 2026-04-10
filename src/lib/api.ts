// ─── Flask API Calls ──────────────────────────────────────────────────────────

import type {
  Product,
  ProductFormData,
  Order,
  Enquiry,
  UpcomingItem,
  Subscriber,
  DashboardStats,
  ActivityItem,
  Settings,
} from '@/types/cms'

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? ''

async function apiFetch<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error ${res.status}: ${text}`)
  }
  return res.json() as Promise<T>
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export function getDashboardStats(): Promise<DashboardStats> {
  return apiFetch<DashboardStats>('/api/dashboard/stats')
}

export function getDashboardActivity(): Promise<ActivityItem[]> {
  return apiFetch<ActivityItem[]>('/api/dashboard/activity')
}

// ─── Products ─────────────────────────────────────────────────────────────────

export function getProducts(params?: {
  search?: string
  status?: string
  category?: string
  sort?: string
  page?: number
}): Promise<{ products: Product[]; total: number }> {
  const qs = new URLSearchParams()
  if (params?.search)   qs.set('search', params.search)
  if (params?.status)   qs.set('status', params.status)
  if (params?.category) qs.set('category', params.category)
  if (params?.sort)     qs.set('sort', params.sort)
  if (params?.page)     qs.set('page', String(params.page))
  return apiFetch<{ products: Product[]; total: number }>(`/api/products?${qs}`)
}

export function getProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`)
}

export async function createProduct(data: ProductFormData): Promise<Product> {
  const formData = new FormData()
  const { photos, ...rest } = data
  formData.append('data', JSON.stringify(rest))
  photos.forEach((f) => formData.append('photos', f))
  const res = await fetch(`${BASE_URL}/api/products`, {
    method: 'POST',
    body: formData,
  })
  if (!res.ok) throw new Error(`API error ${res.status}`)
  return res.json() as Promise<Product>
}

export async function updateProduct(id: string, data: Partial<ProductFormData>): Promise<Product> {
  const { photos, ...rest } = data
  if (photos && photos.length > 0) {
    const formData = new FormData()
    formData.append('data', JSON.stringify(rest))
    photos.forEach((f) => formData.append('photos', f))
    const res = await fetch(`${BASE_URL}/api/products/${id}`, {
      method: 'PUT',
      body: formData,
    })
    if (!res.ok) throw new Error(`API error ${res.status}`)
    return res.json() as Promise<Product>
  }
  return apiFetch<Product>(`/api/products/${id}`, {
    method: 'PUT',
    body: JSON.stringify(rest),
  })
}

export function markProductSold(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}/sold`, { method: 'POST' })
}

export function deleteProduct(id: string): Promise<void> {
  return apiFetch<void>(`/api/products/${id}`, { method: 'DELETE' })
}

// ─── Orders ───────────────────────────────────────────────────────────────────

export function getOrders(params?: {
  status?: string
  fulfilmentType?: string
  page?: number
}): Promise<{ orders: Order[]; total: number }> {
  const qs = new URLSearchParams()
  if (params?.status)        qs.set('status', params.status)
  if (params?.fulfilmentType) qs.set('fulfilmentType', params.fulfilmentType)
  if (params?.page)          qs.set('page', String(params.page))
  return apiFetch<{ orders: Order[]; total: number }>(`/api/orders?${qs}`)
}

export function updateOrderStatus(
  id: string,
  status: Order['status'],
): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

// ─── Enquiries ────────────────────────────────────────────────────────────────

export function getEnquiries(): Promise<Enquiry[]> {
  return apiFetch<Enquiry[]>('/api/enquiries')
}

export function updateEnquiryStatus(
  id: string,
  status: Enquiry['status'],
): Promise<Enquiry> {
  return apiFetch<Enquiry>(`/api/enquiries/${id}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

// ─── Upcoming ─────────────────────────────────────────────────────────────────

export function getUpcoming(): Promise<UpcomingItem[]> {
  return apiFetch<UpcomingItem[]>('/api/upcoming')
}

export function createUpcoming(
  data: Omit<UpcomingItem, 'id' | 'notifyCount' | 'createdAt'>,
): Promise<UpcomingItem> {
  return apiFetch<UpcomingItem>('/api/upcoming', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export function updateUpcoming(
  id: string,
  data: Partial<UpcomingItem>,
): Promise<UpcomingItem> {
  return apiFetch<UpcomingItem>(`/api/upcoming/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function deleteUpcoming(id: string): Promise<void> {
  return apiFetch<void>(`/api/upcoming/${id}`, { method: 'DELETE' })
}

export function convertUpcomingToProduct(id: string): Promise<Product> {
  return apiFetch<Product>(`/api/upcoming/${id}/convert`, { method: 'POST' })
}

export function reorderUpcoming(ids: string[]): Promise<void> {
  return apiFetch<void>('/api/upcoming/reorder', {
    method: 'PUT',
    body: JSON.stringify({ ids }),
  })
}

// ─── Newsletter ───────────────────────────────────────────────────────────────

export function getSubscribers(params?: {
  search?: string
  area?: string
  status?: string
}): Promise<Subscriber[]> {
  const qs = new URLSearchParams()
  if (params?.search) qs.set('search', params.search)
  if (params?.area)   qs.set('area', params.area)
  if (params?.status) qs.set('status', params.status)
  return apiFetch<Subscriber[]>(`/api/newsletter/subscribers?${qs}`)
}

export function exportSubscribersCSV(): Promise<Blob> {
  return fetch(`${BASE_URL}/api/newsletter/subscribers/export`).then((r) => r.blob())
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function getSettings(): Promise<Settings> {
  return apiFetch<Settings>('/api/settings')
}

export function updateSettings(data: Partial<Settings>): Promise<Settings> {
  return apiFetch<Settings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
}

export function changePassword(current: string, next: string): Promise<void> {
  return apiFetch<void>('/api/settings/password', {
    method: 'PUT',
    body: JSON.stringify({ current, next }),
  })
}

// ─── Orders CSV ───────────────────────────────────────────────────────────────

export function exportOrdersCSV(): Promise<Blob> {
  return fetch(`${BASE_URL}/api/orders/export`).then((r) => r.blob())
}
