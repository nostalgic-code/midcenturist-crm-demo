// ─── Route Protection Middleware ──────────────────────────────────────────────
// Protects all CMS admin routes — redirects to login if not authenticated

import { withAuth } from 'next-auth/middleware'

export default withAuth({
  pages: { signIn: '/login' },
})

export const config = {
  matcher: [
    '/(cms)/:path*',
    '/dashboard/:path*',
    '/products/:path*',
    '/orders/:path*',
    '/enquiries/:path*',
    '/instagram/:path*',
    '/upcoming/:path*',
    '/newsletter/:path*',
    '/settings/:path*',
  ],
}
