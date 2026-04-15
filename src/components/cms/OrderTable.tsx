'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faChevronDown, faChevronUp } from '@fortawesome/free-solid-svg-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Order } from '@/lib/api'

const STATUS_VARIANT: Record<Order['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  pending:   'secondary',
  confirmed: 'outline',
  paid:      'outline',
  shipped:   'default',
  collected: 'default',
  delivered: 'default',
  cancelled: 'destructive',
}

const ORDER_STATUSES: Order['status'][] = ['pending', 'confirmed', 'paid', 'shipped', 'collected', 'delivered', 'cancelled']

interface OrderTableProps {
  orders: Order[]
  onStatusChange: (id: string, status: Order['status']) => Promise<void>
}

export default function OrderTable({ orders, onStatusChange }: OrderTableProps) {
  const [expanded, setExpanded] = useState<string | null>(null)
  const [loading, setLoading]   = useState<string | null>(null)

  const toggle = (id: string) => setExpanded((prev) => (prev === id ? null : id))

  const handleStatus = async (id: string, status: Order['status']) => {
    setLoading(id)
    await onStatusChange(id, status)
    setLoading(null)
  }

  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Items</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Fulfilment</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => (
            <>
              <TableRow
                key={order.id}
                className="cursor-pointer"
                onClick={() => toggle(order.id)}
              >
                <TableCell className="font-mono text-xs">{order.order_number}</TableCell>
                <TableCell>
                  <p className="font-medium">{order.billing_address.name}</p>
                  <p className="text-xs text-muted-foreground">{order.billing_address.email}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{order.items.length}</TableCell>
                <TableCell className="font-medium">R{order.total_amount.toLocaleString()}</TableCell>
                <TableCell className="capitalize text-muted-foreground">{order.fulfillment_type}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[order.status]} className="capitalize">
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(order.created_at).toLocaleDateString('en-ZA')}
                </TableCell>
                <TableCell>
                  <FontAwesomeIcon
                    icon={expanded === order.id ? faChevronUp : faChevronDown}
                    className="h-3.5 w-3.5 text-muted-foreground"
                  />
                </TableCell>
              </TableRow>

              {expanded === order.id && (
                <TableRow key={`${order.id}-detail`}>
                  <TableCell colSpan={8} className="bg-muted/30 p-6">
                    <div className="grid gap-6 sm:grid-cols-2">
                      <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Items</p>
                        <ul className="space-y-1">
                          {order.items.map((item) => (
                            <li key={item.productId} className="flex justify-between text-sm">
                              <span>{item.productName}</span>
                              <span className="text-muted-foreground">R{item.price.toLocaleString()}</span>
                            </li>
                          ))}
                        </ul>
                        {order.shippingAddress && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Ship to</p>
                            <p className="text-sm">{order.shippingAddress}</p>
                          </div>
                        )}
                        {order.notes && (
                          <div>
                            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-1">Notes</p>
                            <p className="text-sm text-muted-foreground">{order.notes}</p>
                          </div>
                        )}
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Update Status</p>
                        <div className="flex flex-wrap gap-2">
                          {ORDER_STATUSES.map((s) => (
                            <Button
                              key={s}
                              size="sm"
                              variant={order.status === s ? 'default' : 'outline'}
                              disabled={order.status === s || loading === order.id}
                              onClick={() => handleStatus(order.id, s)}
                              className="capitalize"
                            >
                              {s}
                            </Button>
                          ))}
                        </div>
                        {order.fulfilmentType === 'shipping' && (
                          <p className="rounded-lg bg-yellow-50 border border-yellow-200 p-3 text-xs text-yellow-800">
                            Shipping request — contact <strong>{order.customerEmail}</strong> with courier quote.
                          </p>
                        )}
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </>
          ))}
        </TableBody>
      </Table>
      {orders.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No orders found.</div>
      )}
    </div>
  )
}
