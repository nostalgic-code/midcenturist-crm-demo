# Midcenturist CMS Implementation — Complete Setup

**Status:** ✅ Core authentication and API integration complete  
**Date:** April 14, 2026  
**Version:** Implementation Sprint 1 (Authentication & API Layer)

---

## What Has Been Implemented

### 1. **NextAuth Integration with Flask API** ✅
   - **File**: [src/lib/auth.ts](src/lib/auth.ts)
   - **Details**:
     - CredentialsProvider configured to call `POST /api/admin/login` on Flask API
     - JWT token from Flask API is stored in NextAuth session
     - Token is exposed via `session.apiToken` for use in CMS pages
     - Session strategy: JWT, 24-hour max age (matches Flask token expiry)

### 2. **Admin API Integration Layer** ✅
   - **File**: [src/lib/api.ts](src/lib/api.ts)
   - **Details**:
     - All admin endpoints from spec are implemented with Bearer token authentication
     - Helper function `adminFetch<T>()` attaches `Authorization: Bearer {token}` to all requests
     - **Implemented endpoints**:
       - Dashboard: `adminGetDashboardStats()`
       - Products: `adminGetProducts()`, `adminGetProduct()`, `adminCreateProduct()`, `adminUpdateProduct()`, `adminMarkSold()`, `adminDeleteProduct()`
       - Product Variants: `adminAddVariant()`, `adminUpdateVariant()`
       - Product Images: `adminUploadImage()`, `adminDeleteImage()`
       - Orders: `adminGetOrders()`, `adminGetOrder()`, `adminUpdateOrderStatus()`
       - Categories: `adminGetCategories()`, `adminCreateCategory()`, `adminUpdateCategory()`
       - Instagram: `adminInstagramSync()`, `adminGetInstagramPosts()`
       - Reviews: `adminGetReviews()`, `adminApproveReview()`
       - Subscribers: `adminGetSubscribers()`, `adminUnsubscribeContact()`
       - Upcoming: `adminGetUpcoming()`, `adminCreateUpcoming()`, `adminUpdateUpcoming()`, `adminDeleteUpcoming()`, `adminConvertUpcomingToProduct()`
       - Enquiries: `adminGetEnquiries()`, `adminUpdateEnquiryStatus()`
     - Complete TypeScript interfaces for all data types
     - Proper error handling with meaningful messages

### 3. **Route Protection with Middleware** ✅
   - **File**: [src/middleware.ts](src/middleware.ts)
   - **Details**:
     - Enabled `withAuth` from next-auth/middleware
     - Protected routes: `/cms/*`, `/dashboard/*`, `/products/*`, `/orders/*`, `/enquiries/*`, `/instagram/*`, `/upcoming/*`, `/newsletter/*`, `/settings/*`
     - Automatic redirect to `/login` for unauthenticated access
     - NextAuth session required to access protected routes

### 4. **Login Page** ✅
   - **File**: [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx)
   - **Details**:
     - Replaced mock demo page with real login form
     - Form fields: Email, Password
     - Uses `signIn('credentials', ...)` from next-auth/react
     - Error handling for invalid credentials
     - Loading state during authentication
     - Redirects to `/dashboard` on successful login
     - Shows API URL for transparency

### 5. **NextAuth Route Handler** ✅
   - **File**: [src/app/api/auth/[...nextauth]/route.ts](src/app/api/auth/[...nextauth]/route.ts)
   - **Details**:
     - Already configured and working
     - Exports GET and POST handlers for NextAuth

### 6. **Environment Configuration** ✅
   - **File**: [.env.local.example](.env.local.example)
   - **Updated with**:
     - Comprehensive setup instructions
     - API configuration guidance
     - Authentication testing procedures
     - Troubleshooting guide
     - Flask API setup reference

---

## Current Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Midcenturist CMS (Next.js)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Pages (/dashboard, /products, /orders, etc.)          │
│    ↓                                                    │
│  Protected by middleware.ts (withAuth)                 │
│    ↓                                                    │
│  API calls via lib/api.ts (adminFetch)                │
│    ↓                                                    │
│  Authorization: Bearer {token from NextAuth}           │
│    ↓                                                    │
│ ┌───────────────────────────────────────────────────┐  │
│ │ NextAuth Session                                  │  │
│ │ ├─ session.user.email                             │  │
│ │ ├─ session.apiToken (Flask JWT)                   │  │
│ │ └─ Callback to /api/auth/[...nextauth]/route.ts   │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
└─────────────────────────────────────────────────────────┘
          ↓ HTTPS
┌─────────────────────────────────────────────────────────┐
│         Flask API (https://midcenturist-api...)         │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  POST /api/admin/login (email, password)               │
│    Returns: { token, expires_in }                      │
│                                                         │
│  GET /api/admin/products (Bearer token)                │
│  POST /api/admin/products (Bearer token)               │
│  PATCH /api/admin/products/:id (Bearer token)          │
│  ... (all other endpoints)                             │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## How to Use This Implementation

### **Local Development**

1. **Setup environment**:
   ```bash
   cp .env.local.example .env.local
   # Edit .env.local with your values
   ```

2. **Required .env.local values**:
   ```env
   NEXT_PUBLIC_API_URL=https://midcenturist-api.onrender.com (or your Flask API)
   NEXTAUTH_SECRET=your-random-secret-here
   NEXTAUTH_URL=http://localhost:3001
   ADMIN_EMAIL=hello@midcenturist.co.za
   ```

3. **Install and run**:
   ```bash
   npm install
   npm run dev    # Starts on http://localhost:3001
   ```

4. **Navigate to login**:
   ```
   http://localhost:3001/login
   ```

5. **Sign in with Flask API credentials**:
   - Email: hello@midcenturist.co.za
   - Password: (whatever you set on Flask API)

6. **Access dashboard**:
   ```
   http://localhost:3001/dashboard
   ```

### **Testing Authentication**

Before logging in, verify the Flask API is working:

```bash
# Test health check
curl https://midcenturist-api.onrender.com/api/health

# Test admin login endpoint
curl -X POST https://midcenturist-api.onrender.com/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "hello@midcenturist.co.za",
    "password": "your-admin-password"
  }'

# Expected response: { "token": "eyJ0eXAiOiJKV1QiLCJhbGc...", "expires_in": 86400 }
```

### **Using the API in CMS Pages**

**Server Component Example** (e.g., dashboard/page.tsx):
```typescript
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { adminGetOrders, adminGetProducts } from '@/lib/api'

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.apiToken

  if (!token) redirect('/login')

  const [{ orders }, { products }] = await Promise.all([
    adminGetOrders(token, { page: 1, limit: 5 }),
    adminGetProducts(token, { status: 'live' }),
  ])

  return <Dashboard recentOrders={orders} liveProducts={products} />
}
```

**Client Component Example**:
```typescript
'use client'
import { useSession } from 'next-auth/react'
import { adminCreateProduct } from '@/lib/api'

export function ProductForm() {
  const { data: session } = useSession()
  const token = (session as any)?.apiToken

  async function handleCreateProduct(formData) {
    const product = await adminCreateProduct(token, formData)
    // ...
  }

  return <form onSubmit={handleCreateProduct}>{/* ... */}</form>
}
```

---

## What's Ready for Development

### **Sprint 1 Features (Ready to build)**
1. ✅ **Login/Authentication** - Complete
2. ✅ **Route Protection** - Complete
3. ✅ **API Integration** - Complete
4. 🚧 **Dashboard Page** - Ready to build (API function exists)
5. 🚧 **Products List** - Ready to build (API functions exist)
6. 🚧 **Products Create/Edit** - Ready to build (API functions exist)
7. 🚧 **Orders List/Detail** - Ready to build (API functions exist)

### **Sprint 2 Features (Blocked until Flask API adds endpoints)**
- Dashboard stats endpoint (`GET /api/admin/dashboard`) — **MISSING from Flask API**
- Subscriber admin endpoints (`GET /api/admin/subscribers`) — **MISSING from Flask API**
- Upcoming items routes — **MISSING from Flask API**

### **Sprint 3 Features (Additional)**
- Enquiries routes — **MISSING from Flask API**
- Settings endpoints — **MISSING from Flask API**

---

## Critical Prerequisites

⚠️ **Before any CMS page can work, the Flask API must have these in place:**

1. **Admin Login Endpoint** — `POST /api/admin/login`
   - Body: `{ "email": "...", "password": "..." }`
   - Returns: `{ "token": "jwt...", "expires_in": 86400 }`
   - **Status**: ❌ NOT YET DEPLOYED (see implementation_cms.md for Flask code)

2. **Bearer Token Validation** — All `/api/admin/*` endpoints must:
   - Accept `Authorization: Bearer {token}` header
   - Validate token is valid JWT
   - Reject with 401 if invalid

3. **Environment Variables on Render**:
   - `ADMIN_EMAIL` — must match login email
   - `ADMIN_PASSWORD_HASH` — bcrypt hash of password
   - Both must be set before CMS can authenticate

---

## Troubleshooting

### "Invalid email or password" at login
1. Test Flask API login endpoint directly:
   ```bash
   curl -X POST https://midcenturist-api.onrender.com/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"email":"hello@midcenturist.co.za","password":"test-password"}'
   ```
2. If that fails, the Flask API isn't responding correctly
3. Check Flask API is deployed and `/api/admin/login` endpoint is implemented

### Middleware keeps redirecting to /login
1. Check `NEXTAUTH_SECRET` is set in .env.local
2. Check token is being stored in session (check browser dev tools → Application → Cookies)
3. Verify middleware.ts is enabled (not commented out)

### 401 errors from API calls
1. Verify token is being extracted from session
2. Check Authorization header is being sent: `Authorization: Bearer <token>`
3. Ensure token hasn't expired (24 hour expiry)
4. Test endpoint directly with curl including the token

---

## Files Modified

| File | Changes |
|------|---------|
| [src/lib/auth.ts](src/lib/auth.ts) | Updated to use Flask API `/api/admin/login` endpoint |
| [src/lib/api.ts](src/lib/api.ts) | Completely rewritten with all admin endpoints + Bearer auth |
| [src/middleware.ts](src/middleware.ts) | Enabled route protection with withAuth |
| [src/app/(auth)/login/page.tsx](src/app/(auth)/login/page.tsx) | Replaced mock with real login form using NextAuth |
| [.env.local.example](.env.local.example) | Updated with comprehensive setup instructions |

---

## Next Steps

### **Immediate (blockers)**
1. ❌ Add Flask API `/api/admin/login` endpoint (see implementation_cms.md)
2. ❌ Deploy Flask API to Render with `ADMIN_EMAIL` and `ADMIN_PASSWORD_HASH` env vars
3. ✅ Verify CMS can login and reach `/dashboard`

### **Short term (Sprint 1)**
4. Build Dashboard page component
5. Build Products list page
6. Build Products create/edit pages
7. Build Orders list/detail pages

### **Medium term (Sprint 2)**
8. Add dashboard stats endpoint to Flask API
9. Add subscriber admin endpoints to Flask API
10. Build Newsletter subscribers page
11. Build Upcoming items management page

### **Later (Sprint 3)**
12. Add enquiries table + routes to Flask API
13. Add settings endpoints to Flask API
14. Build Contact forms inbox page
15. Build Settings page

---

## Key Integration Points

All CMS pages should follow this pattern:

```typescript
// Server components
const session = await getServerSession(authOptions)
const token = (session as any)?.apiToken
const data = await adminGetXxx(token, params)

// Client components
const { data: session } = useSession()
const token = (session as any)?.apiToken
await adminXxx(token, data)
```

**Important**: Always pass `token` as the first argument to any `admin*` function from `lib/api.ts`.

---

## Deployment

### **Vercel/Render to Production**
1. Set environment variables:
   ```
   NEXT_PUBLIC_API_URL=https://midcenturist-api.onrender.com
   NEXTAUTH_SECRET=<generate-new-long-random-string>
   NEXTAUTH_URL=https://your-cms-domain.com
   ```

2. Ensure Flask API ADMIN_EMAIL and ADMIN_PASSWORD_HASH are set on Render

3. Deploy CMS with git push

4. Test login at https://your-cms-domain.com/login

---

**Implementation completed:** April 14, 2026  
**Ready for:** CMS page development & Flask API login endpoint addition
