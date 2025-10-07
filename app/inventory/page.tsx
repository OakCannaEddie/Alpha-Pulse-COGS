/**
 * Inventory Management Page
 * 
 * Main page for managing inventory with tabs for:
 * - Raw Materials: Track ingredients, packaging, and other consumables
 * - Finished Goods: Track completed products ready for sale
 * 
 * Features:
 * - Filterable and searchable inventory lists
 * - Summary statistics cards
 * - Quick actions for adjustments and editing
 * - Low stock alerts
 * 
 * @route /inventory
 * @protected Requires authentication
 */
'use client'

import React, { useState } from 'react'
import PageLayout from '@/components/page-layout'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Plus } from 'lucide-react'
import { InventorySummaryCards } from '@/components/inventory/inventory-summary-cards'
import { InventoryFilters } from '@/components/inventory/inventory-filters'
import { InventoryTable } from '@/components/inventory/inventory-table'
import { AddInventoryItemDialog } from '@/components/inventory/add-item-dialog'
import { AdjustQuantityDialog } from '@/components/inventory/adjust-quantity-dialog'
import { useRawMaterials, useFinishedGoods } from '@/hooks/use-inventory'
// eslint-disable-next-line @typescript-eslint/no-unused-vars -- Used in type annotations
import { InventoryFilters as FilterType, InventoryItem, InventorySortField, SortOrder } from '@/types/inventory.types'

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'raw_materials' | 'finished_goods'>('raw_materials')
  const [rawMaterialsFilters, setRawMaterialsFilters] = useState<FilterType>({})
  const [finishedGoodsFilters, setFinishedGoodsFilters] = useState<FilterType>({})
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false)
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false)
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null)

  /**
   * Handle sort column click
   * Toggles between asc/desc or sets new sort field
   */
  const handleRawMaterialsSort = (field: InventorySortField) => {
    setRawMaterialsFilters(prev => {
      // If clicking same field, toggle order
      if (prev.sort_by === field) {
        return {
          ...prev,
          sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc'
        }
      }
      // Otherwise, set new field with ascending order
      return {
        ...prev,
        sort_by: field,
        sort_order: 'asc'
      }
    })
  }

  const handleFinishedGoodsSort = (field: InventorySortField) => {
    setFinishedGoodsFilters(prev => {
      if (prev.sort_by === field) {
        return {
          ...prev,
          sort_order: prev.sort_order === 'asc' ? 'desc' : 'asc'
        }
      }
      return {
        ...prev,
        sort_by: field,
        sort_order: 'asc'
      }
    })
  }

  // Fetch data for each tab
  const rawMaterials = useRawMaterials(rawMaterialsFilters)
  const finishedGoods = useFinishedGoods(finishedGoodsFilters)

  // Handlers
  const handleAddItem = () => {
    setAddItemDialogOpen(true)
  }

  const handleEditItem = (item: InventoryItem) => {
    console.log('Edit item:', item)
    // TODO: Open edit item dialog (Module 1.4 enhancement)
  }

  const handleAdjustQuantity = (item: InventoryItem) => {
    setSelectedItem(item)
    setAdjustDialogOpen(true)
  }

  return (
    <PageLayout
      title="Inventory Management"
      subtitle="Track raw materials and finished goods"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Inventory' }
      ]}
      primaryAction={{
        label: 'Add Item',
        onClick: handleAddItem,
        icon: <Plus className="h-4 w-4" />
      }}
    >
      {/* Summary Statistics */}
      <InventorySummaryCards />

      {/* Add Item Dialog */}
      <AddInventoryItemDialog
        open={addItemDialogOpen}
        onOpenChange={setAddItemDialogOpen}
        defaultType={activeTab === 'raw_materials' ? 'raw_material' : 'finished_good'}
      />

      {/* Adjust Quantity Dialog */}
      <AdjustQuantityDialog
        open={adjustDialogOpen}
        onOpenChange={setAdjustDialogOpen}
        item={selectedItem}
      />

      {/* Tabs for Raw Materials and Finished Goods */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'raw_materials' | 'finished_goods')}>
        <TabsList className="mb-4">
          <TabsTrigger value="raw_materials">
            Raw Materials
            {rawMaterials.data && (
              <span className="ml-2 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">
                {rawMaterials.data.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="finished_goods">
            Finished Goods
            {finishedGoods.data && (
              <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {finishedGoods.data.length}
              </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Raw Materials Tab */}
        <TabsContent value="raw_materials" className="space-y-4">
          <InventoryFilters
            filters={rawMaterialsFilters}
            onFiltersChange={setRawMaterialsFilters}
          />
          <InventoryTable
            items={rawMaterials.data || []}
            isLoading={rawMaterials.isLoading}
            onEdit={handleEditItem}
            onAdjust={handleAdjustQuantity}
            sortBy={rawMaterialsFilters.sort_by}
            sortOrder={rawMaterialsFilters.sort_order}
            onSort={handleRawMaterialsSort}
          />
        </TabsContent>

        {/* Finished Goods Tab */}
        <TabsContent value="finished_goods" className="space-y-4">
          <InventoryFilters
            filters={finishedGoodsFilters}
            onFiltersChange={setFinishedGoodsFilters}
          />
          <InventoryTable
            items={finishedGoods.data || []}
            isLoading={finishedGoods.isLoading}
            onEdit={handleEditItem}
            onAdjust={handleAdjustQuantity}
            sortBy={finishedGoodsFilters.sort_by}
            sortOrder={finishedGoodsFilters.sort_order}
            onSort={handleFinishedGoodsSort}
          />
        </TabsContent>
      </Tabs>
    </PageLayout>
  )
}
