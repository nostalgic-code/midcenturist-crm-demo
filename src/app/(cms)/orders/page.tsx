'use client'

import { useEffect, useState, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faDownload } from '@fortawesome/free-solid-svg-icons'
import OrderTable from '@/components/cms/OrderTable'
import { getOrders, updateOrderStatus, exportOrdersCSV, type Order } from '@/lib/api'

export default function OrdersPage() {
  const [orders, setOrders]   = useState<Order[]>([])
  const [total, setTotal]     = useState(0)
  const [loading, setLoading] = useState(true)
  const [status, setStatus]   = useState('')
  const [fulfilment, setFulfilment] = useState('')

  const { data: session } = useSession()
  const token = (session as any)?.apiToken

  const load = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const res = await getOrders(token, { status, fulfilment })
      setOrders(res.orders)
      setTotal(res.total)
    } catch {
      /* noop */
    } finally {
      setLoading(false)
    }
  }, [token, status, fulfilment])

  useEffect(() => { load() }, [load])

  const handleStatusChange = async (id: string, s: Order['status']) => {
    if (!token) return
    await updateOrderStatus(token, id, s)
    load()
  }

  const handleExport = async () => {
    const blob = await exportOrdersCSV()
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="shipped">Shipped</option>
          <option value="collected">Collected</option>
          <option value="cancelled">Cancelled</option>
        </select>

        <select
          value={fulfilment}
          onChange={(e) => setFulfilment(e.target.value)}
          className="rounded border border-brand-rule px-3 py-2 text-sm outline-none focus:border-brand-black"
        >
          <option value="">All Fulfilment</option>
          <option value="shipping">Shipping</option>
          <option value="collection">Collection</option>
        </select>

        <span className="text-xs text-brand-muted">{total} order{total !== 1 ? 's' : ''}</span>

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
        <OrderTable orders={orders} onStatusChange={handleStatusChange} />
      )}
    </div>
  )
}
