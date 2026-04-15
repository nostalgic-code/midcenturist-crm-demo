import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
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
import { authOptions } from '@/lib/auth'
import { adminGetDashboardStats } from '@/lib/api'
import StatCard from '@/components/cms/StatCard'
import type { DashboardStats } from '@/lib/api'

// Revalidate dashboard every 60 seconds
export const revalidate = 60

export default async function DashboardPage() {
  const session = await getServerSession(authOptions)
  const token = (session as any)?.apiToken

  if (!token) {
    redirect('/login')
  }

  const stats = await adminGetDashboardStats(token).catch(() => null)

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Products Live"           value={stats?.live_products ?? 0}           iconDef={faBoxesStacked} trend="Updated live" />
        <StatCard label="Orders This Month"       value={stats?.orders_this_month ?? 0}       iconDef={faBagShopping}  trendUp />
        <StatCard label="Pending Reviews"         value={stats?.pending_reviews ?? 0}         iconDef={faEnvelope}     trend={stats?.pending_reviews ? 'Needs approval' : undefined} />
        <StatCard label="Newsletter Subscribers"  value={stats?.total_subscribers ?? 0}       iconDef={faPaperPlane}   trendUp />
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/products/new">
            <FontAwesomeIcon icon={faPlus} className="mr-1.5 h-3 w-3" />
            <span className="hidden sm:inline">Add New Product</span>
            <span className="sm:hidden">Add Product</span>
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/instagram">
            <FontAwesomeIcon icon={faInstagram} className="mr-1.5 h-3 w-3" />
            <span className="hidden sm:inline">Instagram Drafts</span>
            <span className="sm:hidden">Instagram</span>
            {(stats?.drafts_from_instagram ?? 0) > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[9px]">{stats?.drafts_from_instagram}</Badge>
            )}
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link href="/enquiries">
            <FontAwesomeIcon icon={faEnvelope} className="mr-1.5 h-3 w-3" />
            <span className="hidden sm:inline">Pending Reviews</span>
            <span className="sm:hidden">Reviews</span>
            {(stats?.pending_reviews ?? 0) > 0 && (
              <Badge className="ml-1.5 h-4 px-1.5 text-[9px]">{stats?.pending_reviews}</Badge>
            )}
          </Link>
        </Button>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Status Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Inventory Status</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-0">
              <li>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">Live Products</span>
                  <span className="text-sm font-semibold">{stats?.live_products ?? 0}</span>
                </div>
                <Separator />
              </li>
              <li>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">Draft Products</span>
                  <span className="text-sm font-semibold">{stats?.draft_products ?? 0}</span>
                </div>
                <Separator />
              </li>
              <li>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">Sold Products</span>
                  <span className="text-sm font-semibold">{stats?.sold_products ?? 0}</span>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>

        {/* Attention Required */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Action Required</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-0">
              <li>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">Pending Orders</span>
                  <span className="text-sm font-semibold">{stats?.pending_orders ?? 0}</span>
                </div>
                <Separator />
              </li>
              <li>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">Pending Reviews</span>
                  <span className="text-sm font-semibold">{stats?.pending_reviews ?? 0}</span>
                </div>
                <Separator />
              </li>
              <li>
                <div className="flex items-center justify-between py-3">
                  <span className="text-sm font-medium">Instagram Drafts</span>
                  <span className="text-sm font-semibold">{stats?.drafts_from_instagram ?? 0}</span>
                </div>
              </li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
