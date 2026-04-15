// Enquiries feature disabled for now
/*
'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import EnquiryTable from '@/components/cms/EnquiryTable'
import { getEnquiries, updateEnquiryStatus, type Enquiry } from '@/lib/api'

export default function EnquiriesPage() {
  const { data: session } = useSession()
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading]     = useState(true)
  const token = (session as any)?.apiToken

  const load = () => {
    if (!token) return
    setLoading(true)
    getEnquiries(token)
      .then(setEnquiries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [token])

  const handleStatusChange = async (id: string, status: 'read' | 'replied') => {
    if (!token) return
    await updateEnquiryStatus(token, id, status)
    setEnquiries((prev) => prev.map((e) => (e.id === id ? { ...e, status } : e)))
  }

  const unread = enquiries.filter((e) => e.status === 'unread').length

  return (
    <div className="space-y-5">
      {unread > 0 && (
        <div className="rounded-lg bg-brand-off border border-brand-rule px-4 py-3 text-sm text-brand-black">
          You have <strong>{unread}</strong> unread enquir{unread === 1 ? 'y' : 'ies'}.
        </div>
      )}
      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-white border border-brand-rule" />
      ) : (
        <EnquiryTable enquiries={enquiries} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}
*/
