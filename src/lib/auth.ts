// ─── NextAuth Configuration ───────────────────────────────────────────────────
// next-auth v4 — credentials provider calling Flask API /admin/login endpoint
// Stores the Flask JWT token in the NextAuth session for subsequent API calls

import type { NextAuthOptions, Account } from 'next-auth'
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

          const data = await res.json()
          // Return user object with the Flask JWT token attached
          return {
            id: credentials.email,
            email: credentials.email,
            // Store the Flask JWT token (will be passed to callbacks)
            apiToken: data.token,
          } as any
        } catch {
          return null
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      // On first login, store the Flask JWT in the token
      if (user && (user as any).apiToken) {
        token.apiToken = (user as any).apiToken
      }
      return token
    },
    async session({ session, token }) {
      // Expose the Flask JWT to the session (accessible in client & server components)
      ;(session as any).apiToken = token.apiToken
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
