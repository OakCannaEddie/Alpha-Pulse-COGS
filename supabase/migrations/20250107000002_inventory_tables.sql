-- Inventory Tables Migration
-- Creates inventory management foundation with full audit trail
-- Phase 1, Module 1.1 - Priority: CRITICAL
-- Dependencies: 20250107000001_core_manufacturing_tables.sql

-- Create custom types for inventory management
CREATE TYPE inventory_item_type AS ENUM ('raw_material', 'finished_good');
CREATE TYPE inventory_item_status AS ENUM ('active', 'inactive', 'discontinued');
CREATE TYPE transaction_type AS ENUM (
    'purchase_receive',    -- Receiving from supplier
    'production_consume',  -- Used in production
    'production_output',   -- Created by production
    'adjustment_count',    -- Physical count adjustment
    'adjustment_waste',    -- Waste/spoilage
    'adjustment_other',    -- Other manual adjustments
    'transfer'            -- Future: location transfers
);

-- Inventory Items table - Core product/material tracking
CREATE TABLE inventory_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Item identification
    sku VARCHAR(100) NOT NULL, -- Stock Keeping Unit (user-defined or auto-generated)
    name VARCHAR(255) NOT NULL,
    description TEXT,
    item_type inventory_item_type NOT NULL,
    
    -- Categorization
    category VARCHAR(100), -- User-defined categories (e.g., "Packaging", "Ingredients")
    
    -- Inventory tracking
    current_stock DECIMAL(15, 4) DEFAULT 0 NOT NULL, -- Calculated from transactions
    unit VARCHAR(50) NOT NULL, -- kg, lbs, pieces, liters, etc.
    reorder_point DECIMAL(15, 4), -- Alert threshold for low stock
    
    -- Cost tracking
    unit_cost DECIMAL(15, 4), -- Most recent/average cost per unit
    
    -- Status and metadata
    status inventory_item_status DEFAULT 'active',
    metadata JSONB DEFAULT '{}', -- Flexible field for custom attributes
    
    -- Audit fields
    created_by TEXT NOT NULL REFERENCES user_profiles(id),
    updated_by TEXT REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_items_sku_org_unique UNIQUE(organization_id, sku),
    CONSTRAINT inventory_items_name_not_empty CHECK (LENGTH(TRIM(name)) > 0),
    CONSTRAINT inventory_items_sku_not_empty CHECK (LENGTH(TRIM(sku)) > 0),
    CONSTRAINT inventory_items_unit_not_empty CHECK (LENGTH(TRIM(unit)) > 0),
    CONSTRAINT inventory_items_current_stock_positive CHECK (current_stock >= 0),
    CONSTRAINT inventory_items_unit_cost_positive CHECK (unit_cost IS NULL OR unit_cost >= 0),
    CONSTRAINT inventory_items_reorder_positive CHECK (reorder_point IS NULL OR reorder_point >= 0)
);

-- Inventory Transactions table - Complete audit trail of all inventory changes
CREATE TABLE inventory_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES inventory_items(id) ON DELETE CASCADE,
    
    -- Transaction details
    transaction_type transaction_type NOT NULL,
    quantity DECIMAL(15, 4) NOT NULL, -- Can be positive (add) or negative (remove)
    unit_cost DECIMAL(15, 4), -- Cost per unit at time of transaction
    total_cost DECIMAL(15, 4), -- quantity * unit_cost (for convenience)
    
    -- Reference to source document (PO, Production Run, etc.)
    reference_type VARCHAR(50), -- 'purchase_order', 'production_run', 'adjustment', etc.
    reference_id UUID, -- Links to the source document
    
    -- Additional context
    notes TEXT, -- User-entered reason/description
    lot_number VARCHAR(100), -- For traceability (raw materials)
    transaction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(), -- When transaction occurred
    
    -- Audit fields
    created_by TEXT NOT NULL REFERENCES user_profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Constraints
    CONSTRAINT inventory_transactions_quantity_not_zero CHECK (quantity != 0),
    CONSTRAINT inventory_transactions_unit_cost_positive CHECK (unit_cost IS NULL OR unit_cost >= 0)
);

-- Indexes for performance optimization
CREATE INDEX idx_inventory_items_org_id ON inventory_items(organization_id);
CREATE INDEX idx_inventory_items_type ON inventory_items(item_type);
CREATE INDEX idx_inventory_items_status ON inventory_items(status);
CREATE INDEX idx_inventory_items_category ON inventory_items(category);
CREATE INDEX idx_inventory_items_sku ON inventory_items(sku);
CREATE INDEX idx_inventory_items_name_search ON inventory_items USING gin(to_tsvector('english', name));
CREATE INDEX idx_inventory_items_low_stock ON inventory_items(current_stock, reorder_point) 
    WHERE status = 'active' AND reorder_point IS NOT NULL AND current_stock <= reorder_point;

CREATE INDEX idx_inventory_transactions_org_id ON inventory_transactions(organization_id);
CREATE INDEX idx_inventory_transactions_item_id ON inventory_transactions(item_id);
CREATE INDEX idx_inventory_transactions_type ON inventory_transactions(transaction_type);
CREATE INDEX idx_inventory_transactions_reference ON inventory_transactions(reference_type, reference_id);
CREATE INDEX idx_inventory_transactions_lot ON inventory_transactions(lot_number) WHERE lot_number IS NOT NULL;
CREATE INDEX idx_inventory_transactions_date ON inventory_transactions(transaction_date DESC);
CREATE INDEX idx_inventory_transactions_created_by ON inventory_transactions(created_by);

-- Apply updated_at trigger to inventory_items
CREATE TRIGGER update_inventory_items_updated_at BEFORE UPDATE ON inventory_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to recalculate current_stock from transactions
-- This ensures data integrity if transactions are modified
CREATE OR REPLACE FUNCTION recalculate_inventory_stock(item_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE inventory_items
    SET current_stock = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM inventory_transactions
        WHERE item_id = item_uuid
    )
    WHERE id = item_uuid;
END;
$$ LANGUAGE plpgsql;

-- Function to automatically update current_stock when transaction is inserted
CREATE OR REPLACE FUNCTION update_inventory_stock_on_transaction()
RETURNS TRIGGER AS $$
BEGIN
    -- Update the inventory item's current stock
    UPDATE inventory_items
    SET current_stock = current_stock + NEW.quantity,
        updated_at = NOW()
    WHERE id = NEW.item_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update stock on transaction insert
CREATE TRIGGER trigger_update_inventory_stock_on_insert
    AFTER INSERT ON inventory_transactions
    FOR EACH ROW
    EXECUTE FUNCTION update_inventory_stock_on_transaction();

-- Row Level Security (RLS) Policies
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_transactions ENABLE ROW LEVEL SECURITY;

-- Inventory Items RLS Policies
CREATE POLICY "Users can view inventory in their organization" ON inventory_items
    FOR SELECT USING (
        organization_id = get_user_active_organization()
        OR organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

CREATE POLICY "Authenticated users can create inventory items" ON inventory_items
    FOR INSERT WITH CHECK (
        organization_id = get_user_active_organization()
        AND created_by = requesting_user_id()
    );

CREATE POLICY "Managers and admins can update inventory items" ON inventory_items
    FOR UPDATE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND role IN ('admin', 'manager')
            AND is_active = true
        )
    );

CREATE POLICY "Only admins can delete inventory items" ON inventory_items
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND role = 'admin' 
            AND is_active = true
        )
    );

-- Inventory Transactions RLS Policies
CREATE POLICY "Users can view transactions in their organization" ON inventory_transactions
    FOR SELECT USING (
        organization_id = get_user_active_organization()
        OR organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );

CREATE POLICY "Authenticated users can create transactions" ON inventory_transactions
    FOR INSERT WITH CHECK (
        organization_id = get_user_active_organization()
        AND created_by = requesting_user_id()
    );

-- Operators cannot delete transactions (audit trail protection)
CREATE POLICY "Only managers and admins can delete transactions" ON inventory_transactions
    FOR DELETE USING (
        organization_id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND role IN ('admin', 'manager')
            AND is_active = true
        )
    );

-- Grant necessary permissions
GRANT ALL ON inventory_items TO authenticated;
GRANT ALL ON inventory_transactions TO authenticated;

-- Helpful views for common queries
CREATE OR REPLACE VIEW inventory_items_with_stats AS
SELECT 
    ii.*,
    COUNT(DISTINCT it.id) as transaction_count,
    MAX(it.transaction_date) as last_transaction_date,
    CASE 
        WHEN ii.reorder_point IS NOT NULL AND ii.current_stock <= ii.reorder_point 
        THEN true 
        ELSE false 
    END as is_low_stock
FROM inventory_items ii
LEFT JOIN inventory_transactions it ON ii.id = it.item_id
GROUP BY ii.id;

-- Comments for documentation
COMMENT ON TABLE inventory_items IS 'Core inventory tracking table for raw materials and finished goods';
COMMENT ON TABLE inventory_transactions IS 'Complete audit trail of all inventory movements and adjustments';
COMMENT ON COLUMN inventory_items.current_stock IS 'Calculated field - updated automatically from transactions via trigger';
COMMENT ON COLUMN inventory_items.metadata IS 'JSON field for custom attributes like shelf location, barcode, etc.';
COMMENT ON COLUMN inventory_transactions.quantity IS 'Can be positive (receiving/producing) or negative (consuming/adjusting down)';
COMMENT ON COLUMN inventory_transactions.reference_id IS 'Links to source document (PO, production run, etc.) for traceability';
COMMENT ON FUNCTION recalculate_inventory_stock(UUID) IS 'Manually recalculates stock from transactions if data integrity issue occurs';
COMMENT ON FUNCTION update_inventory_stock_on_transaction() IS 'Trigger function to automatically update current_stock when transaction is created';
COMMENT ON VIEW inventory_items_with_stats IS 'Enhanced view with transaction counts and low stock indicators';

-- Seed data for development (optional)
-- Uncomment to add sample data
/*
INSERT INTO inventory_items (organization_id, sku, name, item_type, category, unit, reorder_point, unit_cost, created_by) VALUES
    ((SELECT id FROM organizations LIMIT 1), 'RM-001', 'Sugar - White Granulated', 'raw_material', 'Ingredients', 'kg', 100, 2.50, (SELECT id FROM user_profiles LIMIT 1)),
    ((SELECT id FROM organizations LIMIT 1), 'RM-002', 'Cocoa Powder', 'raw_material', 'Ingredients', 'kg', 50, 8.75, (SELECT id FROM user_profiles LIMIT 1)),
    ((SELECT id FROM organizations LIMIT 1), 'FG-001', 'Chocolate Bar - Dark 70%', 'finished_good', 'Products', 'units', 500, 3.25, (SELECT id FROM user_profiles LIMIT 1));
*/
