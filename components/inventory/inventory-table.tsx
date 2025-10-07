/**
 * Inventory Table Component
 * 
 * Displays inventory items in a sortable, filterable table format.
 * Supports row actions (view, edit, adjust) and empty states.
 * 
 *       <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader field="sku">SKU</SortableHeader>
            <SortableHeader field="name">Name</SortableHeader>
            <SortableHeader field="category">Category</SortableHeader>
            <SortableHeader field="current_stock" className="text-right">Quantity</SortableHeader>
            <SortableHeader field="unit_cost" className="text-right">Unit Cost</SortableHeader>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead className="text-center">Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>ventoryTable
 */

'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Skeleton } from '@/components/ui/skeleton'
import { MoreHorizontal, Eye, Edit, TrendingUp, AlertCircle, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { InventoryItem, InventorySortField, SortOrder } from '@/types/inventory.types'
import { cn } from '@/lib/utils'

interface InventoryTableProps {
  items: InventoryItem[]
  isLoading?: boolean
  onEdit?: (item: InventoryItem) => void
  onAdjust?: (item: InventoryItem) => void
  sortBy?: InventorySortField
  sortOrder?: SortOrder
  onSort?: (field: InventorySortField) => void
}

export function InventoryTable({
  items,
  isLoading,
  onEdit,
  onAdjust,
  sortBy,
  sortOrder,
  onSort,
}: InventoryTableProps) {
  const router = useRouter()

  /**
   * Sortable column header component
   * Displays sort indicators and handles click events
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used in TableHeader JSX below
  const SortableHeader = ({ 
    field, 
    children, 
    className 
  }: { 
    field: InventorySortField
    children: React.ReactNode
    className?: string 
  }) => {
    const isSorted = sortBy === field
    const isAsc = sortOrder === 'asc'
    
    return (
      <TableHead 
        className={cn(
          "cursor-pointer select-none hover:bg-gray-50",
          className
        )}
        onClick={() => onSort?.(field)}
      >
        <div className="flex items-center gap-2">
          {children}
          {isSorted ? (
            isAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
          ) : (
            <ArrowUpDown className="h-3 w-3 opacity-40" />
          )}
        </div>
      </TableHead>
    )
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>SKU</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Quantity</TableHead>
              <TableHead className="text-right">Unit Cost</TableHead>
              <TableHead className="text-right">Total Value</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[...Array(5)].map((_, i) => (
              <TableRow key={i}>
                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                <TableCell><Skeleton className="h-4 w-40" /></TableCell>
                <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-16 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-4 w-20 ml-auto" /></TableCell>
                <TableCell><Skeleton className="h-6 w-16" /></TableCell>
                <TableCell><Skeleton className="h-8 w-8" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    )
  }

  // Empty state
  if (!items || items.length === 0) {
    return (
      <div className="border rounded-lg p-12 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="rounded-full bg-gray-100 p-4">
            <AlertCircle className="h-8 w-8 text-gray-400" />
          </div>
          <div>
            <h3 className="text-lg font-semibold mb-1">No items found</h3>
            <p className="text-sm text-gray-500">
              Try adjusting your filters or add a new inventory item to get started.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const formatCurrency = (value: number | null) => {
    if (value === null) return '-'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(value)
  }

  const formatQuantity = (quantity: number, unit: string) => {
    return `${quantity.toLocaleString()} ${unit}`
  }

  const getStatusBadge = (item: InventoryItem) => {
    const isLowStock = item.reorder_point !== null && item.current_stock <= item.reorder_point

    if (item.status === 'inactive') {
      return <Badge variant="secondary">Inactive</Badge>
    }

    if (item.status === 'discontinued') {
      return <Badge variant="outline">Discontinued</Badge>
    }

    if (isLowStock) {
      return <Badge variant="destructive">Low Stock</Badge>
    }

    return <Badge variant="default" className="bg-green-500">Active</Badge>
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>SKU</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead className="text-right">Unit Cost</TableHead>
            <TableHead className="text-right">Total Value</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => {
            const totalValue = item.unit_cost ? item.unit_cost * item.current_stock : 0

            return (
              <TableRow 
                key={item.id}
                className="cursor-pointer hover:bg-gray-50"
                onClick={() => router.push(`/inventory/${item.id}`)}
              >
                <TableCell className="font-mono text-sm">{item.sku}</TableCell>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>
                  {item.category ? (
                    <Badge variant="outline">{item.category}</Badge>
                  ) : (
                    <span className="text-gray-400 text-sm">Uncategorized</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  {formatQuantity(item.current_stock, item.unit)}
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(item.unit_cost)}
                </TableCell>
                <TableCell className="text-right font-medium">
                  {formatCurrency(totalValue)}
                </TableCell>
                <TableCell>
                  {getStatusBadge(item)}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation()
                        router.push(`/inventory/${item.id}`)
                      }}>
                        <Eye className="mr-2 h-4 w-4" />
                        View Details
                      </DropdownMenuItem>
                      {onEdit && (
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation()
                          onEdit(item)
                        }}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit Item
                        </DropdownMenuItem>
                      )}
                      {onAdjust && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation()
                            onAdjust(item)
                          }}>
                            <TrendingUp className="mr-2 h-4 w-4" />
                            Adjust Quantity
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}
