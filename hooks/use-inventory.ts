/**
 * Inventory React Query Hooks
 * 
 * Custom hooks for fetching inventory data using React Query.
 * Provides automatic caching, background refetching, and loading states.
 * 
 * Usage:
 * ```tsx
 * const { data: items, isLoading } = useInventoryItems(filters)
 * const { data: summary } = useInventorySummary()
 * ```
 */

'use client'

import { useQuery } from '@tanstack/react-query'
import { useSupabase } from '@/utils/supabase/context'
import { useOrganization } from '@/hooks/use-organization'
import {
  getInventoryItems,
  getInventoryItem,
  getInventoryTransactions,
  getInventorySummary,
  getInventoryCategories,
} from '@/services/inventory.service'
import {
  InventoryFilters,
  TransactionFilters,
} from '@/types/inventory.types'

/**
 * Hook to fetch all inventory items with optional filtering
 * @param filters - Optional filters (type, status, category, search, etc.)
 */
export function useInventoryItems(filters?: InventoryFilters) {
  const supabase = useSupabase()
  const { activeOrganization } = useOrganization()

  return useQuery({
    queryKey: ['inventory-items', activeOrganization?.id, filters],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        throw new Error('No active organization')
      }
      return getInventoryItems(supabase, activeOrganization.id, filters)
    },
    enabled: !!activeOrganization?.id,
    staleTime: 30000, // Consider data fresh for 30 seconds
  })
}

/**
 * Hook to fetch a single inventory item by ID
 * @param itemId - Inventory item UUID
 */
export function useInventoryItem(itemId: string | null) {
  const supabase = useSupabase()

  return useQuery({
    queryKey: ['inventory-item', itemId],
    queryFn: async () => {
      if (!itemId) {
        throw new Error('No item ID provided')
      }
      return getInventoryItem(supabase, itemId)
    },
    enabled: !!itemId,
    staleTime: 30000,
  })
}

/**
 * Hook to fetch inventory transactions with optional filtering
 * @param filters - Optional transaction filters
 */
export function useInventoryTransactions(filters?: TransactionFilters) {
  const supabase = useSupabase()
  const { activeOrganization } = useOrganization()

  return useQuery({
    queryKey: ['inventory-transactions', activeOrganization?.id, filters],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        throw new Error('No active organization')
      }
      return getInventoryTransactions(supabase, activeOrganization.id, filters)
    },
    enabled: !!activeOrganization?.id,
    staleTime: 10000, // Transactions update more frequently
  })
}

/**
 * Hook to fetch inventory summary statistics
 */
export function useInventorySummary() {
  const supabase = useSupabase()
  const { activeOrganization } = useOrganization()

  return useQuery({
    queryKey: ['inventory-summary', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        throw new Error('No active organization')
      }
      return getInventorySummary(supabase, activeOrganization.id)
    },
    enabled: !!activeOrganization?.id,
    staleTime: 60000, // Summary can be slightly stale (1 minute)
  })
}

/**
 * Hook to fetch available inventory categories
 */
export function useInventoryCategories() {
  const supabase = useSupabase()
  const { activeOrganization } = useOrganization()

  return useQuery({
    queryKey: ['inventory-categories', activeOrganization?.id],
    queryFn: async () => {
      if (!activeOrganization?.id) {
        throw new Error('No active organization')
      }
      return getInventoryCategories(supabase, activeOrganization.id)
    },
    enabled: !!activeOrganization?.id,
    staleTime: 300000, // Categories change rarely (5 minutes)
  })
}

/**
 * Hook to fetch raw materials only
 */
export function useRawMaterials(filters?: Omit<InventoryFilters, 'item_type'>) {
  return useInventoryItems({
    ...filters,
    item_type: 'raw_material',
  })
}

/**
 * Hook to fetch finished goods only
 */
export function useFinishedGoods(filters?: Omit<InventoryFilters, 'item_type'>) {
  return useInventoryItems({
    ...filters,
    item_type: 'finished_good',
  })
}

/**
 * Hook to fetch low stock items
 */
export function useLowStockItems(filters?: Omit<InventoryFilters, 'low_stock_only'>) {
  return useInventoryItems({
    ...filters,
    low_stock_only: true,
  })
}
