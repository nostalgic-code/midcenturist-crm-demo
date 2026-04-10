// ─── Route Protection Middleware ──────────────────────────────────────────────
// TODO: re-enable once backend + auth is live
//
// import { withAuth } from 'next-auth/middleware'
// export default withAuth({ pages: { signIn: '/login' } })
// export const config = {
//   matcher: ['/dashboard/:path*', '/products/:path*', '/orders/:path*',
//             '/enquiries/:path*', '/instagram/:path*', '/upcoming/:path*',
//             '/newsletter/:path*', '/settings/:path*'],
// }

import { NextResponse } from 'next/server'
export function middleware() { return NextResponse.next() }
export const config = { matcher: [] }
