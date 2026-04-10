// ─── NextAuth Configuration ───────────────────────────────────────────────────
// next-auth v4 — credentials provider, single admin user

import type { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const adminEmail    = process.env.ADMIN_EMAIL
        const adminPassword = process.env.ADMIN_PASSWORD // bcrypt hash

        if (!adminEmail || !adminPassword) return null
        if (credentials.email !== adminEmail) return null

        const valid = await bcrypt.compare(credentials.password, adminPassword)
        if (!valid) return null

        return { id: '1', email: adminEmail, name: 'Admin' }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) token.email = user.email
      return token
    },
    async session({ session, token }) {
      if (session.user) session.user.email = token.email as string
      return session
    },
  },
}
