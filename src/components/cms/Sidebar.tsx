'use client'

import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { useSession, signOut } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faGauge, faBoxesStacked, faBagShopping, faEnvelope,
  faClock, faPaperPlane, faGear, faRightFromBracket, faTag,
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard',  label: 'Dashboard',      icon: faGauge },
  { href: '/products',   label: 'Products',        icon: faBoxesStacked },
  { href: '/categories', label: 'Categories',      icon: faTag },
  { href: '/orders',     label: 'Orders',          icon: faBagShopping },
  // { href: '/enquiries',  label: 'Enquiries',       icon: faEnvelope }, // Disabled for now
  { href: '/instagram',  label: 'Instagram Sync',  icon: faInstagram },
  { href: '/upcoming',   label: 'Coming Soon',     icon: faClock },
  { href: '/newsletter', label: 'Newsletter',      icon: faPaperPlane },
  { href: '/settings',   label: 'Settings',        icon: faGear },
]

export default function CMSSidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userEmail = session?.user?.email || 'Admin'
  const userInitial = userEmail.charAt(0).toUpperCase()

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r bg-card">
      {/* Logo */}
      <div className="flex h-24 items-center gap-4 border-b px-4">
        <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
          <Image
            src="/logo.jpg"
            alt="Midcenturist SA"
            fill
            className="object-cover"
            priority
          />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Midcenturist SA</p>
          <Badge variant="secondary" className="mt-0.5 h-4 px-1.5 text-[10px]">Admin</Badge>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-4 space-y-0.5">
        <p className="mb-2 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          Navigation
        </p>
        {navItems.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                active
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              )}
            >
              <FontAwesomeIcon icon={item.icon} className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
            {userInitial}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-medium">{userEmail}</p>
            <p className="text-[10px] text-muted-foreground">Administrator</p>
          </div>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="shrink-0 rounded-md p-1.5 text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            title="Sign Out"
          >
            <FontAwesomeIcon icon={faRightFromBracket} className="h-4 w-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
