/**
 * Inventory Filters Component
 * 
 * Provides filtering controls for the inventory table:
 * - Search by name or SKU
 * - Filter by category
 * - Filter by status (active/inactive/discontinued)
 * - Toggle low stock only
 * 
 * @component InventoryFilters
 */

'use client'

import React from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search, X, AlertTriangle } from 'lucide-react'
import { useInventoryCategories } from '@/hooks/use-inventory'
import { InventoryFilters as FilterType, InventoryItemStatus } from '@/types/inventory.types'

interface InventoryFiltersProps {
  filters: FilterType
  onFiltersChange: (filters: FilterType) => void
  showTypeFilter?: boolean // Hide type filter when already in a type-specific tab (reserved for future use)
}

export function InventoryFilters({
  filters,
  onFiltersChange,
  // showTypeFilter = false, // Reserved for future implementation
}: InventoryFiltersProps) {
  const { data: categories = [] } = useInventoryCategories()

  const handleSearchChange = (value: string) => {
    onFiltersChange({ ...filters, search: value || undefined })
  }

  const handleCategoryChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      category: value === 'all' ? undefined : value 
    })
  }

  const handleStatusChange = (value: string) => {
    onFiltersChange({ 
      ...filters, 
      status: value === 'all' ? undefined : value as InventoryItemStatus
    })
  }

  const handleLowStockToggle = () => {
    onFiltersChange({ 
      ...filters, 
      low_stock_only: !filters.low_stock_only 
    })
  }

  const handleClearFilters = () => {
    onFiltersChange({})
  }

  const hasActiveFilters = !!(
    filters.search ||
    filters.category ||
    filters.status ||
    filters.low_stock_only
  )

  return (
    <div className="flex flex-col sm:flex-row gap-3 mb-4">
      {/* Search input */}
      <div className="flex-1 relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
        <Input
          placeholder="Search by name or SKU..."
          value={filters.search || ''}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Category filter */}
      <Select
        value={filters.category || 'all'}
        onValueChange={handleCategoryChange}
      >
        <SelectTrigger className="w-full sm:w-48">
          <SelectValue placeholder="Category" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Categories</SelectItem>
          {categories.map((category) => (
            <SelectItem key={category} value={category}>
              {category}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {/* Status filter */}
      <Select
        value={filters.status || 'all'}
        onValueChange={handleStatusChange}
      >
        <SelectTrigger className="w-full sm:w-40">
          <SelectValue placeholder="Status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Status</SelectItem>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="discontinued">Discontinued</SelectItem>
        </SelectContent>
      </Select>

      {/* Low stock toggle */}
      <Button
        variant={filters.low_stock_only ? 'default' : 'outline'}
        onClick={handleLowStockToggle}
        className="w-full sm:w-auto"
      >
        <AlertTriangle className="h-4 w-4 mr-2" />
        Low Stock
        {filters.low_stock_only && (
          <Badge variant="secondary" className="ml-2">
            On
          </Badge>
        )}
      </Button>

      {/* Clear filters button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          onClick={handleClearFilters}
          className="w-full sm:w-auto"
        >
          <X className="h-4 w-4 mr-2" />
          Clear
        </Button>
      )}
    </div>
  )
}
