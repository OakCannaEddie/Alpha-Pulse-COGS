/**
 * Inventory Types
 * 
 * Type definitions for inventory management system.
 * Matches database schema from 20250107000002_inventory_tables.sql
 */

export type InventoryItemType = 'raw_material' | 'finished_good'
export type InventoryItemStatus = 'active' | 'inactive' | 'discontinued'
export type TransactionType = 
  | 'purchase_receive'    // Receiving from supplier
  | 'production_consume'  // Used in production
  | 'production_output'   // Created by production
  | 'adjustment_count'    // Physical count adjustment
  | 'adjustment_waste'    // Waste/spoilage
  | 'adjustment_other'    // Other manual adjustments
  | 'transfer'            // Future: location transfers

/**
 * Core inventory item representing raw materials or finished goods
 */
export interface InventoryItem {
  id: string
  organization_id: string
  
  // Identification
  sku: string
  name: string
  description: string | null
  item_type: InventoryItemType
  
  // Categorization
  category: string | null
  
  // Inventory tracking
  current_stock: number
  unit: string
  reorder_point: number | null
  
  // Cost
  unit_cost: number | null
  
  // Status
  status: InventoryItemStatus
  metadata: Record<string, any>
  
  // Audit
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Transaction record for complete audit trail
 */
export interface InventoryTransaction {
  id: string
  organization_id: string
  item_id: string
  
  // Transaction details
  transaction_type: TransactionType
  quantity: number // Can be positive or negative
  unit_cost: number | null
  total_cost: number | null
  
  // Reference
  reference_type: string | null
  reference_id: string | null
  
  // Context
  notes: string | null
  lot_number: string | null
  transaction_date: string
  
  // Audit
  created_by: string
  created_at: string
}

/**
 * Enhanced inventory item with calculated statistics
 */
export interface InventoryItemWithStats extends InventoryItem {
  transaction_count: number
  last_transaction_date: string | null
  is_low_stock: boolean
}

/**
 * Sort field options for inventory queries
 */
export type InventorySortField = 'name' | 'sku' | 'category' | 'current_stock' | 'unit_cost' | 'created_at' | 'updated_at'

/**
 * Sort order options
 */
export type SortOrder = 'asc' | 'desc'

/**
 * Filter options for inventory queries
 */
export interface InventoryFilters {
  item_type?: InventoryItemType
  status?: InventoryItemStatus
  category?: string
  search?: string // Search by name or SKU
  low_stock_only?: boolean
  sort_by?: InventorySortField
  sort_order?: SortOrder
}

/**
 * Filter options for transaction queries
 */
export interface TransactionFilters {
  item_id?: string
  transaction_type?: TransactionType
  start_date?: string
  end_date?: string
  reference_type?: string
  reference_id?: string
  lot_number?: string
}

/**
 * Input for creating new inventory item
 */
export interface CreateInventoryItemInput {
  sku: string
  name: string
  description?: string
  item_type: InventoryItemType
  category?: string
  unit: string
  reorder_point?: number
  unit_cost?: number
  status?: InventoryItemStatus
  metadata?: Record<string, any>
  
  // Optional initial stock (creates first transaction)
  initial_stock?: number
  initial_notes?: string
}

/**
 * Input for updating inventory item
 */
export interface UpdateInventoryItemInput {
  name?: string
  description?: string
  category?: string
  unit?: string
  reorder_point?: number
  unit_cost?: number
  status?: InventoryItemStatus
  metadata?: Record<string, any>
}

/**
 * Input for creating inventory adjustment
 */
export interface CreateAdjustmentInput {
  item_id: string
  transaction_type: TransactionType
  quantity: number // Positive for increase, negative for decrease
  unit_cost?: number
  notes?: string
  lot_number?: string
  transaction_date?: string // Defaults to now
}

/**
 * Summary statistics for inventory
 */
export interface InventorySummary {
  total_items: number
  total_value: number
  low_stock_items: number
  raw_materials_count: number
  finished_goods_count: number
  inactive_items: number
}
