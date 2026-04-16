import type { ReactNode } from 'react'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import SessionProvider from '@/app/(cms)/SessionProvider'
import CMSSidebar from '@/components/cms/Sidebar'
import CMSTopbar from '@/components/cms/Topbar'

export const metadata = {
  title: 'Midcenturist SA — Admin',
}

export default async function CMSLayout({ children }: { children: ReactNode }) {
  const session = await getServerSession(authOptions)
  return (
    <SessionProvider session={session}>
      <div className="flex h-screen overflow-hidden bg-muted/30">
        {/* Sidebar - hidden on mobile */}
        <div className="hidden lg:flex">
          <CMSSidebar />
        </div>
        <div className="flex flex-1 flex-col overflow-hidden">
          <CMSTopbar />
          <main className="flex-1 overflow-y-auto p-4 sm:p-6">
            {children}
          </main>
        </div>
      </div>
    </SessionProvider>
  )
}
