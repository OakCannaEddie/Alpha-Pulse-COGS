/**
 * Inventory Summary Cards Component
 * 
 * Displays key inventory metrics in a card layout:
 * - Total items count
 * - Total inventory value
 * - Low stock alerts
 * - Category breakdown
 * 
 * @component InventorySummaryCards
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Package, DollarSign, AlertTriangle, Box } from 'lucide-react'
import { useInventorySummary } from '@/hooks/use-inventory'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'

export function InventorySummaryCards() {
  const { data: summary, isLoading, error } = useInventorySummary()

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-8 w-20 mb-1" />
              <Skeleton className="h-3 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (error || !summary) {
    return null
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const cards = [
    {
      title: 'Total Items',
      value: summary.total_items.toString(),
      description: `${summary.raw_materials_count} raw materials, ${summary.finished_goods_count} finished goods`,
      icon: Package,
      iconColor: 'text-blue-500',
    },
    {
      title: 'Total Value',
      value: formatCurrency(summary.total_value),
      description: 'Current inventory valuation',
      icon: DollarSign,
      iconColor: 'text-green-500',
    },
    {
      title: 'Low Stock Alerts',
      value: summary.low_stock_items.toString(),
      description: 'Items below reorder point',
      icon: AlertTriangle,
      iconColor: summary.low_stock_items > 0 ? 'text-red-500' : 'text-gray-400',
      badge: summary.low_stock_items > 0 ? 'Needs Attention' : null,
      badgeVariant: 'destructive' as const,
    },
    {
      title: 'Active Items',
      value: (summary.total_items - summary.inactive_items).toString(),
      description: `${summary.inactive_items} inactive items`,
      icon: Box,
      iconColor: 'text-purple-500',
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index}>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium text-gray-600">
              {card.title}
            </CardTitle>
            <card.icon className={`h-4 w-4 ${card.iconColor}`} />
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-2xl font-bold">{card.value}</div>
              {card.badge && (
                <Badge variant={card.badgeVariant}>{card.badge}</Badge>
              )}
            </div>
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
