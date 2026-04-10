# Midcenturist SA — CMS Build Instructions

You are a senior full-stack engineer assigned to build the **Content Management System (CMS)** for the Midcenturist SA mid-century modern furniture and home décor e-commerce store.

The CMS is a **separate Next.js application** from the customer-facing storefront. It is a password-protected admin panel used exclusively by the Midcenturist SA team to manage products, orders, enquiries, Instagram sync, and newsletter subscribers.

---

## 💼 Objective

Build a clean, functional, and intuitive admin panel that allows the Midcenturist SA team — who are not technical — to manage their entire online store without touching any code. The interface must be simple, fast, and mobile-friendly since the client may manage listings from their phone.

---

## 🏷️ Brand & Design Language

| Property | Value |
|---|---|
| Tone | Clean, minimal, professional — functional over decorative |
| Primary font | Century Gothic, fallback: `'Josefin Sans', sans-serif` |
| Heading font | `'Cormorant Garamond', Georgia, serif` |
| Colour palette | Black `#0c0b0a`, white `#ffffff`, off-white `#f6f4f1`, muted `#8c8882`, rule `rgba(12,11,10,0.08)` |
| Accent | Black only — no colour accents in the CMS |
| Status colours | Active: `#16a34a` (green) · Draft: `#ca8a04` (amber) · Sold: `#8c8882` (muted) · Archived: `#dc2626` (red) |
| Icon library | Font Awesome 6 via `@fortawesome/react-fontawesome` |

---

## 🧰 Tech Stack & Structure

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Auth:** NextAuth.js — email + password, single admin user, session-based
- **API calls:** Fetch to Flask backend (base URL from `NEXT_PUBLIC_API_URL` env variable)
- **File uploads:** Handled via Flask backend, stored in AWS S3 or Cloudinary
- **Icons:** Font Awesome 6 Free
- **State management:** React `useState` / `useContext` — no external state library needed at this scale

### Folder Structure

```
/src
├── app/
│   ├── (auth)/
│   │   └── login/
│   │       └── page.tsx
│   ├── (cms)/
│   │   ├── layout.tsx          ← CMS shell: sidebar + topbar
│   │   ├── dashboard/
│   │   │   └── page.tsx
│   │   ├── products/
│   │   │   ├── page.tsx        ← Product list
│   │   │   ├── new/
│   │   │   │   └── page.tsx    ← Add product
│   │   │   └── [id]/
│   │   │       └── page.tsx    ← Edit product
│   │   ├── orders/
│   │   │   └── page.tsx
│   │   ├── enquiries/
│   │   │   └── page.tsx
│   │   ├── instagram/
│   │   │   └── page.tsx        ← Instagram sync (scaffold)
│   │   ├── upcoming/
│   │   │   └── page.tsx        ← Coming soon items
│   │   ├── newsletter/
│   │   │   └── page.tsx
│   │   └── settings/
│   │       └── page.tsx
├── components/
│   ├── cms/
│   │   ├── Sidebar.tsx
│   │   ├── Topbar.tsx
│   │   ├── StatCard.tsx
│   │   ├── ProductTable.tsx
│   │   ├── ProductForm.tsx
│   │   ├── OrderTable.tsx
│   │   ├── EnquiryTable.tsx
│   │   ├── InstagramPanel.tsx
│   │   ├── UpcomingForm.tsx
│   │   └── NewsletterTable.tsx
├── types/
│   └── cms.ts
├── lib/
│   ├── api.ts                  ← All Flask API calls
│   └── auth.ts                 ← NextAuth config
└── middleware.ts               ← Protect all /cms routes
```

---

## ✅ Tasks

---

### 1. Authentication (`/login`)

- Simple centred login page — M logo, "Midcenturist SA Admin" heading, email + password fields, Sign In button
- Uses NextAuth.js credentials provider
- On success redirects to `/dashboard`
- Failed login shows inline error message
- `middleware.ts` protects all routes under `/(cms)/` — unauthenticated users are redirected to `/login`
- No sign up — single admin account configured via environment variables

```typescript
// .env.local
NEXTAUTH_SECRET=your_secret
ADMIN_EMAIL=hello@midcenturist.co.za
ADMIN_PASSWORD=hashed_password
NEXT_PUBLIC_API_URL=https://your-flask-api.onrender.com
```

---

### 2. CMS Shell Layout (`(cms)/layout.tsx`)

The persistent shell wrapping all CMS pages. Contains:

**Sidebar (left, fixed, 240px wide on desktop)**
- Top: M logo + "Midcenturist SA" wordmark + "Admin" badge
- Navigation items with Font Awesome icons:
  - Dashboard (`fa-gauge`)
  - Products (`fa-boxes-stacked`)
  - Orders (`fa-bag-shopping`)
  - Enquiries (`fa-envelope`)
  - Instagram Sync (`fa-brands fa-instagram`)
  - Coming Soon (`fa-clock`)
  - Newsletter (`fa-paper-plane`)
  - Settings (`fa-gear`)
- Active item: black background, white text, full width
- Bottom: logged-in user email + Sign Out button
- Collapses to icon-only at `lg` breakpoint, hidden drawer on mobile

**Topbar (top, full width minus sidebar)**
- Page title pulled from route
- Right side: notification bell with unread badge, admin avatar initials circle, quick "Add Product" button

---

### 3. Dashboard (`/dashboard`)

**Stat cards row — 4 cards:**

```typescript
interface StatCard {
  label: string
  value: string | number
  icon: string        // Font Awesome icon name
  trend?: string      // e.g. "+3 this week"
  trendUp?: boolean
}
```

Cards: Total Products Live · Orders This Month · Unread Enquiries · Newsletter Subscribers

**Quick actions row:**
- Add New Product
- View Pending Instagram Drafts (with count badge)
- View Unread Enquiries (with count badge)

**Recent activity feed:**
- Last 5 orders
- Last 5 new subscribers
- Last Instagram sync timestamp + status

**Low stock / attention needed:**
- Items marked as "Last One"
- Items in draft for more than 7 days
- Sold items approaching 30-day auto-archive threshold

---

### 4. Products (`/products`)

#### Product List Page

**Filters bar:**
- Search by name
- Filter by status: All · Live · Draft · Sold · Archived
- Filter by category dropdown
- Sort by: Newest · Price high-low · Price low-high · Name A-Z

**Product table:**

```typescript
interface Product {
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
  instagramPostId?: string       // linked IG post if synced
  createdAt: string
  soldAt?: string
  archiveAt?: string             // auto-archive date (soldAt + 30 days)
}
```

- Table columns: Thumbnail · Name · Category · Price · Status · Era · Actions
- Status shown as colour-coded pill badge
- Actions: Edit (pencil icon) · Mark as Sold · Delete
- Mark as Sold sets `status: 'sold'`, records `soldAt`, calculates `archiveAt`
- Auto-archive logic: a visual countdown shows "Archives in X days" on sold items
- Sold items show greyed-out row with sold badge
- Pagination: 20 items per page

#### Add / Edit Product Form (`/products/new` and `/products/[id]`)

**Form fields:**

```typescript
interface ProductFormData {
  name: string
  category: string             // dropdown: Seating | Sideboards & Storage | Lighting | Coffee & Side Tables | Bedroom | Home Décor
  era: string                  // free text: e.g. "Solid Teak · 1962"
  material: string
  year: number
  condition: 'Excellent' | 'Very Good' | 'Good' | 'Restored'
  price: number
  originalPrice?: number       // if on sale
  description: string          // rich text or textarea
  badge?: 'New In' | 'Last One' | 'Sale' | 'none'
  status: 'live' | 'draft'
  isUnique: boolean            // unique items shown in 2 locations on storefront
  photos: File[]               // up to 6 photos, drag and drop upload
  instagramPostId?: string     // optional — link to an IG post
  instagramPostUrl?: string
}
```

- **Photo upload:** Drag and drop zone accepting up to 6 images. Preview thumbnails. Reorder by drag. First image is the cover image. Shows upload progress
- **Instagram link:** Optional field to manually link this product to an existing Instagram post URL
- **Save as Draft** and **Publish** buttons — separate actions
- **Unique item toggle:** When on, this product appears in two spots on the homepage
- Form validation inline — required fields highlighted on submit attempt
- On edit page: show which Instagram post this was synced from if applicable

---

### 5. Orders (`/orders`)

```typescript
interface Order {
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

interface OrderItem {
  productId: string
  productName: string
  price: number
  imageUrl: string
}
```

- Table view: Order # · Customer · Items · Total · Fulfilment · Status · Date · Actions
- Click row to expand full order detail
- Status update dropdown inline — change from pending → confirmed → shipped/collected
- Filter by status and fulfilment type
- Shipping requests flagged separately — shows email address to contact for courier quote
- Export to CSV button

---

### 6. Enquiries (`/enquiries`)

```typescript
interface Enquiry {
  id: string
  name: string
  email: string
  phone?: string
  message: string
  status: 'unread' | 'read' | 'replied'
  createdAt: string
}
```

- Table: Name · Email · Message preview · Status · Date
- Click to open full message in a slide-out panel
- Mark as read / replied
- Quick reply button opens default email client with pre-filled to address
- Unread count shown in sidebar badge

---

### 7. Instagram Sync (`/instagram`) — Scaffold

This page is scaffolded and visually complete but the actual OAuth flow and API calls are **not yet wired up**. They require the client's Instagram Business account credentials and will be completed in a later sprint.

**What to build now:**

**Connection status card:**
- Large status indicator: "Not Connected" in amber
- Instagram account name field (placeholder: `@midcenturist_sa`)
- "Connect Instagram Account" button — black, full width, disabled state with tooltip "Requires Instagram Business account linked to a Facebook Page"
- Explanation text: "Once connected, new Instagram posts will automatically appear as draft product listings for your review."

**How it will work — informational section:**
- Step-by-step visual showing the sync flow:
  1. You post on Instagram with product details in the caption
  2. Midcenturist detects the new post automatically
  3. A draft listing is created for your review
  4. You review, edit if needed, and publish
  5. The product goes live on your store

**Caption format guide:**
- Show the recommended caption structure the client should use
```
AVAILABLE | Danish Teak Sideboard
Era: 1962 | Material: Solid Teak | Condition: Excellent
Price: R14,500 | Ships nationwide

Description of the piece...

#midcentury #teak #midcenturistsa
```

**Draft listings queue (empty state):**
- Table header: IG Post · Detected Caption · Suggested Price · Suggested Name · Action
- Empty state: "No drafts yet — connect your Instagram account to start syncing"
- Once connected, auto-detected posts will appear here with Review and Dismiss actions

**Sync settings (disabled until connected):**
- Sync frequency: Every 4 hours (default)
- Auto-archive sold items on Instagram: toggle
- Notify me by email when new drafts are detected: toggle

---

### 8. Coming Soon / Upcoming (`/upcoming`)

```typescript
interface UpcomingItem {
  id: string
  name: string
  description?: string
  estimatedPrice?: number
  status: 'sourced' | 'in-restoration' | 'expected-this-week' | 'coming-soon'
  notifyCount: number          // number of people who clicked Notify Me
  createdAt: string
}
```

- List of upcoming pieces with status badges
- Add upcoming item form: name, description, estimated price, status
- Shows notify count per item — how many customers want to know when it goes live
- "Convert to Product" button — promotes an upcoming item to a full product listing
- Drag to reorder (controls display order on storefront)

---

### 9. Newsletter (`/newsletter`)

```typescript
interface Subscriber {
  id: string
  firstName: string
  lastName: string
  email: string
  phone?: string
  area?: string
  subscribedAt: string
  status: 'active' | 'unsubscribed'
}
```

- Table: Name · Email · Phone · Area · Date · Status
- Search and filter by area or status
- Export to CSV for use in email platforms
- Total subscriber count displayed prominently
- Unsubscribed shown greyed out

---

### 10. Settings (`/settings`)

- **Store info:** Store name, contact email, contact phone, collection address
- **Business email:** Configure the branded email address for notifications
- **Notification preferences:** Which events trigger email alerts to the admin
- **Payment gateway:** PayFast / Yoco API key fields (masked)
- **Shipping:** Default shipping message, collection point address
- **Auto-archive:** Set the number of days before sold items auto-archive (default 30)
- **Admin account:** Change password

---

## 🎨 Tailwind Config

```typescript
import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        'brand-black':  '#0c0b0a',
        'brand-white':  '#ffffff',
        'brand-off':    '#f6f4f1',
        'brand-off-d':  '#eeebe6',
        'brand-muted':  '#8c8882',
        'status-live':  '#16a34a',
        'status-draft': '#ca8a04',
        'status-sold':  '#8c8882',
        'status-arch':  '#dc2626',
      },
      fontFamily: {
        sans:  ['"Century Gothic"', '"Josefin Sans"', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
      },
    },
  },
  plugins: [],
}

export default config
```

---

## 📦 Output Requirements

| File | Description |
|---|---|
| `src/app/(auth)/login/page.tsx` | Login page |
| `src/app/(cms)/layout.tsx` | CMS shell with sidebar and topbar |
| `src/app/(cms)/dashboard/page.tsx` | Dashboard with stat cards and activity feed |
| `src/app/(cms)/products/page.tsx` | Product list with filters and table |
| `src/app/(cms)/products/new/page.tsx` | Add product form |
| `src/app/(cms)/products/[id]/page.tsx` | Edit product form |
| `src/app/(cms)/orders/page.tsx` | Orders table |
| `src/app/(cms)/enquiries/page.tsx` | Enquiries inbox |
| `src/app/(cms)/instagram/page.tsx` | Instagram sync scaffold |
| `src/app/(cms)/upcoming/page.tsx` | Coming soon items |
| `src/app/(cms)/newsletter/page.tsx` | Subscriber list |
| `src/app/(cms)/settings/page.tsx` | Settings page |
| `src/components/cms/*.tsx` | All reusable CMS components |
| `src/types/cms.ts` | All TypeScript interfaces |
| `src/lib/api.ts` | Flask API call functions |
| `src/lib/auth.ts` | NextAuth configuration |
| `src/middleware.ts` | Route protection |
| `tailwind.config.ts` | Extended Tailwind config |

---

## 📝 Notes

- **No technical knowledge assumed** from the client — every action must be labelled clearly, confirmation dialogs before destructive actions (delete, archive), helpful empty states on every table
- **Mobile-first** — the client will manage listings from their phone after posting on Instagram
- **Instagram integration is scaffolded only** — do not attempt to complete the OAuth flow or Graph API calls. These require the client's live credentials and will be wired up in Sprint 2
- **All API calls** go through `src/lib/api.ts` — no direct fetch calls inside components
- **Environment variables** for API URL, NextAuth secret, and admin credentials must never be hardcoded
- **Auto-archive logic** runs server-side via a Flask cron job — the CMS just displays the countdown and status
- **Keep it simple** — this is a one-person admin panel, not an enterprise dashboard. Prioritise clarity over feature density
- **TypeScript strictly** — all components, all props, all API response types must be typed. No `any`
