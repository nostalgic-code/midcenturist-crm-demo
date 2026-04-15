# CMS API Expectations — Complete Spec

**Created:** April 14, 2026  
**Purpose:** Document all Flask API endpoints and database structure required for the Midcenturist CMS to work  
**Status:** Reference guide for Flask API development

---

## Table of Contents
1. [Authentication](#authentication)
2. [Database Tables](#database-tables)
3. [API Endpoints](#api-endpoints)
4. [Data Types & Interfaces](#data-types--interfaces)
5. [Error Handling](#error-handling)

---

## Authentication

### **Mechanism**
- **Type**: JWT (JSON Web Token)
- **Location**: `Authorization: Bearer {token}` header
- **Token Source**: `POST /api/admin/login` endpoint
- **Token Expiry**: 24 hours (86400 seconds)
- **Required On**: All `/api/admin/*` endpoints

### **Login Endpoint**
```
POST /api/admin/login

Request Body:
{
  "email": "admin@midcenturist.co.za",
  "password": "password"
}

Response (200 OK):
{
  "token": "eyJ0eXAiOiJKV1QiLCJhbGc...",
  "expires_in": 86400
}

Response (401 Unauthorized):
{
  "error": "Invalid credentials"
}
```

**Notes:**
- Credentials stored in environment variables: `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH` (bcrypt)
- No admin users table needed — single hardcoded admin
- Password validation: `bcrypt.checkpw(password.encode(), hash.encode())`

---

## Database Tables

### **1. products**
```sql
CREATE TABLE products (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  era VARCHAR(100),
  material VARCHAR(100),
  year INT,
  condition VARCHAR(50),  -- 'Excellent', 'Very Good', 'Good', 'Restored'
  status VARCHAR(50) NOT NULL,  -- 'live', 'draft', 'sold', 'archived'
  badge VARCHAR(50),  -- 'New In', 'Last One', 'Sale'
  is_featured BOOLEAN DEFAULT FALSE,
  is_unique BOOLEAN DEFAULT FALSE,
  category_id VARCHAR(36),
  instagram_post_id VARCHAR(255),
  instagram_post_url TEXT,
  sold_at DATETIME,
  archive_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
)
```

### **2. product_variants**
```sql
CREATE TABLE product_variants (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  name VARCHAR(255),
  price DECIMAL(10, 2) NOT NULL,
  sale_price DECIMAL(10, 2),
  sku VARCHAR(100),
  stock_qty INT DEFAULT 1,
  is_available BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)
```

**Notes:**
- `effective_price` = `sale_price` if sale_price exists, else `price`
- `on_sale` = true if `sale_price` is not null
- At least one variant per product (required)

### **3. product_images**
```sql
CREATE TABLE product_images (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36) NOT NULL,
  url TEXT NOT NULL,
  alt_text VARCHAR(255),
  sort_order INT DEFAULT 0,
  is_primary BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
)
```

**Notes:**
- One image per product can be marked `is_primary`
- `primary_image` in product response = image with `is_primary = TRUE`
- Images returned in order of `sort_order` ASC

### **4. categories**
```sql
CREATE TABLE categories (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) UNIQUE NOT NULL,
  parent_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (parent_id) REFERENCES categories(id)
)
```

**Notes:**
- Supports hierarchical categories (parent_id)
- Response includes nested `children` array

### **5. orders**
```sql
CREATE TABLE orders (
  id VARCHAR(36) PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(50) NOT NULL,  -- 'pending', 'confirmed', 'paid', 'shipped', 'collected', 'delivered', 'cancelled'
  fulfillment_type VARCHAR(50) NOT NULL,  -- 'collection', 'shipping'
  total_amount DECIMAL(10, 2) NOT NULL,
  billing_address JSON,  -- { name, email, phone, address_line1, city, province, postal_code }
  shipping_address JSON,
  collection_address JSON,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **6. order_items**
```sql
CREATE TABLE order_items (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  variant_id VARCHAR(36),
  quantity INT NOT NULL,
  price_at_purchase DECIMAL(10, 2) NOT NULL,
  line_total DECIMAL(10, 2) NOT NULL,  -- quantity * price_at_purchase
  product_snapshot JSON,  -- snapshot of product data at time of purchase
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (variant_id) REFERENCES product_variants(id)
)
```

### **7. order_payments**
```sql
CREATE TABLE order_payments (
  id VARCHAR(36) PRIMARY KEY,
  order_id VARCHAR(36) NOT NULL,
  method VARCHAR(50),  -- 'payfast', 'yoco', 'manual', etc.
  status VARCHAR(50),  -- 'pending', 'completed', 'failed'
  amount DECIMAL(10, 2) NOT NULL,
  transaction_id VARCHAR(255),
  paid_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
)
```

### **8. reviews**
```sql
CREATE TABLE reviews (
  id VARCHAR(36) PRIMARY KEY,
  product_id VARCHAR(36),
  reviewer_name VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  rating INT NOT NULL,  -- 1-5
  comment TEXT,
  is_approved BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE SET NULL
)
```

### **9. subscribers**
```sql
CREATE TABLE subscribers (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  area VARCHAR(100),
  source VARCHAR(50),  -- 'newsletter', 'contact-form', 'import', etc.
  is_active BOOLEAN DEFAULT TRUE,
  subscribed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **10. upcoming_items**
```sql
CREATE TABLE upcoming_items (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  estimated_price DECIMAL(10, 2),
  status VARCHAR(50) NOT NULL,  -- 'coming-soon', 'sourced', 'in-restoration', 'expected-this-week'
  notify_count INT DEFAULT 0,
  sort_order INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

### **11. enquiries**
```sql
CREATE TABLE enquiries (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  message TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'unread',  -- 'unread', 'read', 'replied'
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

---

## API Endpoints

### **Auth**

#### `POST /api/admin/login`
**Requires**: Nothing (public)  
**Returns**: `{ token: string, expires_in: number }`  
**Details**: See [Authentication](#authentication) section

---

### **Dashboard**

#### `GET /api/admin/dashboard`
**Requires**: `Authorization: Bearer {token}`  
**Returns**:
```json
{
  "live_products": 10,
  "draft_products": 3,
  "sold_products": 150,
  "orders_this_month": 5,
  "pending_orders": 2,
  "total_subscribers": 250,
  "pending_reviews": 4,
  "drafts_from_instagram": 1
}
```
**Notes**: 
- Count live products with status='live'
- Count drafts with status='draft'
- Count sold with status='sold'
- Count orders created this month (>= 1st of current month)
- Count orders with status='pending'
- Count subscribers with is_active=true
- Count reviews with is_approved=false
- Count products with status='draft' AND instagram_post_id IS NOT NULL

---

### **Products**

#### `GET /api/admin/products?status=live&page=1&limit=20&search=teak&sort=newest`
**Requires**: `Authorization: Bearer {token}`  
**Query Params**:
- `status`: 'live' | 'draft' | 'sold' | 'archived' (optional)
- `category`: category slug (optional)
- `search`: search in name/description (optional)
- `sort`: 'newest' | 'price-high' | 'price-low' | 'name' (optional)
- `page`: number (optional, default 1)
- `limit`: number (optional, default 20)

**Returns**:
```json
{
  "products": [
    {
      "id": "uuid",
      "name": "Danish Teak Chair",
      "slug": "danish-teak-chair",
      "description": "...",
      "era": "1960s",
      "material": "Teak",
      "year": 1962,
      "condition": "Excellent",
      "status": "live",
      "badge": "New In",
      "is_featured": false,
      "is_unique": true,
      "category": {
        "id": "uuid",
        "name": "Chairs",
        "slug": "chairs",
        "parent_id": null,
        "children": []
      },
      "variants": [
        {
          "id": "uuid",
          "product_id": "uuid",
          "name": null,
          "price": 4500,
          "sale_price": null,
          "effective_price": 4500,
          "on_sale": false,
          "sku": "TEAK-001",
          "stock_qty": 1,
          "is_available": true
        }
      ],
      "images": [
        {
          "id": "uuid",
          "url": "https://...",
          "alt_text": "Front view",
          "sort_order": 0,
          "is_primary": true
        }
      ],
      "primary_image": { /* same as above */ },
      "instagram_post_id": null,
      "instagram_post_url": null,
      "sold_at": null,
      "archive_at": null,
      "created_at": "2024-01-01T10:00:00Z",
      "updated_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 125,
  "page": 1
}
```

#### `GET /api/admin/products/{productId}`
**Requires**: `Authorization: Bearer {token}`  
**Returns**: Single product object (same structure as above)

#### `POST /api/admin/products`
**Requires**: `Authorization: Bearer {token}`  
**Body**:
```json
{
  "name": "Danish Chair",
  "description": "1960s teak",
  "category_id": "uuid",
  "era": "1960s",
  "material": "Teak",
  "year": 1962,
  "condition": "Excellent",
  "status": "draft",
  "badge": "New In",
  "is_featured": false,
  "is_unique": true,
  "instagram_post_id": null,
  "instagram_post_url": null,
  "price": 4500,
  "sale_price": null,
  "variants": [
    {
      "name": "Red",
      "price": 4500,
      "sale_price": null,
      "sku": "RED-001",
      "stock_qty": 1
    }
  ]
}
```
**Returns**: Created product object  
**Notes**:
- If `price` is provided, create default variant
- If `variants` array provided, create each variant
- Generate URL-friendly `slug` from name

#### `PATCH /api/admin/products/{productId}`
**Requires**: `Authorization: Bearer {token}`  
**Body**: Partial product object (any fields)  
**Returns**: Updated product object

#### `POST /api/admin/products/{productId}/mark-sold`
**Requires**: `Authorization: Bearer {token}`  
**Returns**: Updated product with `status: 'sold'` and `sold_at: now()`

#### `DELETE /api/admin/products/{productId}?permanent=true`
**Requires**: `Authorization: Bearer {token}`  
**Query Params**:
- `permanent`: true = delete from DB, false (default) = soft delete (status='archived')

**Returns**: `{ "message": "Product deleted" }`

---

### **Product Variants**

#### `POST /api/admin/products/{productId}/variants`
**Requires**: `Authorization: Bearer {token}`  
**Body**:
```json
{
  "name": "Red",
  "price": 4500,
  "sale_price": null,
  "sku": "RED-001",
  "stock_qty": 1
}
```
**Returns**: Created variant object

#### `PATCH /api/admin/products/{productId}/variants/{variantId}`
**Requires**: `Authorization: Bearer {token}`  
**Body**: Partial variant (name, price, sale_price, stock_qty, is_available)  
**Returns**: Updated variant object

---

### **Product Images**

#### `POST /api/admin/products/{productId}/images`
**Requires**: `Authorization: Bearer {token}`, multipart/form-data  
**Body**:
```
file: <File>
alt_text: "Front view" (optional)
```
**Returns**: Created image object

#### `DELETE /api/admin/products/{productId}/images/{imageId}`
**Requires**: `Authorization: Bearer {token}`  
**Returns**: `{ "message": "Image deleted" }`

---

### **Orders**

#### `GET /api/admin/orders?status=pending&fulfillment_type=shipping&page=1&limit=20`
**Requires**: `Authorization: Bearer {token}`  
**Query Params**:
- `status`: order status (optional)
- `fulfillment_type`: 'collection' | 'shipping' (optional)
- `page`: number (optional, default 1)
- `limit`: number (optional, default 20)

**Returns**:
```json
{
  "orders": [
    {
      "id": "uuid",
      "order_number": "ORD-2024-001",
      "status": "pending",
      "fulfillment_type": "shipping",
      "total_amount": 4500,
      "billing_address": {
        "name": "John Doe",
        "email": "john@example.com",
        "phone": "+27123456789",
        "address_line1": "123 Main St",
        "city": "Cape Town",
        "province": "WC",
        "postal_code": "8000"
      },
      "shipping_address": { /* same structure as above */ },
      "collection_address": null,
      "notes": "Please leave at front door",
      "created_at": "2024-01-01T10:00:00Z",
      "items": [
        {
          "quantity": 1,
          "price_at_purchase": 4500,
          "line_total": 4500,
          "product_snapshot": {
            "id": "uuid",
            "name": "Danish Chair",
            "sku": "TEAK-001"
          }
        }
      ],
      "payments": [
        {
          "id": "uuid",
          "method": "payfast",
          "status": "completed",
          "amount": 4500,
          "transaction_id": "PF-123456",
          "paid_at": "2024-01-01T10:05:00Z"
        }
      ]
    }
  ],
  "total": 25,
  "page": 1
}
```

#### `GET /api/admin/orders/{orderId}`
**Requires**: `Authorization: Bearer {token}`  
**Returns**: Single order object

#### `PATCH /api/admin/orders/{orderId}`
**Requires**: `Authorization: Bearer {token}`  
**Body**: `{ "status": "confirmed" }`  
**Returns**: Updated order object

---

### **Categories**

#### `GET /api/categories`
**Requires**: None (public)  
**Returns**:
```json
{
  "categories": [
    {
      "id": "uuid",
      "name": "Furniture",
      "slug": "furniture",
      "parent_id": null,
      "children": [
        {
          "id": "uuid",
          "name": "Chairs",
          "slug": "chairs",
          "parent_id": "uuid",
          "children": []
        }
      ]
    }
  ]
}
```

#### `POST /api/admin/categories`
**Requires**: `Authorization: Bearer {token}`  
**Body**: `{ "name": "Lighting", "parent_id": "uuid" }`  
**Returns**: Created category

#### `PUT /api/admin/categories/{categoryId}`
**Requires**: `Authorization: Bearer {token}`  
**Body**: `{ "name": "New Name", "parent_id": "uuid" }`  
**Returns**: Updated category

---

### **Instagram**

#### `POST /api/admin/instagram/sync`
**Requires**: `Authorization: Bearer {token}`  
**Returns**:
```json
{
  "synced": 3,
  "new_drafts": [
    { "post_id": "123", "name": "Beautiful Chair" }
  ],
  "message": "Synced 3 posts, created 2 new drafts"
}
```
**Notes**: Must have Instagram credentials configured (IG_BUSINESS_ACCOUNT_ID, IG_ACCESS_TOKEN in env)

#### `GET /api/admin/instagram/posts`
**Requires**: `Authorization: Bearer {token}`  
**Returns**:
```json
{
  "posts": [
    {
      "id": "123",
      "caption": "Beautiful vintage chair...",
      "media_url": "https://...",
      "permalink": "https://instagram.com/p/...",
      "already_imported": false
    }
  ]
}
```

---

### **Reviews**

#### `GET /api/admin/reviews?approved=false`
**Requires**: `Authorization: Bearer {token}`  
**Query Params**:
- `approved`: true | false (optional)

**Returns**:
```json
{
  "reviews": [
    {
      "id": "uuid",
      "reviewer_name": "John Doe",
      "rating": 5,
      "comment": "Excellent quality!",
      "is_approved": false,
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### `PUT /api/admin/reviews/{reviewId}/approve`
**Requires**: `Authorization: Bearer {token}`  
**Body**: `{ "approved": true }`  
**Returns**: `{ "message": "Review approved", "review": { /* review object */ } }`

---

### **Newsletter Subscribers**

#### `GET /api/admin/subscribers?status=active&search=john&page=1`
**Requires**: `Authorization: Bearer {token}`  
**Query Params**:
- `status`: 'active' | 'unsubscribed' (optional)
- `search`: search in email (optional)
- `page`: number (optional)

**Returns**:
```json
{
  "subscribers": [
    {
      "id": "uuid",
      "email": "john@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "phone": "+27123456789",
      "area": "Cape Town",
      "source": "newsletter",
      "is_active": true,
      "subscribed_at": "2024-01-01T10:00:00Z"
    }
  ],
  "total": 250
}
```

#### `DELETE /api/admin/subscribers/{subscriberId}`
**Requires**: `Authorization: Bearer {token}`  
**Returns**: `{ "message": "Subscriber deleted" }`

---

### **Upcoming Items**

#### `GET /api/admin/upcoming`
**Requires**: `Authorization: Bearer {token}`  
**Returns**:
```json
{
  "items": [
    {
      "id": "uuid",
      "name": "Mid-Century Sofa",
      "description": "Awaiting restoration",
      "estimated_price": 8000,
      "status": "in-restoration",
      "notify_count": 12,
      "sort_order": 1,
      "created_at": "2024-01-01T10:00:00Z"
    }
  ]
}
```

#### `POST /api/admin/upcoming`
**Requires**: `Authorization: Bearer {token}`  
**Body**:
```json
{
  "name": "Eames Lounge Chair",
  "description": "Original leather, needs reupholstering",
  "estimated_price": 12000,
  "status": "sourced"
}
```
**Returns**: Created upcoming item

#### `PUT /api/admin/upcoming/{upcomingId}`
**Requires**: `Authorization: Bearer {token}`  
**Body**: Partial item (name, description, estimated_price, status, sort_order)  
**Returns**: Updated item

#### `DELETE /api/admin/upcoming/{upcomingId}`
**Requires**: `Authorization: Bearer {token}`  
**Returns**: `{ "message": "Item deleted" }`

#### `POST /api/admin/upcoming/{upcomingId}/convert`
**Requires**: `Authorization: Bearer {token}`  
**Returns**: Created product (status='draft')  
**Notes**: Converts upcoming item to a product

---

### **Enquiries**

#### `GET /api/admin/enquiries`
**Requires**: `Authorization: Bearer {token}`  
**Returns**:
```json
{
  "enquiries": [
    {
      "id": "uuid",
      "name": "Jane Smith",
      "email": "jane@example.com",
      "phone": "+27987654321",
      "message": "Do you have this chair in white?",
      "status": "unread",
      "created_at": "2024-01-01T10:00:00Z"
    }
  ],
  "unread_count": 3
}
```

#### `PATCH /api/admin/enquiries/{enquiryId}`
**Requires**: `Authorization: Bearer {token}`  
**Body**: `{ "status": "read" }`  
**Returns**: Updated enquiry

---

## Data Types & Interfaces

### **DashboardStats**
```typescript
interface DashboardStats {
  live_products: number
  draft_products: number
  sold_products: number
  orders_this_month: number
  pending_orders: number
  total_subscribers: number
  pending_reviews: number
  drafts_from_instagram: number
}
```

### **Product**
```typescript
interface Product {
  id: string
  name: string
  slug: string
  description: string | null
  era: string | null
  material: string | null
  year: number | null
  condition: 'Excellent' | 'Very Good' | 'Good' | 'Restored' | null
  status: 'live' | 'draft' | 'sold' | 'archived'
  badge: 'New In' | 'Last One' | 'Sale' | null
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
```

### **ProductVariant**
```typescript
interface ProductVariant {
  id: string
  product_id: string
  name: string | null
  price: number
  sale_price: number | null
  effective_price: number  // computed: sale_price ?? price
  on_sale: boolean        // computed: sale_price !== null
  sku: string | null
  stock_qty: number
  is_available: boolean
}
```

### **ProductImage**
```typescript
interface ProductImage {
  id: string
  url: string
  alt_text: string | null
  sort_order: number
  is_primary: boolean
}
```

### **Category**
```typescript
interface Category {
  id: string
  name: string
  slug: string
  parent_id: string | null
  children?: Category[]  // nested children
}
```

### **Order**
```typescript
interface Order {
  id: string
  order_number: string
  status: 'pending' | 'confirmed' | 'paid' | 'shipped' | 'collected' | 'delivered' | 'cancelled'
  fulfillment_type: 'collection' | 'shipping'
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
  items: OrderItem[]
  payments: OrderPayment[]
}

interface OrderItem {
  quantity: number
  price_at_purchase: number
  line_total: number
  product_snapshot: Record<string, unknown>
}

interface OrderPayment {
  id: string
  method: string
  status: string
  amount: number
  transaction_id: string | null
  paid_at: string | null
}
```

### **Subscriber**
```typescript
interface Subscriber {
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
```

### **UpcomingItem**
```typescript
interface UpcomingItem {
  id: string
  name: string
  description: string | null
  estimated_price: number | null
  status: 'coming-soon' | 'sourced' | 'in-restoration' | 'expected-this-week'
  notify_count: number
  sort_order: number
  created_at: string
}
```

### **Enquiry**
```typescript
interface Enquiry {
  id: string
  name: string
  email: string
  phone: string | null
  message: string
  status: 'unread' | 'read' | 'replied'
  created_at: string
}
```

### **Review**
```typescript
interface Review {
  id: string
  reviewer_name: string
  rating: number
  comment: string | null
  is_approved?: boolean
  created_at: string
}
```

---

## Error Handling

### **HTTP Status Codes**
| Code | Meaning | Example Response |
|------|---------|------------------|
| 200 | Success | `{ "data": ... }` |
| 201 | Created | `{ "id": "...", ... }` |
| 400 | Bad Request | `{ "error": "Invalid input" }` |
| 401 | Unauthorized | `{ "error": "Invalid token" }` |
| 403 | Forbidden | `{ "error": "Access denied" }` |
| 404 | Not Found | `{ "error": "Product not found" }` |
| 409 | Conflict | `{ "error": "Duplicate slug" }` |
| 500 | Server Error | `{ "error": "Internal server error" }` |

### **Error Response Format**
```json
{
  "error": "Error message",
  "errors": ["Field error 1", "Field error 2"]
}
```

### **Common Validations**
- Email format validation
- Required field checks
- Unique constraint checks (email, slug)
- Status value validation (enum)
- JWT token validation & expiry
- File size limits for images
- Product slug generation (lowercase, URL-safe)

---

## Implementation Checklist

- [ ] Database schema created (all 11 tables)
- [ ] JWT token generation & validation
- [ ] `POST /api/admin/login` endpoint
- [ ] `GET /api/admin/dashboard` endpoint
- [ ] Products CRUD endpoints (5 endpoints)
- [ ] Product variants endpoints (2 endpoints)
- [ ] Product images endpoints (2 endpoints)
- [ ] Orders endpoints (3 endpoints)
- [ ] Categories endpoints (3 endpoints, 1 public)
- [ ] Instagram sync endpoints (2 endpoints)
- [ ] Reviews endpoints (2 endpoints)
- [ ] Subscribers endpoints (2 endpoints)
- [ ] Upcoming items endpoints (5 endpoints)
- [ ] Enquiries endpoints (2 endpoints)
- [ ] Error handling with proper status codes
- [ ] Authorization checks on all admin endpoints
- [ ] Image upload & storage
- [ ] Database relationships & foreign keys
- [ ] Pagination support
- [ ] Search/filter support
- [ ] Computed fields (effective_price, on_sale, primary_image)

---

**Document Version:** 1.0  
**Last Updated:** April 14, 2026  
**CMS Repository:** midcenturist-cms  
**API Repository:** midcenturist-api
