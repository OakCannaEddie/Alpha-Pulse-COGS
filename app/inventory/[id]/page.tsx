/**
 * Inventory Item Detail Page
 * 
 * Displays comprehensive information about a single inventory item:
 * - Item details and metadata
 * - Transaction history with filtering
 * - Current stock and valuation
 * - Quick actions (edit, adjust)
 * 
 * @route /inventory/[id]
 * @protected Requires authentication
 */
'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PageLayout from '@/components/page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useInventoryItem, useInventoryTransactions } from '@/hooks/use-inventory'
import { AdjustQuantityDialog } from '@/components/inventory/adjust-quantity-dialog'
import { TrendingUp, Package, Calendar, AlertCircle, ArrowLeft } from 'lucide-react'
import { format } from 'date-fns'

export default function InventoryItemDetailPage() {
  const params = useParams()
  const router = useRouter()
  const itemId = params.id as string

  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)

  const { data: item, isLoading: itemLoading, error: itemError } = useInventoryItem(itemId)
  const { data: transactions, isLoading: transactionsLoading } = useInventoryTransactions({
    item_id: itemId,
  })

  if (itemLoading) {
    return (
      <PageLayout title="Loading..." subtitle="Fetching item details">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-32" />
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                {[...Array(6)].map((_, i) => (
                  <div key={i}>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </PageLayout>
    )
  }

  if (itemError || !item) {
    return (
      <PageLayout title="Not Found" subtitle="Item not found">
        <Card>
          <CardContent className="py-12 text-center">
            <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Item Not Found</h3>
            <p className="text-gray-600 mb-4">
              The inventory item you&apos;re looking for doesn&apos;t exist or has been removed.
            </p>
            <Button onClick={() => router.push('/inventory')}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Inventory
            </Button>
          </CardContent>
        </Card>
      </PageLayout>
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

  const totalValue = item.unit_cost ? item.unit_cost * item.current_stock : 0
  const isLowStock = item.reorder_point !== null && item.current_stock <= item.reorder_point

  return (
    <PageLayout
      title={item.name}
      subtitle={`SKU: ${item.sku}`}
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Inventory', href: '/inventory' },
        { label: item.sku },
      ]}
      primaryAction={{
        label: 'Adjust Quantity',
        onClick: () => setAdjustDialogOpen(true),
        icon: <TrendingUp className="h-4 w-4" />,
      }}
    >
      {/* Adjust Quantity Dialog */}
      <AdjustQuantityDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={item}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Item Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-blue-500" />
                  <CardTitle>Item Details</CardTitle>
                </div>
                <div className="flex gap-2">
                  {item.item_type === 'raw_material' && (
                    <Badge variant="outline">Raw Material</Badge>
                  )}
                  {item.item_type === 'finished_good' && (
                    <Badge variant="outline">Finished Good</Badge>
                  )}
                  {item.status === 'active' && (
                    <Badge className="bg-green-500">Active</Badge>
                  )}
                  {item.status === 'inactive' && (
                    <Badge variant="secondary">Inactive</Badge>
                  )}
                  {isLowStock && (
                    <Badge variant="destructive">Low Stock</Badge>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Name</p>
                  <p className="font-medium">{item.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">SKU</p>
                  <p className="font-mono font-medium">{item.sku}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Category</p>
                  <p className="font-medium">
                    {item.category || <span className="text-gray-400">Uncategorized</span>}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Unit</p>
                  <p className="font-medium">{item.unit}</p>
                </div>
                {item.description && (
                  <div className="col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Description</p>
                    <p className="text-gray-700">{item.description}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Transaction History */}
          <Card>
            <CardHeader>
              <CardTitle>Transaction History</CardTitle>
              <CardDescription>
                Complete audit trail of all inventory movements
              </CardDescription>
            </CardHeader>
            <CardContent>
              {transactionsLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : !transactions || transactions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                  <p>No transactions yet</p>
                </div>
              ) : (
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className="text-right">Quantity</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="text-sm">
                            {format(new Date(transaction.transaction_date), 'MMM dd, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs">
                              {transaction.transaction_type.replace(/_/g, ' ')}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <span className={transaction.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
                              {transaction.quantity > 0 ? '+' : ''}
                              {transaction.quantity.toLocaleString()} {item.unit}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            {formatCurrency(transaction.total_cost)}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600 max-w-xs truncate">
                            {transaction.notes || '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Summary Cards */}
        <div className="space-y-6">
          {/* Current Stock */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Current Stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {item.current_stock.toLocaleString()}
              </div>
              <p className="text-sm text-gray-600">{item.unit}</p>
              {item.reorder_point && (
                <div className="mt-4 pt-4 border-t">
                  <p className="text-sm text-gray-600 mb-1">Reorder Point</p>
                  <p className="font-medium">{item.reorder_point.toLocaleString()} {item.unit}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Valuation */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Total Value
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">
                {formatCurrency(totalValue)}
              </div>
              <p className="text-sm text-gray-600">
                {formatCurrency(item.unit_cost)} per {item.unit}
              </p>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-gray-600">
                Quick Stats
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Transactions</span>
                <span className="font-medium">{transactions?.length || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Last Updated</span>
                <span className="font-medium text-sm">
                  {format(new Date(item.updated_at), 'MMM dd, yyyy')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Created</span>
                <span className="font-medium text-sm">
                  {format(new Date(item.created_at), 'MMM dd, yyyy')}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PageLayout>
  )
}
