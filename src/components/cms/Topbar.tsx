'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faBell, faPlus } from '@fortawesome/free-solid-svg-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

const pageTitles: Record<string, string> = {
  '/dashboard':  'Dashboard',
  '/products':   'Products',
  '/orders':     'Orders',
  '/enquiries':  'Enquiries',
  '/instagram':  'Instagram Sync',
  '/upcoming':   'Coming Soon',
  '/newsletter': 'Newsletter',
  '/settings':   'Settings',
}

function getTitle(pathname: string): string {
  for (const [key, val] of Object.entries(pageTitles)) {
    if (pathname === key || pathname.startsWith(key + '/')) return val
  }
  return 'Admin'
}

interface TopbarProps {
  unreadEnquiries?: number
}

export default function Topbar({ unreadEnquiries = 0 }: TopbarProps) {
  const pathname = usePathname()
  const title    = getTitle(pathname)

  return (
    <header className="flex h-16 shrink-0 items-center gap-4 border-b bg-card px-6">
      <h1 className="text-lg font-semibold">{title}</h1>

      <div className="ml-auto flex items-center gap-2">
        {unreadEnquiries > 0 && (
          <Link href="/enquiries">
            <Button variant="ghost" size="icon" className="relative h-9 w-9">
              <FontAwesomeIcon icon={faBell} className="h-4 w-4" />
              <Badge className="absolute -right-1 -top-1 h-4 w-4 rounded-full p-0 flex items-center justify-center text-[9px]">
                {unreadEnquiries > 9 ? '9+' : unreadEnquiries}
              </Badge>
            </Button>
          </Link>
        )}
        <Button asChild size="sm">
          <Link href="/products/new">
            <FontAwesomeIcon icon={faPlus} className="mr-1.5 h-3 w-3" />
            Add Product
          </Link>
        </Button>
      </div>
    </header>
  )
}
