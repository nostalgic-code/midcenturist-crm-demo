# Midcenturist CMS — API Implementation Guide

**API Base URL:** `https://midcenturist-api.onrender.com`  
**CMS repo:** `midcenturist-cms`  
**Status:** Core product + order admin endpoints are live. Several endpoints needed by the CMS spec are missing from the API and must be added.

---

## Environment setup

Create `.env.local` in the root of the CMS repo:

```env
NEXT_PUBLIC_API_URL=https://midcenturist-api.onrender.com
NEXTAUTH_SECRET=generate-a-long-random-string-here
NEXTAUTH_URL=http://localhost:3001
ADMIN_EMAIL=hello@midcenturist.co.za
ADMIN_PASSWORD_HASH=bcrypt-hash-of-the-password
```

For local development run the CMS on port 3001 so it doesn't clash with the storefront on 3000:

```bash
# package.json
"dev": "next dev -p 3001"
```

---

## Critical gap — the admin login endpoint is missing from the API

The CMS needs to exchange an email + password for a JWT token. This endpoint is referenced in the implementation docs but **is not listed in any route file**. It must be added to Flask before any CMS page can authenticate.

### Add this to `app/routes/admin/__init__.py` in the API repo

```python
import os
import bcrypt
from flask import Blueprint, request, jsonify
from app.utils.security import generate_admin_token

admin_auth_bp = Blueprint("admin_auth", __name__)

@admin_auth_bp.post("/admin/login")
def admin_login():
    """
    POST /api/admin/login
    Body: { "email": "...", "password": "..." }
    Returns: { "token": "jwt...", "expires_in": 86400 }
    
    Credentials are stored in environment variables — no admin users table.
    ADMIN_EMAIL and ADMIN_PASSWORD_HASH must be set on Render.
    """
    data = request.get_json(silent=True) or {}
    email = data.get("email", "").strip().lower()
    password = data.get("password", "")

    expected_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    password_hash = os.environ.get("ADMIN_PASSWORD_HASH", "")

    if not email or not password:
        return jsonify({"error": "Email and password are required"}), 400

    if email != expected_email:
        return jsonify({"error": "Invalid credentials"}), 401

    if not bcrypt.checkpw(password.encode(), password_hash.encode()):
        return jsonify({"error": "Invalid credentials"}), 401

    token = generate_admin_token(email, expires_hours=24)
    return jsonify({"token": token, "expires_in": 86400})
```

Then register it in `app/__init__.py`:

```python
from app.routes.admin.auth import admin_auth_bp
app.register_blueprint(admin_auth_bp, url_prefix="/api")
```

### Generate the bcrypt hash for the password

Run this once locally to generate the hash, then paste it into Render's environment variables:

```python
import bcrypt
password = b"your-admin-password-here"
hashed = bcrypt.hashpw(password, bcrypt.gensalt())
print(hashed.decode())
# Copy this output into ADMIN_PASSWORD_HASH on Render
```

### Add `bcrypt` to `requirements.txt` in the API repo

```
bcrypt==4.1.3
```

---

## Step 1 — Configure NextAuth in the CMS

```typescript
// src/lib/auth.ts
import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://midcenturist-api.onrender.com'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        try {
          const res = await fetch(`${API_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          })

          if (!res.ok) return null

          const { token } = await res.json()
          return { id: credentials.email, email: credentials.email, token }
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      // Store the Flask JWT in the NextAuth token on first login
      if (user) token.apiToken = (user as any).token
      return token
    },
    async session({ session, token }) {
      // Expose the Flask JWT to client components via session
      (session as any).apiToken = token.apiToken
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 24 * 60 * 60, // 24 hours — matches Flask token expiry
  },
}
```

---

## Step 2 — Create `src/lib/api.ts` for the CMS

This file is identical in shape to the storefront `api.ts` but includes all admin endpoints and attaches the Bearer token to every request.

```typescript
// src/lib/api.ts

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://midcenturist-api.onrender.com'

// ─── Types ─────────────────────────────────────────────────────────────────

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

// ─── Fetch helper ──────────────────────────────────────────────────────────

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
    const error = await res.json().catch(() => ({ error: `HTTP ${res.status}` }))
    throw new Error(error.error || error.errors?.join(', ') || `API error ${res.status}`)
  }

  return res.json()
}

// ─── Products — Admin ─────────────────────────────────────────────────────

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
  // Live API uses PATCH — note: blueprint specified PUT
  return adminFetch(`/api/admin/products/${productId}`, token, {
    method: 'PATCH',
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

// ─── Product Variants — Admin ─────────────────────────────────────────────

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
    method: 'PATCH',
    body: JSON.stringify(updates),
  })
}

// ─── Product Images — Admin ───────────────────────────────────────────────

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
    headers: { Authorization: `Bearer ${token}` },
    // No Content-Type header — browser sets it with boundary for multipart
    body: form,
  })

  if (!res.ok) throw new Error(`Image upload failed: ${res.status}`)
  return res.json()
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

// ─── Orders — Admin ───────────────────────────────────────────────────────

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
  // Live API uses PATCH /api/admin/orders/:id
  // Blueprint spec used PUT /api/admin/orders/:id/status
  // Verify which URL is live — try PATCH first
  return adminFetch(`/api/admin/orders/${orderId}`, token, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  })
}

// ─── Categories — Admin ───────────────────────────────────────────────────

export async function adminGetCategories(
  token: string
): Promise<{ categories: Category[] }> {
  // Public endpoint works fine here — no admin version needed for reads
  return adminFetch('/api/categories', token)
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

// ─── Instagram Sync — Admin ───────────────────────────────────────────────

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

// ─── Reviews — Admin ─────────────────────────────────────────────────────

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
```

---

## Step 3 — Get the token in CMS pages

Use NextAuth's `getServerSession` in server components, or `useSession` in client components:

```typescript
// Server component (e.g. dashboard/page.tsx)
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminGetOrders, adminGetProducts } from '@/lib/api'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.apiToken

  if (!token) {
    // middleware should redirect before this, but guard anyway
    redirect('/login')
  }

  const [{ orders }, { products }] = await Promise.all([
    adminGetOrders(token, { page: 1, limit: 5 }),
    adminGetProducts(token, { status: 'live' }),
  ])

  return <Dashboard recentOrders={orders} liveProducts={products} />
}
```

```typescript
// Client component — get token from useSession
'use client'
import { useSession } from 'next-auth/react'

export function ProductForm() {
  const { data: session } = useSession()
  const token = (session as any)?.apiToken

  async function handleSubmit(formData) {
    await adminCreateProduct(token, formData)
  }
}
```

---

## Step 4 — middleware.ts (route protection)

```typescript
// src/middleware.ts
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: ['/(cms)/:path*', '/dashboard/:path*', '/products/:path*', '/orders/:path*'],
}
```

---

## What each CMS page calls

| Page | API calls | Status |
|---|---|---|
| `/dashboard` | `adminGetOrders` (last 5) · `adminGetProducts` (live count) | Ready once login endpoint added |
| `/products` (list) | `adminGetProducts` · `adminGetCategories` | Ready |
| `/products/new` | `adminCreateProduct` · `adminUploadImage` · `adminGetCategories` | Ready |
| `/products/[id]` (edit) | `adminGetProduct` · `adminUpdateProduct` · `adminUploadImage` · `adminDeleteImage` · `adminMarkSold` | Ready |
| `/orders` | `adminGetOrders` | Ready |
| `/orders/[id]` | `adminGetOrder` · `adminUpdateOrderStatus` | Ready |
| `/categories` | `adminGetCategories` · `adminCreateCategory` · `adminUpdateCategory` | Ready |
| `/instagram` | `adminInstagramSync` · `adminGetInstagramPosts` | Scaffold only — needs IG credentials |
| `/reviews` | `adminGetReviews` · `adminApproveReview` | API ready |
| `/newsletter` | Missing — see below | API missing |
| `/upcoming` | Missing — see below | API missing |
| `/enquiries` | Missing — see below | API missing |
| `/settings` | Missing — see below | API missing |

---

## Gaps — what needs to be added to the API

These endpoints are required by the CMS spec but do not exist in the live API. They need to be added to the Flask repo and deployed to Render.

### 1. Admin login (most critical — blocks everything)

Already covered above. Without this, no CMS page can authenticate.

### 2. Dashboard stats endpoint

The CMS dashboard needs summary counts. Add to `app/routes/admin/__init__.py`:

```python
@admin_auth_bp.get("/admin/dashboard")
@require_admin
def admin_dashboard():
    from app.models import Product, Order, Subscriber
    from datetime import datetime, timezone, timedelta
    
    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0)

    return jsonify({
        "live_products": Product.query.filter_by(status="live").count(),
        "draft_products": Product.query.filter_by(status="draft").count(),
        "sold_products": Product.query.filter_by(status="sold").count(),
        "orders_this_month": Order.query.filter(Order.created_at >= month_start).count(),
        "pending_orders": Order.query.filter_by(status="pending").count(),
        "total_subscribers": Subscriber.query.filter_by(is_active=True).count(),
        "pending_reviews": Review.query.filter_by(is_approved=False).count(),
        "drafts_from_instagram": Product.query.filter(
            Product.status == "draft",
            Product.instagram_post_id.isnot(None)
        ).count(),
    })
```

Add to `adminFetch` calls in CMS:

```typescript
export async function adminGetDashboardStats(token: string) {
  return adminFetch<{
    live_products: number
    draft_products: number
    sold_products: number
    orders_this_month: number
    pending_orders: number
    total_subscribers: number
    pending_reviews: number
    drafts_from_instagram: number
  }>('/api/admin/dashboard', token)
}
```

### 3. Newsletter subscribers admin

The CMS `/newsletter` page needs to list and export subscribers. Add to the API:

```python
# GET /api/admin/subscribers
@require_admin
def admin_list_subscribers():
    # Filter: status=active|unsubscribed, search by email/area
    # Returns paginated subscriber list

# DELETE /api/admin/subscribers/:id (unsubscribe)
```

Add to CMS `api.ts`:

```typescript
export async function adminGetSubscribers(token: string, params?: {
  status?: 'active' | 'unsubscribed'
  search?: string
  page?: number
}): Promise<{ subscribers: Subscriber[]; total: number }> {
  // Not yet live — add after API is updated
  return adminFetch('/api/admin/subscribers', token)
}
```

### 4. Upcoming items (coming soon)

The CMS `/upcoming` page is in the spec but has no API routes. The `upcoming_items` table exists in the DB schema but needs routes.

Add to the API (`app/routes/admin/upcoming.py`):

```python
# GET  /api/admin/upcoming         — list all upcoming items
# POST /api/admin/upcoming         — create new upcoming item
# PUT  /api/admin/upcoming/:id     — update (name, status, sort_order)
# DELETE /api/admin/upcoming/:id   — delete
# POST /api/admin/upcoming/:id/convert — promote to full product (creates Product with status=draft)
# POST /api/upcoming/:id/notify    — (public) increment notify_count for storefront "Notify Me"
```

Add to CMS `api.ts`:

```typescript
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

export async function adminConvertUpcomingToProduct(
  token: string,
  upcomingId: string
): Promise<Product> {
  return adminFetch(`/api/admin/upcoming/${upcomingId}/convert`, token, { method: 'POST' })
}
```

### 5. Enquiries

The CMS spec includes an `/enquiries` page. There is no enquiries table or route in the current API. If you want a contact form on the storefront, add this:

**API — add `enquiries` table + routes:**

```python
# Table: enquiries
# id, name, email, phone, message, status (unread|read|replied), created_at

# POST /api/enquiries          — (public) submit a contact message
# GET  /api/admin/enquiries    — list all enquiries
# PATCH /api/admin/enquiries/:id — update status to read/replied
```

**CMS `api.ts`:**

```typescript
export interface Enquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: 'unread' | 'read' | 'replied'
  created_at: string
}

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
```

### 6. Settings

The CMS `/settings` page needs to read and write store-level settings. Add a `settings` table with key/value pairs, or use environment variables for the simple fields.

At minimum, the change-password action needs an endpoint:

```python
# POST /api/admin/settings/change-password
# Body: { current_password, new_password }
# Validates current, bcrypt-hashes new, updates ADMIN_PASSWORD_HASH env var
# Note: changing env vars at runtime requires Render's API — simplest approach
# is to just regenerate the hash and tell the client to update it manually
```

---

## Method mismatches — live API vs CMS calls

The live implementation uses `PATCH` for updates but the blueprint specified `PUT`. The CMS `api.ts` above uses `PATCH` to match what is actually live. If the API is updated to use `PUT`, update these functions:

| Function | Current method | Blueprint method |
|---|---|---|
| `adminUpdateProduct` | `PATCH /api/admin/products/:id` | `PUT /api/admin/products/:id` |
| `adminUpdateOrderStatus` | `PATCH /api/admin/orders/:id` | `PUT /api/admin/orders/:id/status` |

---

## Order of work for CMS

Build in this order so each step is testable:

**Sprint 1 (do now):**
1. Add login endpoint to Flask API → deploy to Render
2. Test `POST /api/admin/login` with curl — confirm you get a JWT back
3. Complete NextAuth setup in CMS (`src/lib/auth.ts`, login page, middleware)
4. Test that `/dashboard` redirects to `/login` when logged out
5. Build the products list page (`/products`) — `adminGetProducts` is ready
6. Build the product create/edit form (`/products/new`, `/products/[id]`) — `adminCreateProduct`, `adminUpdateProduct`, `adminUploadImage` are ready
7. Build the orders list + detail pages — `adminGetOrders`, `adminUpdateOrderStatus` are ready

**Sprint 2 (after Sprint 1 is working):**
8. Add dashboard stats endpoint to Flask → `GET /api/admin/dashboard`
9. Build dashboard page with real numbers
10. Add subscriber admin endpoints to Flask → build `/newsletter` page
11. Wire Instagram sync once client provides Business account credentials
12. Add upcoming items routes to Flask → build `/upcoming` page

**Sprint 3 (after IG credentials):**
13. Add enquiries table + routes → build `/enquiries` inbox
14. Add settings endpoints → build `/settings` page

---

## Testing the API right now (no frontend needed)

```bash
# 1. Health check
curl https://midcenturist-api.onrender.com/api/health

# 2. List products (public)
curl https://midcenturist-api.onrender.com/api/products

# 3. Get category tree (public)
curl https://midcenturist-api.onrender.com/api/categories

# 4. Login (once endpoint is added)
TOKEN=$(curl -s -X POST https://midcenturist-api.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"email":"hello@midcenturist.co.za","password":"your-password"}' \
  | python3 -c "import sys,json; print(json.load(sys.stdin)['token'])")

echo "Token: $TOKEN"

# 5. List all products as admin (includes drafts + sold)
curl https://midcenturist-api.onrender.com/api/admin/products \
  -H "Authorization: Bearer $TOKEN"

# 6. Create a test product
curl -X POST https://midcenturist-api.onrender.com/api/admin/products \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test Teak Chair",
    "description": "1962 Danish design",
    "era": "1960s",
    "material": "Solid Teak",
    "year": 1962,
    "condition": "Excellent",
    "status": "draft",
    "price": 4500
  }'

# 7. Update order status
curl -X PATCH https://midcenturist-api.onrender.com/api/admin/orders/ORDER-UUID-HERE \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "confirmed"}'
```
