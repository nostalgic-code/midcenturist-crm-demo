// ─── CMS TypeScript Interfaces ───────────────────────────────────────────────

export interface StatCard {
  label: string
  value: string | number
  icon: string
  trend?: string
  trendUp?: boolean
}

export interface Product {
  id: string
  name: string
  category: string
  era: string
  material: string
  year: number
  price: number
  originalPrice?: number
  status: 'live' | 'draft' | 'sold' | 'archived'
  badge?: 'New In' | 'Last One' | 'Sale'
  imageUrl: string
  instagramPostId?: string
  createdAt: string
  soldAt?: string
  archiveAt?: string
}

export interface ProductFormData {
  name: string
  category: string
  era: string
  material: string
  year: number
  condition: 'Excellent' | 'Very Good' | 'Good' | 'Restored'
  price: number
  originalPrice?: number
  description: string
  badge?: 'New In' | 'Last One' | 'Sale' | 'none'
  status: 'live' | 'draft'
  isUnique: boolean
  photos: File[]
  instagramPostId?: string
  instagramPostUrl?: string
}

export interface OrderItem {
  productId: string
  productName: string
  price: number
  imageUrl: string
}

export interface Order {
  id: string
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone: string
  items: OrderItem[]
  total: number
  status: 'pending' | 'confirmed' | 'shipped' | 'collected' | 'cancelled'
  fulfilmentType: 'shipping' | 'collection'
  shippingAddress?: string
  createdAt: string
  notes?: string
}

export interface Enquiry {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  status: 'unread' | 'read' | 'replied'
  createdAt: string
}

export interface UpcomingItem {
  id: string
  name: string
  description?: string
  estimatedPrice?: number
  status: 'sourced' | 'in-restoration' | 'expected-this-week' | 'coming-soon'
  notifyCount: number
  createdAt: string
}

export interface Subscriber {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  area?: string
  subscribedAt: string
  status: 'active' | 'unsubscribed'
}

export interface DashboardStats {
  totalProductsLive: number
  ordersThisMonth: number
  unreadEnquiries: number
  newsletterSubscribers: number
}

export interface ActivityItem {
  type: 'order' | 'subscriber' | 'instagram'
  label: string
  detail: string
  timestamp: string
}

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
