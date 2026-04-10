'use client'

import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faEnvelope } from '@fortawesome/free-solid-svg-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import {
  Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import { Separator } from '@/components/ui/separator'
import type { Enquiry } from '@/types/cms'

const STATUS_VARIANT: Record<Enquiry['status'], 'default' | 'secondary' | 'outline'> = {
  unread:  'default',
  read:    'secondary',
  replied: 'outline',
}

interface EnquiryTableProps {
  enquiries: Enquiry[]
  onStatusChange: (id: string, status: Enquiry['status']) => Promise<void>
}

export default function EnquiryTable({ enquiries, onStatusChange }: EnquiryTableProps) {
  const [selected, setSelected] = useState<Enquiry | null>(null)

  const open = (enq: Enquiry) => {
    setSelected(enq)
    if (enq.status === 'unread') onStatusChange(enq.id, 'read')
  }

  return (
    <>
      <div className="rounded-lg border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="w-12" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {enquiries.map((enq) => (
              <TableRow
                key={enq.id}
                className="cursor-pointer"
                onClick={() => open(enq)}
              >
                <TableCell className="font-medium">{enq.name}</TableCell>
                <TableCell className="text-muted-foreground">{enq.email}</TableCell>
                <TableCell className="max-w-xs">
                  <p className="truncate text-sm text-muted-foreground">{enq.message}</p>
                </TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[enq.status]} className="capitalize">
                    {enq.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {new Date(enq.createdAt).toLocaleDateString('en-ZA')}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <Button asChild variant="ghost" size="icon">
                    <a
                      href={`mailto:${enq.email}?subject=Re: Your enquiry&body=Hi ${enq.name},%0A%0A`}
                      title="Reply"
                    >
                      <FontAwesomeIcon icon={faEnvelope} className="h-3.5 w-3.5" />
                    </a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {enquiries.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">No enquiries yet.</div>
        )}
      </div>

      <Sheet open={!!selected} onOpenChange={(open) => !open && setSelected(null)}>
        <SheetContent className="w-full max-w-md flex flex-col">
          <SheetHeader>
            <SheetTitle>Enquiry</SheetTitle>
          </SheetHeader>
          {selected && (
            <div className="flex flex-col flex-1 overflow-y-auto mt-4 space-y-6">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">From</p>
                <p className="font-semibold">{selected.name}</p>
                <p className="text-sm text-muted-foreground">{selected.email}</p>
                {selected.phone && <p className="text-sm text-muted-foreground">{selected.phone}</p>}
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Message</p>
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{selected.message}</p>
              </div>
              <Separator />
              <p className="text-xs text-muted-foreground">
                {new Date(selected.createdAt).toLocaleString('en-ZA')}
              </p>
              <div className="mt-auto space-y-2 pt-4">
                <Button asChild className="w-full">
                  <a href={`mailto:${selected.email}?subject=Re: Your enquiry&body=Hi ${selected.name},%0A%0A`}>
                    <FontAwesomeIcon icon={faEnvelope} className="mr-2 h-4 w-4" />
                    Reply via Email
                  </a>
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => { onStatusChange(selected.id, 'replied'); setSelected(null) }}
                >
                  Mark as Replied
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
