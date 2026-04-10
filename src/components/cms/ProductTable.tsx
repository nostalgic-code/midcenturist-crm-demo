'use client'

import Image from 'next/image'
import Link from 'next/link'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPencil, faTrash } from '@fortawesome/free-solid-svg-icons'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'
import type { Product } from '@/types/cms'

const STATUS_VARIANT: Record<Product['status'], 'default' | 'secondary' | 'outline' | 'destructive'> = {
  live:     'default',
  draft:    'secondary',
  sold:     'outline',
  archived: 'destructive',
}

function daysUntilArchive(archiveAt?: string): number | null {
  if (!archiveAt) return null
  const diff = new Date(archiveAt).getTime() - Date.now()
  return Math.max(0, Math.ceil(diff / 86_400_000))
}

interface ProductTableProps {
  products: Product[]
  onMarkSold: (id: string) => void
  onDelete: (id: string) => void
}

export default function ProductTable({ products, onMarkSold, onDelete }: ProductTableProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-16">Image</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Era</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const days   = daysUntilArchive(product.archiveAt)
            const isSold = product.status === 'sold'
            return (
              <TableRow key={product.id} className={isSold ? 'opacity-60' : ''}>
                <TableCell>
                  <div className="relative h-11 w-11 rounded-md overflow-hidden bg-muted">
                    {product.imageUrl && (
                      <Image src={product.imageUrl} alt={product.name} fill className="object-cover" />
                    )}
                  </div>
                </TableCell>
                <TableCell className="font-medium">{product.name}</TableCell>
                <TableCell className="text-muted-foreground">{product.category}</TableCell>
                <TableCell>
                  <span className="font-medium">R{product.price.toLocaleString()}</span>
                  {product.originalPrice && (
                    <span className="ml-1.5 text-xs text-muted-foreground line-through">
                      R{product.originalPrice.toLocaleString()}
                    </span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <Badge variant={STATUS_VARIANT[product.status]} className="w-fit capitalize">
                      {product.status}
                    </Badge>
                    {isSold && days !== null && (
                      <span className="text-[10px] text-muted-foreground">Archives in {days}d</span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{product.era}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button asChild variant="ghost" size="icon">
                      <Link href={`/products/${product.id}`} title="Edit">
                        <FontAwesomeIcon icon={faPencil} className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                    {!isSold && (
                      <Button variant="outline" size="sm" onClick={() => onMarkSold(product.id)}>
                        Mark Sold
                      </Button>
                    )}
                    <Button variant="ghost" size="icon" onClick={() => onDelete(product.id)}>
                      <FontAwesomeIcon icon={faTrash} className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
      {products.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No products found.</div>
      )}
    </div>
  )
}
