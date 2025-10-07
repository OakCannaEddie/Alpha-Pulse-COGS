/**
 * Production Management Type Definitions
 * 
 * Defines TypeScript interfaces for production runs, BOMs, and related entities.
 * These types align with the database schema and provide type safety for the application.
 * 
 * @module types/production
 */

/**
 * Production run status enum
 * Matches database enum: production_status
 */
export type ProductionStatus = 'planning' | 'in_progress' | 'completed' | 'cancelled'

/**
 * Production Run
 * Represents a manufacturing run from planning to completion
 */
export interface ProductionRun {
  id: string
  organization_id: string
  run_number: string // Auto-generated: PR-YYYYMMDD-XXX
  
  // Product information
  product_id: string | null
  product_name: string
  
  // Quantity
  quantity_planned: number
  quantity_produced: number | null
  unit: string
  
  // Status and timing
  status: ProductionStatus
  started_at: string | null // ISO 8601 datetime
  completed_at: string | null
  
  // Costs
  labor_hours: number | null
  labor_cost: number | null
  overhead_cost: number | null
  total_cost: number | null
  cost_per_unit: number | null
  
  // Additional
  notes: string | null
  metadata: Record<string, any>
  
  // Audit
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

/**
 * Production Run Material
 * Tracks materials consumed in a production run
 */
export interface ProductionRunMaterial {
  id: string
  organization_id: string
  production_run_id: string
  
  // Material details
  material_id: string
  material_name: string
  
  // Quantity
  quantity_planned: number
  quantity_actual: number | null
  unit: string
  
  // Cost
  unit_cost: number | null
  total_cost: number | null
  
  // Lot tracking
  lot_number: string | null
  
  // Additional
  notes: string | null
  
  // Audit
  created_at: string
  updated_at: string
}

/**
 * Bill of Materials (BOM)
 * Template/recipe for producing a product
 */
export interface BillOfMaterials {
  id: string
  organization_id: string
  
  // Product
  product_id: string | null
  product_name: string
  
  // Version control
  version: string
  is_active: boolean
  
  // Yield
  output_quantity: number
  output_unit: string
  
  // Cost estimates
  estimated_cost: number | null
  estimated_labor_hours: number | null
  estimated_overhead: number | null
  
  // Additional
  description: string | null
  notes: string | null
  metadata: Record<string, any>
  
  // Audit
  created_by: string
  updated_by: string | null
  created_at: string
  updated_at: string
}

/**
 * BOM Component
 * Individual material in a BOM
 */
export interface BOMComponent {
  id: string
  bom_id: string
  
  // Material
  material_id: string
  material_name: string
  
  // Quantity
  quantity: number
  unit: string
  
  // Additional
  notes: string | null
  sort_order: number
  
  // Audit
  created_at: string
  updated_at: string
}

/**
 * Production Run with Materials (joined data)
 * Used for detail views and complete production information
 */
export interface ProductionRunWithMaterials extends ProductionRun {
  materials: ProductionRunMaterial[]
}

/**
 * BOM with Components (joined data)
 * Used for detail views and complete BOM information
 */
export interface BOMWithComponents extends BillOfMaterials {
  components: BOMComponent[]
}

/**
 * Production Run Create Input
 * Data required to start a new production run
 */
export interface CreateProductionRunInput {
  product_id?: string | null
  product_name: string
  quantity_planned: number
  unit: string
  started_at?: string | null
  labor_hours?: number | null
  notes?: string | null
  materials: {
    material_id: string
    material_name: string
    quantity_planned: number
    unit: string
    unit_cost?: number | null
    lot_number?: string | null
    notes?: string | null
  }[]
}

/**
 * Production Run Update Input
 * Data that can be updated on a production run
 */
export interface UpdateProductionRunInput {
  product_name?: string
  quantity_planned?: number
  quantity_produced?: number | null
  unit?: string
  status?: ProductionStatus
  started_at?: string | null
  completed_at?: string | null
  labor_hours?: number | null
  labor_cost?: number | null
  overhead_cost?: number | null
  total_cost?: number | null
  cost_per_unit?: number | null
  notes?: string | null
  metadata?: Record<string, any>
}

/**
 * Complete Production Run Input
 * Data required to complete a production run
 */
export interface CompleteProductionRunInput {
  quantity_produced: number
  completed_at?: string
  labor_hours?: number
  notes?: string | null
  materials: {
    id: string // production_run_material id
    quantity_actual: number
    unit_cost?: number | null
    lot_number?: string | null
    notes?: string | null
  }[]
}

/**
 * BOM Create Input
 * Data required to create a new BOM
 */
export interface CreateBOMInput {
  product_id?: string | null
  product_name: string
  version?: string
  output_quantity: number
  output_unit: string
  estimated_labor_hours?: number | null
  description?: string | null
  notes?: string | null
  components: {
    material_id: string
    material_name: string
    quantity: number
    unit: string
    notes?: string | null
    sort_order?: number
  }[]
}

/**
 * BOM Update Input
 * Data that can be updated on a BOM
 */
export interface UpdateBOMInput {
  product_name?: string
  version?: string
  is_active?: boolean
  output_quantity?: number
  output_unit?: string
  estimated_cost?: number | null
  estimated_labor_hours?: number | null
  estimated_overhead?: number | null
  description?: string | null
  notes?: string | null
  metadata?: Record<string, any>
}

/**
 * Production Filters
 * Query parameters for filtering production runs
 */
export interface ProductionFilters {
  status?: ProductionStatus | ProductionStatus[]
  product_id?: string
  search?: string // Search by run_number or product_name
  date_from?: string // Filter started_at >= date
  date_to?: string // Filter started_at <= date
  sort_by?: ProductionSortField
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * BOM Filters
 * Query parameters for filtering BOMs
 */
export interface BOMFilters {
  product_id?: string
  is_active?: boolean
  search?: string // Search by product_name or version
  sort_by?: BOMSortField
  sort_order?: 'asc' | 'desc'
  limit?: number
  offset?: number
}

/**
 * Sortable fields for production runs
 */
export type ProductionSortField = 
  | 'run_number' 
  | 'product_name' 
  | 'status' 
  | 'quantity_planned'
  | 'quantity_produced'
  | 'started_at' 
  | 'completed_at'
  | 'total_cost'
  | 'cost_per_unit'
  | 'created_at'

/**
 * Sortable fields for BOMs
 */
export type BOMSortField = 
  | 'product_name' 
  | 'version' 
  | 'is_active'
  | 'output_quantity'
  | 'estimated_cost'
  | 'created_at'

/**
 * Production summary statistics
 * Used for dashboard and analytics
 */
export interface ProductionSummary {
  total_runs: number
  active_runs: number
  completed_runs: number
  total_units_produced: number
  total_cost: number
  average_cost_per_unit: number
}
