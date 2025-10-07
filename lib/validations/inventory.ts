/**
 * Inventory Validation Schemas
 * 
 * Zod schemas for validating inventory-related forms.
 * Ensures data integrity before sending to the database.
 */

import { z } from 'zod'

/**
 * Schema for creating a new inventory item
 */
export const createInventoryItemSchema = z.object({
  sku: z.string()
    .min(1, 'SKU is required')
    .max(100, 'SKU must be less than 100 characters')
    .regex(/^[A-Z0-9-]+$/, 'SKU must contain only uppercase letters, numbers, and hyphens'),
  
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .trim(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  item_type: z.enum(['raw_material', 'finished_good'], {
    required_error: 'Please select an item type',
  }),
  
  category: z.string()
    .max(100, 'Category must be less than 100 characters')
    .optional(),
  
  unit: z.string()
    .min(1, 'Unit is required')
    .max(50, 'Unit must be less than 50 characters'),
  
  reorder_point: z.number()
    .min(0, 'Reorder point must be positive')
    .optional()
    .nullable(),
  
  unit_cost: z.number()
    .min(0, 'Unit cost must be positive')
    .optional()
    .nullable(),
  
  status: z.enum(['active', 'inactive', 'discontinued'])
    .optional()
    .default('active'),
  
  initial_stock: z.number()
    .min(0, 'Initial stock must be positive')
    .optional(),
  
  initial_notes: z.string()
    .max(500, 'Notes must be less than 500 characters')
    .optional(),
})

export type CreateInventoryItemFormData = z.infer<typeof createInventoryItemSchema>

/**
 * Schema for updating an inventory item
 */
export const updateInventoryItemSchema = z.object({
  name: z.string()
    .min(1, 'Name is required')
    .max(255, 'Name must be less than 255 characters')
    .optional(),
  
  description: z.string()
    .max(1000, 'Description must be less than 1000 characters')
    .optional(),
  
  category: z.string()
    .max(100, 'Category must be less than 100 characters')
    .optional(),
  
  unit: z.string()
    .min(1, 'Unit is required')
    .max(50, 'Unit must be less than 50 characters')
    .optional(),
  
  reorder_point: z.number()
    .min(0, 'Reorder point must be positive')
    .optional(),
  
  unit_cost: z.number()
    .min(0, 'Unit cost must be positive')
    .optional(),
  
  status: z.enum(['active', 'inactive', 'discontinued'])
    .optional(),
})

export type UpdateInventoryItemFormData = z.infer<typeof updateInventoryItemSchema>

/**
 * Schema for inventory adjustment
 */
export const createAdjustmentSchema = z.object({
  transaction_type: z.enum([
    'purchase_receive',
    'production_consume',
    'production_output',
    'adjustment_count',
    'adjustment_waste',
    'adjustment_other',
    'transfer',
  ], {
    required_error: 'Please select an adjustment type',
  }),
  
  quantity: z.number({
    required_error: 'Quantity is required',
    invalid_type_error: 'Quantity must be a number',
  })
    .refine((val) => val !== 0, 'Quantity cannot be zero'),
  
  unit_cost: z.number()
    .min(0, 'Unit cost must be positive')
    .optional(),
  
  notes: z.string()
    .max(1000, 'Notes must be less than 1000 characters')
    .optional(),
  
  lot_number: z.string()
    .max(100, 'Lot number must be less than 100 characters')
    .optional(),
  
  transaction_date: z.string()
    .optional(),
})

export type CreateAdjustmentFormData = z.infer<typeof createAdjustmentSchema>

/**
 * Common unit options for dropdowns
 */
export const COMMON_UNITS = [
  // Weight
  'kg', 'g', 'mg', 'lbs', 'oz',
  // Volume
  'L', 'mL', 'gal', 'qt', 'pt', 'cups', 'fl oz',
  // Count
  'units', 'pieces', 'boxes', 'cases', 'packs',
  // Length
  'm', 'cm', 'mm', 'ft', 'in',
] as const

/**
 * Transaction type display names
 */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  purchase_receive: 'Purchase Receipt',
  production_consume: 'Production Consumption',
  production_output: 'Production Output',
  adjustment_count: 'Physical Count Adjustment',
  adjustment_waste: 'Waste/Spoilage',
  adjustment_other: 'Other Adjustment',
  transfer: 'Transfer',
}
