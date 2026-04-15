// ─── Flask API Integration ────────────────────────────────────────────────────
// Admin API calls with Bearer token authentication
// All functions require a Flask JWT token obtained from POST /api/admin/login

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://midcenturist-api.onrender.com'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ProductStatus = 'live' | 'draft' | 'sold' | 'archived'
export type ProductCondition = 'Excellent' | 'Very Good' | 'Good' | 'Restored'
export type ProductBadge = 'New In' | 'Last One' | 'Sale'
export type OrderStatus = 'pending' | 'confirmed' | 'paid' | 'shipped' | 'collected' | 'delivered' | 'cancelled'
export type FulfillmentType = 'collection' | 'shipping'

export interface ProductVariant {
  id: string
  product_id: string
  name: string | null
  price: number
  sale_price: number | null
  effective_price: number
  on_sale: boolean
  sku: string | null
  stock_qty: number
  is_available: boolean
}

export interface ProductImage {
  id: string
  product_id: string
  variant_id: string | null
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}

export interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  children?: Category[]
}

export interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  era: string | null
  material: string | null
  year: number | null
  condition: ProductCondition | null
  status: ProductStatus
  badge: ProductBadge | null
  is_featured: boolean
  is_unique: boolean
  category: Category | null
  variants: ProductVariant[]
  images: ProductImage[]
  primary_image: ProductImage | null
  instagram_post_id: string | null
  instagram_post_url: string | null
  sold_at: string | null
  archive_at: string | null
  created_at: string
  updated_at: string
}

export interface Order {
  id: string
  order_number: string
  status: OrderStatus
  fulfillment_type: FulfillmentType
  total_amount: number
  billing_address: {
    name: string
    email: string
    phone: string
    address_line1?: string
    city?: string
    province?: string
    postal_code?: string
  }
  shipping_address: object | null
  collection_address: object | null
  notes: string | null
  created_at: string
  items: Array<{
    quantity: number
    price_at_purchase: number
    line_total: number
    product_snapshot: Record<string, unknown>
  }>
  payments: Array<{
    id: string
    method: string
    status: string
    amount: number
    transaction_id: string | null
    paid_at: string | null
  }>
}

export interface Review {
  id: string
  reviewer_name: string
  rating: number
  comment: string | null
  is_approved?: boolean
  created_at: string
}

export interface Subscriber {
  id: string
  email: string
  first_name: string | null
  last_name: string | null
  phone: string | null
  area: string | null
  source: string
  is_active: boolean
  subscribed_at: string
}

export interface UpcomingItem {
  id: string
  name: string
  description: string | null
  estimated_price: number | null
  status: 'coming-soon' | 'sourced' | 'in-restoration' | 'expected-this-week'
  notify_count: number
  sort_order: number
  created_at: string
}

export interface Enquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: 'unread' | 'read' | 'replied'
  created_at: string
}

export interface CreateProductPayload {
  name: string
  description?: string
  category_id?: string
  era?: string
  material?: string
  year?: number
  condition?: ProductCondition
  status?: ProductStatus
  badge?: ProductBadge | null
  is_featured?: boolean
  is_unique?: boolean
  instagram_post_id?: string
  instagram_post_url?: string
  price?: number           // creates a default single variant
  sale_price?: number
  variants?: Array<{
    name?: string
    price: number
    sale_price?: number
    sku?: string
    stock_qty?: number
  }>
}

export interface DashboardStats {
  live_products: number
  draft_products: number
  sold_products: number
  orders_this_month: number
  pending_orders: number
  total_subscribers: number
  pending_reviews: number
  drafts_from_instagram: number
}

// ─── Fetch helper ─────────────────────────────────────────────────────────────

async function adminFetch<T>(
  path: string,
  token: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options?.headers,
    },
    ...options,
  })

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`
    try {
      const error = await res.json()
      console.error('API Error Response:', error)
      errorMsg = error.error || error.errors?.join(', ') || error.message || errorMsg
    } catch (parseErr) {
      console.error('Could not parse error response:', parseErr)
    }
    throw new Error(errorMsg)
  }

  return res.json()
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export async function adminGetDashboardStats(token: string): Promise<DashboardStats> {
  return adminFetch<DashboardStats>('/api/admin/dashboard', token)
}

// ─── Products — Admin ─────────────────────────────────────────────────────────

export async function adminGetProducts(
  token: string,
  params: {
    status?: ProductStatus
    category?: string
    search?: string
    sort?: 'newest' | 'price-high' | 'price-low' | 'name'
    page?: number
    limit?: number
  } = {}
): Promise<{ products: Product[]; total: number; page: number }> {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.category) q.set('category', params.category)
  if (params.search) q.set('search', params.search)
  if (params.sort) q.set('sort', params.sort)
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  return adminFetch(`/api/admin/products?${q}`, token)
}

export async function adminGetProduct(token: string, productId: string): Promise<Product> {
  return adminFetch(`/api/admin/products/${productId}`, token)
}

export async function adminCreateProduct(
  token: string,
  payload: CreateProductPayload
): Promise<Product> {
  return adminFetch('/api/admin/products', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function adminUpdateProduct(
  token: string,
  productId: string,
  payload: Partial<CreateProductPayload>
): Promise<Product> {
  return adminFetch(`/api/admin/products/${productId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function adminMarkSold(token: string, productId: string): Promise<Product> {
  return adminFetch(`/api/admin/products/${productId}/mark-sold`, token, { method: 'POST' })
}

export async function adminDeleteProduct(
  token: string,
  productId: string,
  permanent = false
): Promise<{ message: string }> {
  return adminFetch(
    `/api/admin/products/${productId}${permanent ? '?permanent=true' : ''}`,
    token,
    { method: 'DELETE' }
  )
}

// ─── Product Variants — Admin ─────────────────────────────────────────────────

export async function adminAddVariant(
  token: string,
  productId: string,
  variant: { name?: string; price: number; sale_price?: number; sku?: string; stock_qty?: number }
): Promise<ProductVariant> {
  return adminFetch(`/api/admin/products/${productId}/variants`, token, {
    method: 'POST',
    body: JSON.stringify(variant),
  })
}

export async function adminUpdateVariant(
  token: string,
  productId: string,
  variantId: string,
  updates: Partial<{ name: string; price: number; sale_price: number | null; stock_qty: number; is_available: boolean }>
): Promise<ProductVariant> {
  return adminFetch(`/api/admin/products/${productId}/variants/${variantId}`, token, {
    method: 'PUT',
    body: JSON.stringify(updates),
  })
}

// ─── Product Images — Admin ───────────────────────────────────────────────────

export async function adminUploadImage(
  token: string,
  productId: string,
  file: File,
  altText?: string
): Promise<ProductImage> {
  const form = new FormData()
  form.append('file', file)
  if (altText) form.append('alt_text', altText)

  const res = await fetch(`${BASE_URL}/api/admin/products/${productId}/images`, {
    method: 'POST',
    headers: { 
      'Authorization': `Bearer ${token}`,
      // Don't set Content-Type — browser will set it with multipart boundary
    },
    body: form,
  })

  if (!res.ok) {
    let errorMsg = `HTTP ${res.status}`
    try {
      const error = await res.json()
      console.error('Image upload error response:', error)
      errorMsg = error.error || error.errors?.join(', ') || error.message || errorMsg
    } catch (parseErr) {
      console.error('Could not parse error response:', parseErr)
    }
    throw new Error(errorMsg)
  }
  return res.json()
}

export function getImageUrl(imagePath: string | undefined): string {
  if (!imagePath) return '/placeholder.png'
  // API now returns full absolute URLs
  if (imagePath.startsWith('http')) return imagePath
  // Fallback for older relative URLs (shouldn't happen now)
  if (imagePath.startsWith('/api/images/')) return `${BASE_URL}${imagePath}`
  return imagePath
}

export async function adminDeleteImage(
  token: string,
  productId: string,
  imageId: string
): Promise<{ message: string }> {
  return adminFetch(`/api/admin/products/${productId}/images/${imageId}`, token, {
    method: 'DELETE',
  })
}

// ─── Orders — Admin ───────────────────────────────────────────────────────────

export async function adminGetOrders(
  token: string,
  params: {
    status?: OrderStatus
    fulfillment_type?: FulfillmentType
    page?: number
    limit?: number
  } = {}
): Promise<{ orders: Order[]; total: number; page: number }> {
  const q = new URLSearchParams()
  if (params.status) q.set('status', params.status)
  if (params.fulfillment_type) q.set('fulfillment_type', params.fulfillment_type)
  if (params.page) q.set('page', String(params.page))
  if (params.limit) q.set('limit', String(params.limit))
  return adminFetch(`/api/admin/orders?${q}`, token)
}

export async function adminGetOrder(token: string, orderId: string): Promise<Order> {
  return adminFetch(`/api/admin/orders/${orderId}`, token)
}

export async function adminUpdateOrderStatus(
  token: string,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  return adminFetch(`/api/admin/orders/${orderId}/status`, token, {
    method: 'PUT',
    body: JSON.stringify({ status }),
  })
}

// ─── Categories — Admin ───────────────────────────────────────────────────────

export async function adminGetCategories(): Promise<{ categories: Category[] }> {
  // Public endpoint — no authentication needed
  const res = await fetch(`${BASE_URL}/api/categories`)
  if (!res.ok) throw new Error(`Failed to fetch categories: ${res.status}`)
  return res.json()
}

export async function adminCreateCategory(
  token: string,
  payload: { name: string; parent_id?: string }
): Promise<Category> {
  return adminFetch('/api/admin/categories', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function adminUpdateCategory(
  token: string,
  categoryId: string,
  payload: { name?: string; parent_id?: string | null }
): Promise<Category> {
  return adminFetch(`/api/admin/categories/${categoryId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}
// ─── Newsletter Subscription (Public) ──────────────────────────────────────────

export async function subscribeToNewsletter(payload: {
  email: string
  first_name?: string
  last_name?: string
  phone?: string
  area?: string
}): Promise<Subscriber> {
  const res = await fetch(`${BASE_URL}/api/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const error = await res.json().catch(() => ({}))
    throw new Error(error.error || `Failed to subscribe: ${res.status}`)
  }
  return res.json()
}
// ─── Instagram Sync — Admin ───────────────────────────────────────────────────

export async function adminInstagramSync(
  token: string
): Promise<{ synced: number; new_drafts: Array<{ post_id: string; name: string }>; message: string }> {
  return adminFetch('/api/admin/instagram/sync', token, { method: 'POST' })
}

export async function adminGetInstagramPosts(
  token: string
): Promise<{ posts: Array<{ id: string; caption: string; media_url: string; permalink: string; already_imported: boolean }> }> {
  return adminFetch('/api/admin/instagram/posts', token)
}

// ─── Reviews — Admin ──────────────────────────────────────────────────────────

export async function adminGetReviews(
  token: string,
  approved?: boolean
): Promise<{ reviews: Review[] }> {
  const q = approved !== undefined ? `?approved=${approved}` : ''
  return adminFetch(`/api/admin/reviews${q}`, token)
}

export async function adminApproveReview(
  token: string,
  reviewId: string,
  approved: boolean
): Promise<{ message: string; review: Review }> {
  return adminFetch(`/api/admin/reviews/${reviewId}/approve`, token, {
    method: 'PUT',
    body: JSON.stringify({ approved }),
  })
}

// ─── Newsletter Subscribers — Admin ────────────────────────────────────────────

export async function adminGetSubscribers(
  token: string,
  params?: {
    status?: 'active' | 'unsubscribed'
    search?: string
    page?: number
  }
): Promise<{ subscribers: Subscriber[]; total: number }> {
  const q = new URLSearchParams()
  if (params?.status) q.set('status', params.status)
  if (params?.search) q.set('search', params.search)
  if (params?.page) q.set('page', String(params.page))
  return adminFetch(`/api/admin/subscribers?${q}`, token)
}

export async function adminUnsubscribeContact(
  token: string,
  subscriberId: string
): Promise<{ message: string }> {
  return adminFetch(`/api/admin/subscribers/${subscriberId}`, token, { method: 'DELETE' })
}

// ─── Upcoming Items — Admin ───────────────────────────────────────────────────

export async function adminGetUpcoming(token: string): Promise<{ items: UpcomingItem[] }> {
  return adminFetch('/api/admin/upcoming', token)
}

export async function adminCreateUpcoming(
  token: string,
  payload: Pick<UpcomingItem, 'name' | 'description' | 'estimated_price' | 'status'>
): Promise<UpcomingItem> {
  return adminFetch('/api/admin/upcoming', token, {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function adminUpdateUpcoming(
  token: string,
  upcomingId: string,
  payload: Partial<Pick<UpcomingItem, 'name' | 'description' | 'estimated_price' | 'status' | 'sort_order'>>
): Promise<UpcomingItem> {
  return adminFetch(`/api/admin/upcoming/${upcomingId}`, token, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
}

export async function adminDeleteUpcoming(
  token: string,
  upcomingId: string
): Promise<{ message: string }> {
  return adminFetch(`/api/admin/upcoming/${upcomingId}`, token, { method: 'DELETE' })
}

export async function adminConvertUpcomingToProduct(
  token: string,
  upcomingId: string
): Promise<Product> {
  return adminFetch(`/api/admin/upcoming/${upcomingId}/convert`, token, { method: 'POST' })
}

// ─── Enquiries — Admin ────────────────────────────────────────────────────────

export async function adminGetEnquiries(token: string): Promise<{ enquiries: Enquiry[]; unread_count: number }> {
  return adminFetch('/api/admin/enquiries', token)
}

export async function adminUpdateEnquiryStatus(
  token: string,
  enquiryId: string,
  status: 'read' | 'replied'
): Promise<Enquiry> {
  return adminFetch(`/api/admin/enquiries/${enquiryId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ─── Settings (Not yet implemented on Flask API) ────────────────────────────

export interface Settings {
  storeName: string
  contactEmail: string
  contactPhone: string
  collectionAddress: string
  businessEmail: string
  notifications: {
    newOrder: boolean
    newEnquiry: boolean
    newSubscriber: boolean
    instagramDraft: boolean
  }
  payfast: {
    merchantId: string
    merchantKey: string
  }
  yoco: {
    publicKey: string
    secretKey: string
  }
  defaultShippingMessage: string
  autoArchiveDays: number
}

// Change admin account password
export async function changePassword(token: string, currentPassword: string, newPassword: string): Promise<void> {
  return adminFetch('/api/admin/password', token, {
    method: 'POST',
    body: JSON.stringify({
      current_password: currentPassword,
      new_password: newPassword,
    }),
  })
}

// ─── Public API Wrappers (for pages without token in context) ─────────────────

// Enquiries
export async function getEnquiries(token?: string): Promise<Enquiry[]> {
  if (!token) return []
  const result = await adminGetEnquiries(token)
  return result.enquiries
}

export async function updateEnquiryStatus(
  token: string | undefined,
  enquiryId: string,
  status: 'read' | 'replied'
): Promise<Enquiry> {
  if (!token) throw new Error('No token provided')
  return adminUpdateEnquiryStatus(token, enquiryId, status)
}

// Orders
export async function getOrders(
  token?: string,
  params?: { page?: number; status?: string; fulfilment?: string }
): Promise<{ orders: Order[]; total: number }> {
  if (!token) return { orders: [], total: 0 }
  return adminGetOrders(token, {
    page: params?.page,
    status: params?.status as OrderStatus | undefined,
    fulfillment_type: params?.fulfilment as FulfillmentType | undefined,
  })
}

export async function updateOrderStatus(
  token: string | undefined,
  orderId: string,
  status: OrderStatus
): Promise<Order> {
  if (!token) throw new Error('No token provided')
  return adminUpdateOrderStatus(token, orderId, status)
}

export async function exportOrdersCSV(token?: string): Promise<Blob> {
  if (!token) throw new Error('No token provided')
  const res = await fetch(`${BASE_URL}/api/admin/orders/export/csv`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to export orders')
  return res.blob()
}

// Subscribers
export async function getSubscribers(
  token?: string,
  params?: { status?: string; search?: string; page?: number; area?: string }
): Promise<{ subscribers: Subscriber[]; total: number }> {
  if (!token) return { subscribers: [], total: 0 }
  return adminGetSubscribers(token, {
    status: params?.status as 'active' | 'unsubscribed' | undefined,
    search: params?.search,
    page: params?.page,
  })
}

export async function exportSubscribersCSV(token?: string): Promise<Blob> {
  if (!token) throw new Error('No token provided')
  const res = await fetch(`${BASE_URL}/api/admin/subscribers/export/csv`, {
    headers: { 'Authorization': `Bearer ${token}` },
  })
  if (!res.ok) throw new Error('Failed to export subscribers')
  return res.blob()
}

// Upcoming
export async function getUpcoming(token?: string): Promise<UpcomingItem[]> {
  if (!token) return []
  const result = await adminGetUpcoming(token)
  return result.items
}

export async function createUpcoming(
  token: string | undefined,
  payload: Pick<UpcomingItem, 'name' | 'description' | 'estimated_price' | 'status'>
): Promise<UpcomingItem> {
  if (!token) throw new Error('No token provided')
  return adminCreateUpcoming(token, payload)
}

export async function deleteUpcoming(token: string | undefined, upcomingId: string): Promise<void> {
  if (!token) throw new Error('No token provided')
  await adminDeleteUpcoming(token, upcomingId)
}

export async function convertUpcomingToProduct(token: string | undefined, upcomingId: string): Promise<Product> {
  if (!token) throw new Error('No token provided')
  return adminConvertUpcomingToProduct(token, upcomingId)
}
