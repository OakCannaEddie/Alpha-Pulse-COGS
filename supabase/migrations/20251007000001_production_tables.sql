-- Production Tables Migration
-- Creates production run tracking and Bill of Materials (BOM) foundation
-- Phase 2, Module 2.1 - Priority: CRITICAL
-- Dependencies: 20250107000002_inventory_tables.sql

-- Create custom types for production management
CREATE TYPE production_status AS ENUM ('planning', 'in_progress', 'completed', 'cancelled');

-- Production Runs table - Core production tracking
-- Tracks each production run from start to completion with actual costs
CREATE TABLE production_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Run identification
    run_number VARCHAR(50) NOT NULL, -- User-friendly identifier (e.g., PR-20251007-001)
    
    -- Product information
    product_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT, -- Links to finished good
    product_name VARCHAR(255) NOT NULL, -- Store name for historical records
    
    -- Quantity planning and actual
    quantity_planned DECIMAL(15, 4) NOT NULL,
    quantity_produced DECIMAL(15, 4), -- Actual quantity produced (NULL until completed)
    unit VARCHAR(50) NOT NULL, -- Production unit (kg, pieces, liters, etc.)
    
    -- Status and timing
    status production_status DEFAULT 'planning',
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Cost tracking
    labor_hours DECIMAL(10, 2), -- Total labor hours for this run
    labor_cost DECIMAL(15, 2), -- Calculated: labor_hours * labor_rate
    overhead_cost DECIMAL(15, 2), -- Calculated: overhead_rate * labor_hours or flat amount
    total_cost DECIMAL(15, 2), -- Materials + labor + overhead
    cost_per_unit DECIMAL(15, 4), -- total_cost / quantity_produced
    
    -- Additional information
    notes TEXT,
    metadata JSONB DEFAULT '{}', -- Flexible field for custom data
    
    -- Audit fields
    created_by TEXT NOT NULL REFERENCES user_profiles(id),
    updated_by TEXT REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT production_runs_number_org_unique UNIQUE(organization_id, run_number),
    CONSTRAINT production_runs_quantity_planned_positive CHECK (quantity_planned > 0),
    CONSTRAINT production_runs_quantity_produced_positive CHECK (quantity_produced IS NULL OR quantity_produced > 0),
    CONSTRAINT production_runs_completed_after_started CHECK (completed_at IS NULL OR started_at IS NULL OR completed_at >= started_at),
    CONSTRAINT production_runs_costs_positive CHECK (
        (labor_cost IS NULL OR labor_cost >= 0) AND
        (overhead_cost IS NULL OR overhead_cost >= 0) AND
        (total_cost IS NULL OR total_cost >= 0)
    )
);

-- Production Run Materials table - Links materials consumed to production runs
-- This creates the audit trail for material usage in production
CREATE TABLE production_run_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    production_run_id UUID NOT NULL REFERENCES production_runs(id) ON DELETE CASCADE,
    
    -- Material details
    material_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    material_name VARCHAR(255) NOT NULL, -- Store for historical records
    
    -- Quantity tracking
    quantity_planned DECIMAL(15, 4) NOT NULL, -- Expected usage
    quantity_actual DECIMAL(15, 4), -- Actual usage (can differ from planned)
    unit VARCHAR(50) NOT NULL,
    
    -- Cost tracking
    unit_cost DECIMAL(15, 4), -- Cost per unit at time of production
    total_cost DECIMAL(15, 2), -- quantity_actual * unit_cost
    
    -- Lot tracking (optional, can be NULL for non-lot tracked items)
    lot_number VARCHAR(100), -- Which lot was consumed
    
    -- Additional information
    notes TEXT,
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT production_run_materials_quantity_planned_positive CHECK (quantity_planned > 0),
    CONSTRAINT production_run_materials_quantity_actual_positive CHECK (quantity_actual IS NULL OR quantity_actual > 0),
    CONSTRAINT production_run_materials_costs_positive CHECK (
        (unit_cost IS NULL OR unit_cost >= 0) AND
        (total_cost IS NULL OR total_cost >= 0)
    )
);

-- Bills of Materials (BOMs) table - Templates for production runs
-- Defines standard recipes/formulas for products
CREATE TABLE bills_of_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Product information
    product_id UUID REFERENCES inventory_items(id) ON DELETE RESTRICT,
    product_name VARCHAR(255) NOT NULL,
    
    -- Version control
    version VARCHAR(50) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true, -- Only one active version per product
    
    -- Yield information
    output_quantity DECIMAL(15, 4) NOT NULL, -- How much this BOM produces
    output_unit VARCHAR(50) NOT NULL,
    
    -- Cost estimates
    estimated_cost DECIMAL(15, 2), -- Sum of component costs
    estimated_labor_hours DECIMAL(10, 2),
    estimated_overhead DECIMAL(15, 2),
    
    -- Additional information
    description TEXT,
    notes TEXT,
    metadata JSONB DEFAULT '{}',
    
    -- Audit fields
    created_by TEXT NOT NULL REFERENCES user_profiles(id),
    updated_by TEXT REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT bills_of_materials_output_quantity_positive CHECK (output_quantity > 0),
    CONSTRAINT bills_of_materials_costs_positive CHECK (
        (estimated_cost IS NULL OR estimated_cost >= 0) AND
        (estimated_labor_hours IS NULL OR estimated_labor_hours >= 0) AND
        (estimated_overhead IS NULL OR estimated_overhead >= 0)
    )
);

-- BOM Components table - Individual materials in a BOM
-- Defines what materials and quantities are needed for a product
CREATE TABLE bom_components (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bom_id UUID NOT NULL REFERENCES bills_of_materials(id) ON DELETE CASCADE,
    
    -- Material details
    material_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE RESTRICT,
    material_name VARCHAR(255) NOT NULL, -- Store for historical records
    
    -- Quantity required
    quantity DECIMAL(15, 4) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    
    -- Additional information
    notes TEXT, -- Usage instructions, substitution notes, etc.
    sort_order INTEGER DEFAULT 0, -- Display order in BOM
    
    -- Audit fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT bom_components_quantity_positive CHECK (quantity > 0)
);

-- Indexes for performance optimization
CREATE INDEX idx_production_runs_org_id ON production_runs(organization_id);
CREATE INDEX idx_production_runs_status ON production_runs(status);
CREATE INDEX idx_production_runs_product_id ON production_runs(product_id);
CREATE INDEX idx_production_runs_run_number ON production_runs(run_number);
CREATE INDEX idx_production_runs_dates ON production_runs(started_at DESC, completed_at DESC);

CREATE INDEX idx_production_run_materials_org_id ON production_run_materials(organization_id);
CREATE INDEX idx_production_run_materials_run_id ON production_run_materials(production_run_id);
CREATE INDEX idx_production_run_materials_material_id ON production_run_materials(material_id);
CREATE INDEX idx_production_run_materials_lot ON production_run_materials(lot_number) WHERE lot_number IS NOT NULL;

CREATE INDEX idx_boms_org_id ON bills_of_materials(organization_id);
CREATE INDEX idx_boms_product_id ON bills_of_materials(product_id);
CREATE INDEX idx_boms_active ON bills_of_materials(is_active) WHERE is_active = true;

CREATE INDEX idx_bom_components_bom_id ON bom_components(bom_id);
CREATE INDEX idx_bom_components_material_id ON bom_components(material_id);
CREATE INDEX idx_bom_components_sort ON bom_components(bom_id, sort_order);

-- Apply updated_at trigger to production tables
CREATE TRIGGER update_production_runs_updated_at BEFORE UPDATE ON production_runs
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_production_run_materials_updated_at BEFORE UPDATE ON production_run_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bills_of_materials_updated_at BEFORE UPDATE ON bills_of_materials
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bom_components_updated_at BEFORE UPDATE ON bom_components
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE production_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE production_run_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bills_of_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE bom_components ENABLE ROW LEVEL SECURITY;

-- Production runs policies
CREATE POLICY "Users can view production runs in their organizations" ON production_runs
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can create production runs in their organizations" ON production_runs
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
        AND created_by = requesting_user_id()
    );

CREATE POLICY "Users can update production runs in their organizations" ON production_runs
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

-- Production run materials policies
CREATE POLICY "Users can view production run materials in their organizations" ON production_run_materials
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can manage production run materials in their organizations" ON production_run_materials
    FOR ALL USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

-- BOMs policies
CREATE POLICY "Users can view BOMs in their organizations" ON bills_of_materials
    FOR SELECT USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

CREATE POLICY "Users can create BOMs in their organizations" ON bills_of_materials
    FOR INSERT WITH CHECK (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
        AND created_by = requesting_user_id()
    );

CREATE POLICY "Users can update BOMs in their organizations" ON bills_of_materials
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

-- BOM components policies (inherits from BOM access)
CREATE POLICY "Users can view BOM components" ON bom_components
    FOR SELECT USING (
        bom_id IN (
            SELECT id FROM bills_of_materials 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_users 
                WHERE user_id = requesting_user_id() 
                AND is_active = true
            )
        )
    );

CREATE POLICY "Users can manage BOM components" ON bom_components
    FOR ALL USING (
        bom_id IN (
            SELECT id FROM bills_of_materials 
            WHERE organization_id IN (
                SELECT organization_id 
                FROM organization_users 
                WHERE user_id = requesting_user_id() 
                AND is_active = true
            )
        )
    );

-- Grant permissions
GRANT ALL ON production_runs TO authenticated;
GRANT ALL ON production_run_materials TO authenticated;
GRANT ALL ON bills_of_materials TO authenticated;
GRANT ALL ON bom_components TO authenticated;

-- Helper function to generate production run numbers
-- Format: PR-YYYYMMDD-XXX (e.g., PR-20251007-001)
CREATE OR REPLACE FUNCTION generate_production_run_number(org_id UUID)
RETURNS TEXT AS $$
DECLARE
    today_date TEXT;
    sequence_num INTEGER;
    run_number TEXT;
BEGIN
    -- Get today's date in YYYYMMDD format
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');
    
    -- Find the next sequence number for today
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(run_number FROM 'PR-\d{8}-(\d+)') AS INTEGER)
    ), 0) + 1
    INTO sequence_num
    FROM production_runs
    WHERE organization_id = org_id
    AND run_number LIKE 'PR-' || today_date || '-%';
    
    -- Format as PR-YYYYMMDD-XXX
    run_number := 'PR-' || today_date || '-' || LPAD(sequence_num::TEXT, 3, '0');
    
    RETURN run_number;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE production_runs IS 'Tracks production runs from planning to completion with actual costs';
COMMENT ON TABLE production_run_materials IS 'Materials consumed in each production run with lot tracking';
COMMENT ON TABLE bills_of_materials IS 'Standard recipes/formulas for products (templates)';
COMMENT ON TABLE bom_components IS 'Individual materials required in a BOM';
COMMENT ON COLUMN production_runs.quantity_produced IS 'Actual output quantity - may differ from planned due to yield variance';
COMMENT ON COLUMN production_runs.cost_per_unit IS 'Final COGS per unit = total_cost / quantity_produced';
COMMENT ON COLUMN production_run_materials.quantity_actual IS 'Actual material used - may differ from planned';
COMMENT ON COLUMN bills_of_materials.is_active IS 'Only one active version per product - supports versioning';
COMMENT ON FUNCTION generate_production_run_number(UUID) IS 'Auto-generates sequential run numbers per organization per day';
