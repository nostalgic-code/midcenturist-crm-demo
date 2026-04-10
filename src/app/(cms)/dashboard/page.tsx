import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBoxesStacked, faBagShopping, faEnvelope,
  faPaperPlane, faPlus, faTriangleExclamation,
} from '@fortawesome/free-solid-svg-icons'
import { faInstagram } from '@fortawesome/free-brands-svg-icons'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import StatCard from '@/components/cms/StatCard'
import { getDashboardStats, getDashboardActivity } from '@/lib/api'
import type { DashboardStats, ActivityItem } from '@/types/cms'

// Revalidate dashboard every 60 seconds
export const revalidate = 60

export default async function DashboardPage() {
  const [stats, activity] = await Promise.all([
    getDashboardStats().catch(() => null),
    getDashboardActivity().catch(() => []),
  ])

  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products Live"           value={stats?.totalProductsLive ?? 0}     iconDef={faBoxesStacked} trend="Updated live" />
        <StatCard label="Orders This Month"       value={stats?.ordersThisMonth ?? 0}        iconDef={faBagShopping}  trendUp />
        <StatCard label="Unread Enquiries"        value={stats?.unreadEnquiries ?? 0}        iconDef={faEnvelope}     trend={stats?.unreadEnquiries ? 'Needs attention' : undefined} />
        <StatCard label="Newsletter Subscribers"  value={stats?.newsletterSubscribers ?? 0}  iconDef={faPaperPlane}   trendUp />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/products/new">
            <FontAwesomeIcon icon={faPlus} className="mr-1.5 h-3 w-3" />
            Add New Product
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/instagram">
            <FontAwesomeIcon icon={faInstagram} className="mr-1.5 h-3 w-3" />
            Instagram Drafts
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/enquiries">
            <FontAwesomeIcon icon={faEnvelope} className="mr-1.5 h-3 w-3" />
            Enquiries
            {(stats?.unreadEnquiries ?? 0) > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[10px]">{stats?.unreadEnquiries}</Badge>
            )}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Recent activity */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {activity.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No recent activity yet.</p>
            ) : (
              <ul className="space-y-0">
                {activity.slice(0, 10).map((item, i) => (
                  <li key={i}>
                    <div className="flex items-start gap-3 py-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-muted">
                        <FontAwesomeIcon
                          icon={item.type === 'order' ? faBagShopping : item.type === 'subscriber' ? faPaperPlane : faInstagram}
                          className="h-3 w-3 text-muted-foreground"
                        />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium">{item.label}</p>
                        <p className="text-xs text-muted-foreground">{item.detail}</p>
                      </div>
                      <time className="shrink-0 text-xs text-muted-foreground">
                        {new Date(item.timestamp).toLocaleDateString('en-ZA')}
                      </time>
                    </div>
                    {i < activity.length - 1 && <Separator />}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Attention needed */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Attention Needed</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <FontAwesomeIcon icon={faTriangleExclamation} className="h-5 w-5 text-muted-foreground" />
              </div>
              <p className="text-sm text-muted-foreground max-w-xs">
                Items marked &ldquo;Last One&rdquo;, drafts older than 7 days, and sold items near auto-archive will appear here.
              </p>
              <Button asChild variant="link" size="sm" className="mt-2">
                <Link href="/products">View all products</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
