import { getServerSession } from 'next-auth'
import { redirect } from 'next/navigation'
import { authOptions } from '@/lib/auth'
import { adminGetCategories } from '@/lib/api'
import CategoryForm from '@/components/cms/CategoryForm'
import CategoryList from '@/components/cms/CategoryList'

export const metadata = {
  title: 'Categories | Midcenturist CMS',
  description: 'Manage product categories',
}

export default async function CategoriesPage() {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/login')

  const token = (session as any)?.apiToken
  if (!token) redirect('/login')

  // Fetch categories from API
  const categoriesData = await adminGetCategories().catch(() => ({ categories: [] }))
  const categories = categoriesData.categories || []

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-brand-rule pb-6">
        <h1 className="font-serif text-3xl font-semibold text-brand-black mb-1">Categories</h1>
        <p className="text-sm text-brand-muted">Manage product categories for your store</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-0">
            <CategoryForm token={token} />
          </div>
        </div>

        {/* List */}
        <div className="lg:col-span-2">
          <CategoryList categories={categories} token={token} />
        </div>
      </div>
    </div>
  )
}
