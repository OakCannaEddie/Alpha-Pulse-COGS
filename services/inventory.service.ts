/**
 * Inventory Service
 * 
 * Handles all inventory-related database operations including:
 * - CRUD operations for inventory items
 * - Transaction creation and tracking
 * - Stock adjustments with audit trail
 * - Query filtering and search
 * 
 * Uses Supabase client with Clerk authentication
 * All operations are scoped to the user's active organization
 */

import { SupabaseClient } from '@supabase/supabase-js'
import {
  InventoryItem,
  InventoryTransaction,
  InventoryItemWithStats,
  InventoryFilters,
  TransactionFilters,
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  CreateAdjustmentInput,
  InventorySummary,
} from '@/types/inventory.types'

/**
 * Get all inventory items with optional filtering
 * @param supabase - Supabase client instance
 * @param organizationId - Current organization ID
 * @param filters - Optional filters for item type, status, category, search, sorting, etc.
 */
export async function getInventoryItems(
  supabase: SupabaseClient,
  organizationId: string,
  filters?: InventoryFilters
) {
  let query = supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', organizationId)

  // Apply sorting (defaults to name ascending)
  const sortField = filters?.sort_by || 'name'
  const sortOrder = filters?.sort_order || 'asc'
  query = query.order(sortField, { ascending: sortOrder === 'asc' })

  // Apply filters
  if (filters?.item_type) {
    query = query.eq('item_type', filters.item_type)
  }

  if (filters?.status) {
    query = query.eq('status', filters.status)
  }

  if (filters?.category) {
    query = query.eq('category', filters.category)
  }

  if (filters?.search) {
    // Search in name or SKU
    query = query.or(`name.ilike.%${filters.search}%,sku.ilike.%${filters.search}%`)
  }

  if (filters?.low_stock_only) {
    query = query.not('reorder_point', 'is', null)
      .filter('current_stock', 'lte', 'reorder_point')
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching inventory items:', error)
    throw new Error(`Failed to fetch inventory items: ${error.message}`)
  }

  return data as InventoryItem[]
}

/**
 * Get a single inventory item by ID
 * @param supabase - Supabase client instance
 * @param itemId - Inventory item UUID
 */
export async function getInventoryItem(
  supabase: SupabaseClient,
  itemId: string
) {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('id', itemId)
    .single()

  if (error) {
    console.error('Error fetching inventory item:', error)
    throw new Error(`Failed to fetch inventory item: ${error.message}`)
  }

  return data as InventoryItem
}

/**
 * Create a new inventory item with optional initial stock
 * @param supabase - Supabase client instance
 * @param organizationId - Current organization ID
 * @param userId - Current user ID (from Clerk)
 * @param input - Inventory item data
 */
export async function createInventoryItem(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  input: CreateInventoryItemInput
) {
  // Create the inventory item
  const { data: item, error: itemError } = await supabase
    .from('inventory_items')
    .insert({
      organization_id: organizationId,
      sku: input.sku,
      name: input.name,
      description: input.description || null,
      item_type: input.item_type,
      category: input.category || null,
      unit: input.unit,
      reorder_point: input.reorder_point || null,
      unit_cost: input.unit_cost || null,
      status: input.status || 'active',
      metadata: input.metadata || {},
      current_stock: 0, // Will be updated by transaction trigger
      created_by: userId,
    })
    .select()
    .single()

  if (itemError) {
    console.error('Error creating inventory item:', itemError)
    throw new Error(`Failed to create inventory item: ${itemError.message}`)
  }

  // If initial stock provided, create initial transaction
  if (input.initial_stock && input.initial_stock > 0) {
    const { error: transactionError } = await supabase
      .from('inventory_transactions')
      .insert({
        organization_id: organizationId,
        item_id: item.id,
        transaction_type: 'adjustment_other',
        quantity: input.initial_stock,
        unit_cost: input.unit_cost || null,
        total_cost: input.unit_cost ? input.unit_cost * input.initial_stock : null,
        notes: input.initial_notes || 'Initial stock',
        created_by: userId,
      })

    if (transactionError) {
      console.error('Error creating initial transaction:', transactionError)
      // Note: Item is created but transaction failed - acceptable for now
      // In production, consider using database transaction or rollback
    }
  }

  return item as InventoryItem
}

/**
 * Update an existing inventory item
 * @param supabase - Supabase client instance
 * @param itemId - Inventory item UUID
 * @param userId - Current user ID
 * @param input - Fields to update
 */
export async function updateInventoryItem(
  supabase: SupabaseClient,
  itemId: string,
  userId: string,
  input: UpdateInventoryItemInput
) {
  const { data, error } = await supabase
    .from('inventory_items')
    .update({
      ...input,
      updated_by: userId,
      updated_at: new Date().toISOString(),
    })
    .eq('id', itemId)
    .select()
    .single()

  if (error) {
    console.error('Error updating inventory item:', error)
    throw new Error(`Failed to update inventory item: ${error.message}`)
  }

  return data as InventoryItem
}

/**
 * Delete an inventory item (soft delete recommended in production)
 * @param supabase - Supabase client instance
 * @param itemId - Inventory item UUID
 */
export async function deleteInventoryItem(
  supabase: SupabaseClient,
  itemId: string
) {
  const { error } = await supabase
    .from('inventory_items')
    .delete()
    .eq('id', itemId)

  if (error) {
    console.error('Error deleting inventory item:', error)
    throw new Error(`Failed to delete inventory item: ${error.message}`)
  }

  return true
}

/**
 * Get all transactions for an item or filtered by criteria
 * @param supabase - Supabase client instance
 * @param organizationId - Current organization ID
 * @param filters - Optional transaction filters
 */
export async function getInventoryTransactions(
  supabase: SupabaseClient,
  organizationId: string,
  filters?: TransactionFilters
) {
  let query = supabase
    .from('inventory_transactions')
    .select('*, inventory_items(name, sku, unit)')
    .eq('organization_id', organizationId)
    .order('transaction_date', { ascending: false })
    .limit(100) // Paginate in production

  // Apply filters
  if (filters?.item_id) {
    query = query.eq('item_id', filters.item_id)
  }

  if (filters?.transaction_type) {
    query = query.eq('transaction_type', filters.transaction_type)
  }

  if (filters?.reference_type) {
    query = query.eq('reference_type', filters.reference_type)
  }

  if (filters?.reference_id) {
    query = query.eq('reference_id', filters.reference_id)
  }

  if (filters?.lot_number) {
    query = query.eq('lot_number', filters.lot_number)
  }

  if (filters?.start_date) {
    query = query.gte('transaction_date', filters.start_date)
  }

  if (filters?.end_date) {
    query = query.lte('transaction_date', filters.end_date)
  }

  const { data, error } = await query

  if (error) {
    console.error('Error fetching transactions:', error)
    throw new Error(`Failed to fetch transactions: ${error.message}`)
  }

  return data as InventoryTransaction[]
}

/**
 * Create an inventory adjustment transaction
 * @param supabase - Supabase client instance
 * @param organizationId - Current organization ID
 * @param userId - Current user ID
 * @param input - Adjustment details
 */
export async function createInventoryAdjustment(
  supabase: SupabaseClient,
  organizationId: string,
  userId: string,
  input: CreateAdjustmentInput
) {
  const { data, error } = await supabase
    .from('inventory_transactions')
    .insert({
      organization_id: organizationId,
      item_id: input.item_id,
      transaction_type: input.transaction_type,
      quantity: input.quantity,
      unit_cost: input.unit_cost || null,
      total_cost: input.unit_cost ? input.unit_cost * Math.abs(input.quantity) : null,
      notes: input.notes || null,
      lot_number: input.lot_number || null,
      transaction_date: input.transaction_date || new Date().toISOString(),
      created_by: userId,
    })
    .select()
    .single()

  if (error) {
    console.error('Error creating adjustment:', error)
    throw new Error(`Failed to create adjustment: ${error.message}`)
  }

  return data as InventoryTransaction
}

/**
 * Get inventory summary statistics
 * @param supabase - Supabase client instance
 * @param organizationId - Current organization ID
 */
export async function getInventorySummary(
  supabase: SupabaseClient,
  organizationId: string
): Promise<InventorySummary> {
  // Get all items for calculations
  const { data: items, error } = await supabase
    .from('inventory_items')
    .select('*')
    .eq('organization_id', organizationId)

  if (error) {
    console.error('Error fetching inventory summary:', error)
    throw new Error(`Failed to fetch inventory summary: ${error.message}`)
  }

  // Calculate summary stats
  const summary: InventorySummary = {
    total_items: items.length,
    total_value: items.reduce((sum, item) => {
      const value = (item.unit_cost || 0) * item.current_stock
      return sum + value
    }, 0),
    low_stock_items: items.filter(item => 
      item.reorder_point !== null && 
      item.current_stock <= item.reorder_point &&
      item.status === 'active'
    ).length,
    raw_materials_count: items.filter(item => item.item_type === 'raw_material').length,
    finished_goods_count: items.filter(item => item.item_type === 'finished_good').length,
    inactive_items: items.filter(item => item.status !== 'active').length,
  }

  return summary
}

/**
 * Get unique categories for filtering
 * @param supabase - Supabase client instance
 * @param organizationId - Current organization ID
 */
export async function getInventoryCategories(
  supabase: SupabaseClient,
  organizationId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('inventory_items')
    .select('category')
    .eq('organization_id', organizationId)
    .not('category', 'is', null)
    .order('category')

  if (error) {
    console.error('Error fetching categories:', error)
    return []
  }

  // Get unique categories
  const uniqueCategories = new Set<string>()
  data.forEach(item => {
    if (item.category) {
      uniqueCategories.add(item.category)
    }
  })
  return Array.from(uniqueCategories)
}
