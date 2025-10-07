/**
 * Inventory Mutation Hooks
 * 
 * Custom hooks for modifying inventory data using React Query mutations.
 * Provides automatic cache invalidation and optimistic updates.
 * 
 * Usage:
 * ```tsx
 * const createItem = useCreateInventoryItem()
 * createItem.mutate(itemData, {
 *   onSuccess: () => toast.success('Item created')
 * })
 * ```
 */

'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useSupabase } from '@/utils/supabase/context'
import { useOrganization } from '@/hooks/use-organization'
import { useUser } from '@clerk/nextjs'
import {
  createInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  createInventoryAdjustment,
} from '@/services/inventory.service'
import {
  CreateInventoryItemInput,
  UpdateInventoryItemInput,
  CreateAdjustmentInput,
} from '@/types/inventory.types'

/**
 * Hook to create a new inventory item
 */
export function useCreateInventoryItem() {
  const supabase = useSupabase()
  const { activeOrganization } = useOrganization()
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateInventoryItemInput) => {
      if (!activeOrganization?.id) {
        throw new Error('No active organization')
      }
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return createInventoryItem(supabase, activeOrganization.id, user.id, input)
    },
    onSuccess: () => {
      // Invalidate and refetch inventory queries
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
    },
  })
}

/**
 * Hook to update an existing inventory item
 */
export function useUpdateInventoryItem() {
  const supabase = useSupabase()
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ 
      itemId, 
      input 
    }: { 
      itemId: string
      input: UpdateInventoryItemInput 
    }) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return updateInventoryItem(supabase, itemId, user.id, input)
    },
    onSuccess: (data) => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-item', data.id] })
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-categories'] })
    },
  })
}

/**
 * Hook to delete an inventory item
 */
export function useDeleteInventoryItem() {
  const supabase = useSupabase()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (itemId: string) => {
      return deleteInventoryItem(supabase, itemId)
    },
    onSuccess: () => {
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] })
    },
  })
}

/**
 * Hook to create an inventory adjustment (change quantity)
 */
export function useCreateInventoryAdjustment() {
  const supabase = useSupabase()
  const { activeOrganization } = useOrganization()
  const { user } = useUser()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (input: CreateAdjustmentInput) => {
      if (!activeOrganization?.id) {
        throw new Error('No active organization')
      }
      if (!user?.id) {
        throw new Error('User not authenticated')
      }
      return createInventoryAdjustment(supabase, activeOrganization.id, user.id, input)
    },
    onSuccess: (data) => {
      // Invalidate queries to refetch updated data
      queryClient.invalidateQueries({ queryKey: ['inventory-items'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-item', data.item_id] })
      queryClient.invalidateQueries({ queryKey: ['inventory-transactions'] })
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] })
    },
  })
}
