'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSearch, faDownload } from '@fortawesome/free-solid-svg-icons'
import NewsletterTable from '@/components/cms/NewsletterTable'
import { getSubscribers, exportSubscribersCSV, type Subscriber } from '@/lib/api'

export default function NewsletterPage() {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading]         = useState(true)
  const [search, setSearch]           = useState('')
  const [area, setArea]               = useState('')
  const [status, setStatus]           = useState('')

  const { data: session } = useSession()
  const token = (session as any)?.apiToken

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await getSubscribers(token, { search, area, status })
      setSubscribers(res.subscribers)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }, [token, search, area, status])

  useEffect(() => { load() }, [load])

  const handleExport = async () => {
    if (!token) return
    const blob = await exportSubscribersCSV(token)
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const active = subscribers.filter((s) => s.status === 'active').length

  return (
    <div className="space-y-5">
      {/* Total count */}
      <div className="rounded-lg border border-brand-rule bg-white px-5 py-4">
        <p className="text-xs uppercase tracking-widest text-brand-muted">Total Active Subscribers</p>
        <p className="mt-1 text-3xl font-semibold text-brand-black">{active}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-48">
          <FontAwesomeIcon icon={faSearch} className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-brand-muted" />
          <input
            type="search"
            placeholder="Search subscribers…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded border border-brand-rule py-2 pl-9 pr-3 text-sm outline-none focus:border-brand-black transition-colors"
          />
        </div>

        <input
          placeholder="Filter by area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          className="rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
        >
          <option value="">All</option>
          <option value="active">Active</option>
          <option value="unsubscribed">Unsubscribed</option>
        </select>

        <button
          onClick={handleExport}
          className="ml-auto flex items-center gap-2 rounded border border-brand-rule px-4 py-2 text-sm hover:bg-brand-off transition-colors"
        >
          <FontAwesomeIcon icon={faDownload} className="h-3.5 w-3.5 text-brand-muted" />
          Export CSV
        </button>
      </div>

      {loading ? (
        <div className="h-64 animate-pulse rounded-lg bg-white border border-brand-rule" />
      ) : (
        <NewsletterTable subscribers={subscribers} />
      )}
    </div>
  )
}
