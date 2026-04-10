'use client'

import { useEffect, useState } from 'react'
import EnquiryTable from '@/components/cms/EnquiryTable'
import { getEnquiries, updateEnquiryStatus } from '@/lib/api'
import type { Enquiry } from '@/types/cms'

export default function EnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading]     = useState(true)

  const load = () => {
    setLoading(true)
    getEnquiries()
      .then(setEnquiries)
      .catch(() => {})
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const handleStatusChange = async (id: string, status: Enquiry['status']) => {
    await updateEnquiryStatus(id, status)
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
