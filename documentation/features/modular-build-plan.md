# Chronus - Modular Build Plan for Pulse COGS Platform

**Created:** October 6, 2025  
**Status:** Ready for Implementation  
**Author:** Chronus (Project Planning AI)  
**Version:** 1.0

---

## Executive Summary

This plan breaks down the Pulse COGS platform into **8 phases** with **40+ discrete modules**, ensuring each increment adds value while maintaining a working application. The strategy prioritizes:

1. **Foundation First** - Authentication, database, and core UI framework
2. **Vertical Slices** - Complete features end-to-end before expanding horizontally  
3. **Data Before UI** - Establish solid data models before complex interfaces
4. **Manual Before Automated** - Simple workflows first, automation later
5. **Working Over Perfect** - Ship functional features, iterate on polish

**Estimated Timeline:** 9-12 weeks for MVP (Phases 0-7)  
**Team Size:** 1-2 developers  
**First Deployable:** End of Phase 1 (Week 2)

---

## Table of Contents

- [Phase 0: Environment Setup & Foundation](#phase-0-environment-setup--foundation-week-1)
- [Phase 1: Inventory Foundation](#phase-1-inventory-foundation-week-2)
- [Phase 2: Basic Production](#phase-2-basic-production-week-3)
- [Phase 3: Purchase Orders & Suppliers](#phase-3-purchase-orders--suppliers-week-4)
- [Phase 4: Raw Material Lot Tracking](#phase-4-raw-material-lot-tracking-week-5)
- [Phase 5: Bills of Materials](#phase-5-bills-of-materials-week-6)
- [Phase 6: Multi-Stage Production](#phase-6-multi-stage-production-week-7)
- [Phase 7: Reports & Analytics](#phase-7-reports--analytics-week-8)
- [Phase 8: Settings & Polish](#phase-8-settings--polish-week-9)
- [Implementation Strategy](#implementation-strategy)
- [Success Metrics](#success-metrics-per-phase)

---

## Phase 0: Environment Setup & Foundation (Week 1)

### Module 0.1: Database Schema - Core Tables ✅
**Priority:** CRITICAL  
**Estimated Time:** 4 hours  
**Dependencies:** None

**Tasks:**
1. Create Supabase migration for core tables:
   - `organizations` (id, name, settings, created_at)
   - `organization_users` (user_id, organization_id, role, status)
   - `users_profile` (id, email, active_organization_id, preferences)
2. Enable RLS policies for multi-tenancy
3. Create seed data for development

**Validation:**
- ✅ Run migration successfully
- ✅ Query tables via Supabase dashboard
- ✅ RLS prevents cross-org data access

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_core_tables.sql`

---

### Module 0.2: Authentication Integration ✅
**Priority:** CRITICAL  
**Estimated Time:** 3 hours  
**Dependencies:** None

**Tasks:**
1. Add ClerkClientProvider to `app/layout.tsx`
2. Configure middleware.ts for protected routes
3. Create `/login` and `/signup` pages (basic Clerk components)
4. Test sign up → sign in → redirect to dashboard flow

**Validation:**
- ✅ User can sign up successfully
- ✅ User can sign in and see protected routes
- ✅ Logout works correctly

**Files to Modify:**
- `app/layout.tsx`
- `middleware.ts`
- `app/login/page.tsx`
- `app/signup/page.tsx`

---

### Module 0.3: Organization Context & Switcher ✅
**Priority:** HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** 0.1, 0.2

**Tasks:**
1. Create `hooks/use-organization.tsx` - manages active org
2. Create organization context provider
3. Build simple org switcher component (dropdown in header)
4. Handle user with no organization → onboarding flow

**Validation:**
- ✅ User sees their organizations in dropdown
- ✅ Switching org updates context
- ✅ All subsequent queries use active org ID

**Files to Create:**
- `hooks/use-organization.tsx`
- `contexts/organization-context.tsx`
- `components/organization-switcher.tsx`
- `app/onboarding/page.tsx`

---

### Module 0.4: Base Layout & Navigation ✅
**Priority:** HIGH  
**Estimated Time:** 6 hours  
**Dependencies:** 0.2, 0.3

**Tasks:**
1. Create `components/page-layout.tsx` wrapper component
2. Update `components/header-nav.tsx`:
   - Vertical sidebar for desktop
   - Collapsible sidebar with localStorage persistence
   - Mobile hamburger menu with Sheet component
3. Add navigation structure (Dashboard, Inventory, Production, etc.)
4. Implement active route highlighting
5. Add user menu at bottom (avatar + dropdown)

**Validation:**
- ✅ Navigation renders on all pages
- ✅ Mobile menu works on small screens
- ✅ Active route highlights correctly
- ✅ Sidebar collapse state persists

**Files to Create/Modify:**
- `components/page-layout.tsx`
- `components/header-nav.tsx` (major update)
- `components/sidebar-nav.tsx`
- `components/mobile-nav.tsx`

---

## Phase 1: Inventory Foundation (Week 2)

### Module 1.1: Inventory Schema ✅
**Priority:** CRITICAL  
**Estimated Time:** 3 hours  
**Dependencies:** 0.1

**Tasks:**
1. Create migration for inventory tables:
   - `inventory_items` (id, org_id, sku, name, type, category, unit, current_stock, reorder_point, status)
   - `inventory_transactions` (id, org_id, item_id, type, quantity, unit_cost, reference_id, reference_type, notes, created_by, created_at)
2. Add indexes for performance
3. RLS policies for org isolation

**Validation:**
- ✅ Insert test inventory items via SQL
- ✅ Query transactions by item
- ✅ Verify RLS enforcement

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_inventory_tables.sql`

---

### Module 1.2: Inventory Service Layer ✅
**Priority:** HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** 1.1

**Tasks:**
1. Create `services/inventory.service.ts`:
   - `getInventoryItems(orgId, type?, filters?)`
   - `getItemById(id)`
   - `createItem(data)`
   - `updateItem(id, data)`
   - `getTransactions(itemId?, filters?)`
2. Create `hooks/use-inventory.ts` with React Query
3. Create `hooks/use-inventory-mutations.ts`

**Validation:**
- ✅ Service functions work via API testing
- ✅ React Query hooks fetch and cache data
- ✅ Mutations invalidate queries correctly

**Files to Create:**
- `services/inventory.service.ts`
- `hooks/use-inventory.ts`
- `hooks/use-inventory-mutations.ts`

---

### Module 1.3: Inventory List Page - Read Only ✅
**Priority:** HIGH  
**Estimated Time:** 5 hours  
**Dependencies:** 1.2, 0.4

**Tasks:**
1. Create `app/inventory/page.tsx`
2. Add tabs: Raw Materials | Finished Goods
3. Build data table with columns: SKU, Name, Category, Quantity, Unit Cost, Total Value, Status
4. Add filters: Category dropdown, Search input, Status badges
5. Show summary cards: Total Items, Total Value
6. Empty state with helpful message

**Validation:**
- ✅ Page renders with mock/seed data
- ✅ Tabs switch between raw materials and finished goods
- ✅ Filters work correctly
- ✅ Summary cards calculate totals

**Files to Create:**
- `app/inventory/page.tsx`
- `components/inventory/inventory-table.tsx`
- `components/inventory/inventory-filters.tsx`
- `components/inventory/inventory-summary-cards.tsx`

---

### Module 1.4: Add Inventory Item Form ✅
**Priority:** HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** 1.3

**Tasks:**
1. Create `components/inventory/add-item-dialog.tsx`
2. Build form with React Hook Form + Zod:
   - Type (raw material / finished good)
   - SKU (auto-generate or manual)
   - Name, Category, Unit
   - Initial quantity, Unit cost
   - Reorder point, Notes
3. On submit: Create item + initial transaction
4. Show success toast

**Validation:**
- ✅ Form validates correctly
- ✅ Item appears in table immediately (optimistic update)
- ✅ Transaction logged in database
- ✅ Form resets after submission

**Files to Create:**
- `components/inventory/add-item-dialog.tsx`
- `lib/validations/inventory.ts` (Zod schemas)

---

### Module 1.5: Inventory Adjustment Flow ✅
**Priority:** HIGH  
**Estimated Time:** 5 hours  
**Dependencies:** 1.4

**Tasks:**
1. Create `components/inventory/adjust-quantity-dialog.tsx`
2. Form fields:
   - Adjustment type (dropdown: receive, consume, count, waste, other)
   - Quantity (positive/negative based on type)
   - Reason/Notes (textarea)
   - Date (defaults to today)
3. On submit: Create transaction, update current_stock
4. Add "Adjust" button to each table row

**Validation:**
- ✅ Adjustment updates item quantity
- ✅ Transaction appears in history
- ✅ Negative adjustments work correctly
- ✅ Multiple adjustments on same item accumulate

**Files to Create:**
- `components/inventory/adjust-quantity-dialog.tsx`

---

### Module 1.6: Inventory Item Detail View ✅
**Priority:** MEDIUM  
**Estimated Time:** 4 hours  
**Dependencies:** 1.5

**Tasks:**
1. Create `app/inventory/[id]/page.tsx`
2. Show item details (editable fields)
3. Transaction history table (paginated)
4. Quick actions: Adjust Quantity, Edit Item
5. Breadcrumb navigation

**Validation:**
- ✅ Clicking item name navigates to detail page
- ✅ Transaction history loads and displays
- ✅ Edit changes reflect immediately

**Files to Create:**
- `app/inventory/[id]/page.tsx`
- `components/inventory/item-detail.tsx`
- `components/inventory/transaction-history.tsx`

---

## Phase 2: Basic Production (Week 3)

### Module 2.1: Production Schema ✅
**Priority:** CRITICAL  
**Estimated Time:** 4 hours  
**Dependencies:** 1.1

**Tasks:**
1. Create migration for production tables:
   - `production_runs` (id, org_id, run_number, product_id, quantity_planned, quantity_produced, status, started_at, completed_at, labor_hours, labor_cost, overhead_cost, total_cost, notes, created_by)
   - `production_materials` (id, run_id, material_id, lot_id, quantity_planned, quantity_used, unit_cost, total_cost)
   - `bills_of_materials` (id, org_id, product_id, version, is_active, estimated_cost, notes)
   - `bom_components` (id, bom_id, material_id, quantity, unit, notes)
2. Add foreign keys and indexes
3. RLS policies

**Validation:**
- ✅ Insert test production run via SQL
- ✅ Link materials to run
- ✅ Query run with materials joined

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_production_tables.sql`

---

### Module 2.2: Production Service Layer ✅
**Priority:** HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** 2.1

**Tasks:**
1. Create `services/production.service.ts`:
   - `getProductionRuns(orgId, status?, filters?)`
   - `getRunById(id)` (includes materials)
   - `createRun(data)` (with materials array)
   - `completeRun(id, actualData)`
2. Create hooks: `use-production.ts`, `use-production-mutations.ts`

**Validation:**
- ✅ Service creates run with materials
- ✅ Complete run updates status and costs
- ✅ Hooks fetch and cache production data

**Files to Create:**
- `services/production.service.ts`
- `hooks/use-production.ts`
- `hooks/use-production-mutations.ts`

---

### Module 2.3: Start Production Run Form ✅
**Priority:** HIGH  
**Estimated Time:** 6 hours  
**Dependencies:** 2.2, 1.5

**Tasks:**
1. Create `components/production/start-run-dialog.tsx`
2. Form structure:
   - Product name input (will link to inventory later)
   - Quantity planned
   - Start date (defaults to today)
   - Materials section (dynamic fields):
     - Add/remove material rows
     - Material dropdown, quantity, unit cost
   - Labor hours + cost
   - Overhead % or fixed cost
   - Notes
3. Calculate estimated total cost in real-time
4. On submit: Create production run record
5. Add "Start Production Run" button to production page

**Validation:**
- ✅ Form calculates costs correctly
- ✅ Adding/removing materials works
- ✅ Run appears in "Active Runs" list
- ✅ Estimated costs stored correctly

**Files to Create:**
- `components/production/start-run-dialog.tsx`
- `lib/validations/production.ts`
- `lib/calculations/production-costs.ts`

---

### Module 2.4: Production Runs List Page ✅
**Priority:** HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** 2.3, 0.4

**Tasks:**
1. Create `app/production/page.tsx`
2. Tabs: Active Runs | Completed Runs | BOMs (empty for now)
3. Active runs table: Run #, Product, Quantity, Started, Status, Actions
4. Completed runs table: Run #, Product, Quantity, Date, Cost/Unit, Actions
5. Empty states for each tab

**Validation:**
- ✅ Active runs show "in progress" status
- ✅ Completed runs filtered correctly
- ✅ Clicking "View Details" navigates to detail page

**Files to Create:**
- `app/production/page.tsx`
- `components/production/production-runs-table.tsx`
- `components/production/production-filters.tsx`

---

### Module 2.5: Complete Production Run Flow ✅
**Priority:** HIGH  
**Estimated Time:** 5 hours  
**Dependencies:** 2.4

**Tasks:**
1. Create `components/production/complete-run-dialog.tsx`
2. Pre-fill with planned values (editable):
   - Quantity produced
   - Completed date
   - Materials used (table, editable quantities)
   - Labor hours
3. Recalculate costs based on actual values
4. On submit:
   - Update run status to 'completed'
   - Create inventory transactions:
     - Deduct consumed materials (negative)
     - Add produced finished goods (positive)
   - Store final COGS calculation

**Validation:**
- ✅ Completing run deducts inventory
- ✅ Finished goods quantity increases
- ✅ COGS calculated accurately
- ✅ Run moves to "Completed" tab

**Files to Create:**
- `components/production/complete-run-dialog.tsx`

---

### Module 2.6: Production Run Detail Page ✅
**Priority:** MEDIUM  
**Estimated Time:** 3 hours  
**Dependencies:** 2.5

**Tasks:**
1. Create `app/production/[id]/page.tsx`
2. Show run details, materials breakdown, cost breakdown
3. Actions: Complete Run (if active), Edit (if active)
4. Timeline of status changes

**Validation:**
- ✅ Detail page shows all run information
- ✅ Cost breakdown adds up correctly
- ✅ Actions available based on status

**Files to Create:**
- `app/production/[id]/page.tsx`
- `components/production/run-detail.tsx`
- `components/production/cost-breakdown.tsx`

---

## Phase 3: Purchase Orders & Suppliers (Week 4)

### Module 3.1: Suppliers Schema ✅
**Priority:** HIGH  
**Estimated Time:** 2 hours  
**Dependencies:** 0.1

**Tasks:**
1. Create migration for `suppliers` table:
   - id, org_id, code, name, contact_person, email, phone, address fields, status, notes, created_at
2. RLS policies

**Validation:**
- ✅ Insert test suppliers via SQL
- ✅ Query by organization

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_suppliers_table.sql`

---

### Module 3.2: Purchase Orders Schema ✅
**Priority:** HIGH  
**Estimated Time:** 3 hours  
**Dependencies:** 1.1, 3.1

**Tasks:**
1. Create migration for PO tables:
   - `purchase_orders` (id, org_id, po_number, supplier_id, order_date, expected_delivery, status, subtotal, shipping_cost, tax, total_amount, payment_terms, notes, created_by)
   - `purchase_order_items` (id, po_id, material_id, quantity_ordered, quantity_received, unit_cost, total_cost)
2. RLS policies

**Validation:**
- ✅ Insert test PO via SQL
- ✅ Link PO items to materials
- ✅ Query POs by supplier

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_purchase_orders_tables.sql`

---

### Module 3.3: Suppliers List Page ✅
**Priority:** MEDIUM  
**Estimated Time:** 4 hours  
**Dependencies:** 3.1, 0.4

**Tasks:**
1. Create `app/suppliers/page.tsx`
2. Supplier cards or table view
3. Filters: Status, Search
4. Add Supplier button → dialog form
5. Basic form: Name, Code, Contact, Email, Phone, Status

**Validation:**
- ✅ Suppliers display in cards/table
- ✅ Add supplier form works
- ✅ Search filters correctly

**Files to Create:**
- `app/suppliers/page.tsx`
- `components/suppliers/suppliers-table.tsx`
- `components/suppliers/add-supplier-dialog.tsx`
- `services/suppliers.service.ts`
- `hooks/use-suppliers.ts`

---

### Module 3.4: Supplier Detail Page ✅
**Priority:** LOW  
**Estimated Time:** 3 hours  
**Dependencies:** 3.3

**Tasks:**
1. Create `app/suppliers/[id]/page.tsx`
2. Show contact info, address
3. List of purchase orders (table)
4. Quick action: Create PO for this supplier

**Validation:**
- ✅ Detail page loads supplier data
- ✅ PO list shows related orders
- ✅ Create PO button works

**Files to Create:**
- `app/suppliers/[id]/page.tsx`
- `components/suppliers/supplier-detail.tsx`

---

### Module 3.5: Purchase Orders List Page ✅
**Priority:** HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** 3.2, 0.4

**Tasks:**
1. Create `app/purchase-orders/page.tsx`
2. PO table: PO #, Supplier, Date, Status, Total, Actions
3. Filters: Status, Supplier dropdown, Date range
4. Summary cards: Total POs, Total Value, Pending Receives
5. Create PO button

**Validation:**
- ✅ POs display in table
- ✅ Filters work correctly
- ✅ Summary cards calculate totals

**Files to Create:**
- `app/purchase-orders/page.tsx`
- `components/purchase-orders/po-table.tsx`
- `components/purchase-orders/po-filters.tsx`
- `services/purchase-orders.service.ts`
- `hooks/use-purchase-orders.ts`

---

### Module 3.6: Create Purchase Order Form ✅
**Priority:** HIGH  
**Estimated Time:** 6 hours  
**Dependencies:** 3.5

**Tasks:**
1. Create `components/purchase-orders/create-po-dialog.tsx`
2. Form structure:
   - Supplier dropdown
   - Order date, Expected delivery
   - Line items (dynamic):
     - Material dropdown, Quantity, Unit cost
     - Add/remove rows
   - Shipping, Tax (optional)
   - Payment terms, Notes
3. Calculate totals in real-time
4. On submit: Create PO with line items

**Validation:**
- ✅ Form creates PO successfully
- ✅ Line items saved correctly
- ✅ Totals calculate accurately
- ✅ PO appears in list

**Files to Create:**
- `components/purchase-orders/create-po-dialog.tsx`
- `lib/validations/purchase-orders.ts`

---

### Module 3.7: Receive Purchase Order Flow ✅
**Priority:** HIGH  
**Estimated Time:** 5 hours  
**Dependencies:** 3.6

**Tasks:**
1. Create `components/purchase-orders/receive-items-dialog.tsx`
2. Show PO line items with:
   - Ordered quantity, Received so far, Receive now (input)
   - Lot number (manual entry)
3. Received date picker
4. On submit:
   - Create inventory transactions (purchase_receive)
   - Update PO line item quantities received
   - Update PO status (partial/received)
   - Update inventory current stock

**Validation:**
- ✅ Receiving items increases inventory
- ✅ Partial receives update status correctly
- ✅ Lot numbers stored properly
- ✅ Inventory transactions created

**Files to Create:**
- `components/purchase-orders/receive-items-dialog.tsx`

---

## Phase 4: Raw Material Lot Tracking (Week 5)

### Module 4.1: Lot Tracking Schema ✅
**Priority:** HIGH  
**Estimated Time:** 2 hours  
**Dependencies:** 1.1, 3.2

**Tasks:**
1. Create migration for `raw_material_lots` table:
   - id, org_id, material_id, lot_number, quantity_received, quantity_remaining, unit_cost, received_date, supplier_id, po_id, status
2. RLS policies
3. Update `production_materials` to include `lot_id`

**Validation:**
- ✅ Insert test lots via SQL
- ✅ Link lots to materials and POs
- ✅ Query available lots by material

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_lot_tracking_table.sql`

---

### Module 4.2: Lot Service Layer ✅
**Priority:** HIGH  
**Estimated Time:** 3 hours  
**Dependencies:** 4.1

**Tasks:**
1. Create `services/lots.service.ts`:
   - `getLotsByMaterial(materialId)`
   - `getAvailableLots(materialId)` (quantity_remaining > 0)
   - `consumeLot(lotId, quantity)` (updates quantity_remaining)
   - `createLot(data)` (from PO receive)
2. Create hooks

**Validation:**
- ✅ Service fetches lots correctly
- ✅ Consume lot reduces quantity
- ✅ Available lots excludes depleted

**Files to Create:**
- `services/lots.service.ts`
- `hooks/use-lots.ts`

---

### Module 4.3: Update PO Receive to Create Lots ✅
**Priority:** HIGH  
**Estimated Time:** 3 hours  
**Dependencies:** 4.2, 3.7

**Tasks:**
1. Modify receive-items-dialog to:
   - Auto-generate lot numbers (format: `L-{date}-{sequence}`)
   - Allow manual lot number override
   - Create `raw_material_lots` record on receive
2. Link inventory transaction to lot

**Validation:**
- ✅ Receiving PO creates lot records
- ✅ Lot quantities match received quantities
- ✅ Lot numbers unique per org

**Files to Modify:**
- `components/purchase-orders/receive-items-dialog.tsx`

---

### Module 4.4: Lot Selection in Production ✅
**Priority:** HIGH  
**Estimated Time:** 4 hours  
**Dependencies:** 4.3, 2.3

**Tasks:**
1. Update start-run-dialog material section:
   - Add lot selection dropdown per material
   - Show: Lot #, Available Qty, Unit Cost, Date
   - Allow manual lot entry if not in list
2. On production run creation:
   - Store selected lot_id in production_materials
3. On production run completion:
   - Call `consumeLot()` for each material used
   - Update lot quantity_remaining

**Validation:**
- ✅ Production form shows available lots
- ✅ Selecting lot pre-fills cost
- ✅ Completing run depletes lot quantities
- ✅ Lot status changes to 'depleted' when quantity = 0

**Files to Modify:**
- `components/production/start-run-dialog.tsx`
- `components/production/complete-run-dialog.tsx`

---

### Module 4.5: Raw Materials Detail with Lots ✅
**Priority:** MEDIUM  
**Estimated Time:** 4 hours  
**Dependencies:** 4.4, 1.6

**Tasks:**
1. Create `app/raw-materials/page.tsx`
2. Material list (left sidebar or top section)
3. Selected material detail view:
   - **Lots Tab:** Table of active lots (lot #, qty, cost, date)
   - **Usage History Tab:** Production runs that consumed this material
   - **Cost Trends Tab:** Line chart of cost over time
   - **Suppliers Tab:** List of suppliers

**Validation:**
- ✅ Lots display for selected material
- ✅ Usage history shows production runs
- ✅ Cost trend chart renders
- ✅ Suppliers listed correctly

**Files to Create:**
- `app/raw-materials/page.tsx`
- `components/raw-materials/material-detail.tsx`
- `components/raw-materials/lots-table.tsx`
- `components/raw-materials/usage-history.tsx`
- `components/raw-materials/cost-trends-chart.tsx`

---

## Phase 5: Bills of Materials (Week 6)

### Module 5.1: BOMs List Page ✅
**Priority:** MEDIUM  
**Estimated Time:** 3 hours  
**Dependencies:** 2.1, 0.4

**Tasks:**
1. Create `app/production/page.tsx` BOMs tab
2. BOM cards or table: Product, Version, Active?, Components, Est. Cost, Actions
3. Add BOM button → form dialog

**Validation:**
- ✅ BOMs display in table
- ✅ Active status badge shows
- ✅ Estimated cost calculates correctly

**Files to Modify:**
- `app/production/page.tsx` (add BOMs tab)

**Files to Create:**
- `components/boms/boms-table.tsx`
- `services/boms.service.ts`
- `hooks/use-boms.ts`

---

### Module 5.2: Create/Edit BOM Form ✅
**Priority:** MEDIUM  
**Estimated Time:** 5 hours  
**Dependencies:** 5.1

**Tasks:**
1. Create `components/boms/bom-dialog.tsx`
2. Form structure:
   - Product name
   - Version (auto-increment or manual)
   - Is Active? (checkbox)
   - Components (dynamic):
     - Material dropdown, Quantity, Unit, Notes
     - Add/remove rows
   - Estimated cost (calculated from component costs)
   - Notes
3. On submit: Create BOM with components

**Validation:**
- ✅ BOM form creates BOM successfully
- ✅ Components saved correctly
- ✅ Estimated cost accurate
- ✅ Only one BOM can be active per product

**Files to Create:**
- `components/boms/bom-dialog.tsx`
- `lib/validations/boms.ts`

---

### Module 5.3: BOM Pre-fill in Production ✅
**Priority:** MEDIUM  
**Estimated Time:** 3 hours  
**Dependencies:** 5.2, 2.3

**Tasks:**
1. Update start-run-dialog:
   - Add "BOM Template" dropdown (optional)
   - Filter BOMs by product (if product selected first)
   - On BOM selection: Pre-fill materials section with BOM components
   - Allow editing pre-filled values
2. Store bom_id reference in production_runs table (nullable)

**Validation:**
- ✅ Selecting BOM populates materials
- ✅ Materials remain editable
- ✅ Can start run without BOM
- ✅ BOM reference stored in run record

**Files to Modify:**
- `components/production/start-run-dialog.tsx`
- `supabase/migrations/YYYYMMDDHHMMSS_add_bom_id_to_runs.sql`

---

### Module 5.4: BOM Detail & Versioning ✅
**Priority:** LOW  
**Estimated Time:** 4 hours  
**Dependencies:** 5.3

**Tasks:**
1. Create `app/boms/[id]/page.tsx`
2. Show BOM details, components list
3. "New Version" button → copies BOM, increments version
4. "Set Active" button (deactivates other versions)
5. Usage history: Production runs that used this BOM

**Validation:**
- ✅ Detail page shows BOM info
- ✅ Creating new version works
- ✅ Setting active deactivates others
- ✅ Usage history accurate

**Files to Create:**
- `app/boms/[id]/page.tsx`
- `components/boms/bom-detail.tsx`
- `components/boms/bom-version-history.tsx`

---

## Phase 6: Multi-Stage Production (Week 7)

### Module 6.1: Production Stages Schema ✅
**Priority:** MEDIUM  
**Estimated Time:** 3 hours  
**Dependencies:** 2.1

**Tasks:**
1. Create migration for `production_stages` table:
   - id, run_id, stage_number, stage_name, status, started_at, completed_at, labor_hours, labor_cost, overhead_cost, notes
2. Add stage support to production_materials (stage_number field)

**Validation:**
- ✅ Insert test stages via SQL
- ✅ Link stages to production run
- ✅ Query stages in order

**Files to Create:**
- `supabase/migrations/YYYYMMDDHHMMSS_production_stages_table.sql`

---

### Module 6.2: Multi-Stage Run Creation ✅
**Priority:** MEDIUM  
**Estimated Time:** 5 hours  
**Dependencies:** 6.1, 2.3

**Tasks:**
1. Update start-run-dialog:
   - Add "Stages" toggle (enable multi-stage)
   - If enabled: Show stage builder
   - Each stage: Name, Materials, Labor hours
2. On submit: Create run with stages
3. Only first stage starts immediately

**Validation:**
- ✅ Multi-stage runs created successfully
- ✅ Stages stored in order
- ✅ Only stage 1 has "in progress" status

**Files to Modify:**
- `components/production/start-run-dialog.tsx`

**Files to Create:**
- `components/production/stage-builder.tsx`

---

### Module 6.3: Complete Stage Flow ✅
**Priority:** MEDIUM  
**Estimated Time:** 4 hours  
**Dependencies:** 6.2

**Tasks:**
1. Create `components/production/complete-stage-dialog.tsx`
2. Similar to complete-run, but for one stage
3. On complete:
   - Update stage status to 'completed'
   - Start next stage if exists
   - If last stage: Complete entire run
4. Add "Complete Stage" action to run detail page

**Validation:**
- ✅ Completing stage starts next stage
- ✅ Final stage completion completes run
- ✅ Inventory updated at appropriate times

**Files to Create:**
- `components/production/complete-stage-dialog.tsx`

**Files to Modify:**
- `app/production/[id]/page.tsx`
- `services/production.service.ts`

---

## Phase 7: Reports & Analytics (Week 8)

### Module 7.1: Reports Page Layout ✅
**Priority:** MEDIUM  
**Estimated Time:** 3 hours  
**Dependencies:** 0.4

**Tasks:**
1. Create `app/reports/page.tsx`
2. Grid layout for chart cards
3. Global date range selector (top-right)
4. Empty state: "Data will appear as you use the system"

**Validation:**
- ✅ Page renders grid layout
- ✅ Date range selector works
- ✅ Empty state shows initially

**Files to Create:**
- `app/reports/page.tsx`
- `components/reports/date-range-selector.tsx`

---

### Module 7.2: Cost Breakdown Chart ✅
**Priority:** MEDIUM  
**Estimated Time:** 4 hours  
**Dependencies:** 7.1, 2.5

**Tasks:**
1. Create `components/reports/cost-breakdown-chart.tsx`
2. Fetch aggregate data: Total materials, labor, overhead costs
3. Render donut chart (Recharts)
4. Date range filter applies

**Validation:**
- ✅ Chart renders with real data
- ✅ Percentages accurate
- ✅ Date filter updates chart

**Files to Create:**
- `components/reports/cost-breakdown-chart.tsx`
- `services/reports.service.ts`
- `hooks/use-reports.ts`

---

### Module 7.3: Production Cost Trend Chart ✅
**Priority:** MEDIUM  
**Estimated Time:** 4 hours  
**Dependencies:** 7.2

**Tasks:**
1. Create `components/reports/production-trend-chart.tsx`
2. Fetch production runs grouped by date (weekly/monthly)
3. Calculate average cost per unit over time
4. Render line chart

**Validation:**
- ✅ Chart shows trend over time
- ✅ Hover displays details
- ✅ Weekly/monthly toggle works

**Files to Create:**
- `components/reports/production-trend-chart.tsx`

---

### Module 7.4: Inventory Value Cards ✅
**Priority:** MEDIUM  
**Estimated Time:** 3 hours  
**Dependencies:** 7.1, 1.5

**Tasks:**
1. Create `components/reports/inventory-metrics.tsx`
2. Calculate:
   - Total raw materials value
   - Total finished goods value
   - Low stock items count
3. Render metric cards

**Validation:**
- ✅ Cards display correct values
- ✅ Values update with date range
- ✅ Low stock count accurate

**Files to Create:**
- `components/reports/inventory-metrics.tsx`

---

### Module 7.5: CSV Export ✅
**Priority:** MEDIUM  
**Estimated Time:** 4 hours  
**Dependencies:** 7.4

**Tasks:**
1. Create `utils/export.ts` with CSV generation functions
2. Add "Export Data" button to reports page
3. Generate CSV with:
   - Report metadata (org, date range, generated time)
   - Production summary table
   - Cost breakdown
4. Trigger browser download

**Validation:**
- ✅ CSV file downloads
- ✅ Data formatted correctly
- ✅ Opens in Excel/Google Sheets

**Files to Create:**
- `utils/export.ts`
- `components/reports/export-button.tsx`

---

## Phase 8: Settings & Polish (Week 9+)

### Module 8.1: Organization Settings ✅
**Priority:** LOW  
**Estimated Time:** 4 hours  
**Dependencies:** 0.3

**Tasks:**
1. Create `app/settings/page.tsx`
2. Organization tab:
   - Name, Logo upload
   - Address fields
   - Currency dropdown
   - Overhead rate
   - Fiscal year start
3. Save settings to organizations table

**Validation:**
- ✅ Settings form loads current values
- ✅ Save updates organization record
- ✅ Currency affects display across app

**Files to Create:**
- `app/settings/page.tsx`
- `components/settings/organization-settings.tsx`
- `services/settings.service.ts`

---

### Module 8.2: User Management ✅
**Priority:** LOW  
**Estimated Time:** 5 hours  
**Dependencies:** 0.3

**Tasks:**
1. Settings Users tab
2. Table of org users: Name, Email, Role, Status, Last Login
3. Invite User dialog:
   - Email input
   - Role selection
   - Send email invite (via Clerk or custom)
4. Change role / Remove user actions

**Validation:**
- ✅ User table displays org members
- ✅ Invite sends email
- ✅ Role changes persist
- ✅ Remove user restricts access

**Files to Create:**
- `components/settings/user-management.tsx`
- `components/settings/invite-user-dialog.tsx`

---

### Module 8.3: Role-Based Permissions ✅
**Priority:** LOW  
**Estimated Time:** 4 hours  
**Dependencies:** 8.2

**Tasks:**
1. Create `utils/permissions.ts` with permission checks
2. Define permissions per role:
   - Admin: All access
   - Manager: All except user management, org settings
   - Operator: No delete, limited financial data
3. Apply to UI: Hide/disable buttons based on role
4. Apply to API: Validate permissions in service layer

**Validation:**
- ✅ Operators can't delete records
- ✅ Managers can't access user settings
- ✅ Permission errors show user-friendly messages

**Files to Create:**
- `utils/permissions.ts`
- `hooks/use-permissions.ts`

---

### Module 8.4: UI Polish & Accessibility ✅
**Priority:** LOW  
**Estimated Time:** Ongoing  
**Dependencies:** All previous

**Tasks:**
1. Add loading skeletons to all pages
2. Improve error states (friendly messages)
3. Keyboard navigation support
4. ARIA labels for screen readers
5. Mobile responsive tweaks
6. Toast notifications for all actions
7. Confirmation dialogs for destructive actions

**Validation:**
- ✅ App works without mouse
- ✅ Screen reader announces elements
- ✅ Works on mobile devices
- ✅ No console errors/warnings

**Files to Create:**
- `components/ui/loading-skeleton.tsx`
- `components/ui/error-state.tsx`
- `components/ui/confirmation-dialog.tsx`

---

### Module 8.5: Performance Optimization ✅
**Priority:** LOW  
**Estimated Time:** Ongoing  
**Dependencies:** All previous

**Tasks:**
1. Implement pagination for large tables
2. Add indexes to frequently queried columns
3. Optimize React Query cache strategies
4. Lazy load charts and heavy components
5. Image optimization (logo uploads)
6. Bundle size analysis and code splitting

**Validation:**
- ✅ Tables load quickly with 1000+ records
- ✅ Database queries under 100ms
- ✅ Page load times under 2s
- ✅ Lighthouse score above 90

**Files to Create:**
- `components/ui/pagination.tsx`
- `utils/performance.ts`

---

## Implementation Strategy

### Daily Development Workflow

**Morning (Setup):**
1. Pull latest main branch
2. Create feature branch: `feature/module-X.X`
3. Review module requirements
4. Run migrations (if schema changes)

**Development (Execution):**
1. Write failing test (if applicable)
2. Implement module feature
3. Test manually in browser
4. Run validation checklist
5. Commit with descriptive message

**Evening (Integration):**
1. Merge main into feature branch
2. Resolve conflicts
3. Final smoke test
4. Create PR with module checklist
5. Deploy to staging (if available)

### Continuous Working Build Rules

**Never Break Main:**
- All commits to main must pass CI/CD
- Features hidden behind feature flags if incomplete
- Database migrations reversible
- No commented-out code in main

**Incremental Delivery:**
- Each module adds visible value
- Empty states for future features
- "Coming Soon" badges acceptable
- Progressive enhancement over big bang

**Testing Strategy:**
- Manual testing for each module
- Critical paths covered by E2E tests (future)
- Database migrations tested in staging first
- Rollback plan for each deployment

### Risk Mitigation

**Database Migrations:**
- Always create rollback migration
- Test with production-like data volume
- Never drop columns with data (deprecate instead)
- Use transactions for complex migrations

**Feature Dependencies:**
- Map dependencies clearly in each module
- Stub future dependencies with mock data
- Build vertical slices, not horizontal layers
- Avoid "works when complete" features

**User Experience:**
- Show progress indicators for slow operations
- Provide actionable error messages
- Graceful degradation for missing data
- Save draft state for complex forms

---

## Success Metrics per Phase

### Phase 0-1 (Weeks 1-2)
- ✅ User can sign up, create org, add inventory items
- ✅ Inventory adjustments work correctly
- ✅ Basic navigation functional
- **Deliverable:** Working inventory management system

### Phase 2-3 (Weeks 3-4)
- ✅ User can start and complete production runs
- ✅ Production deducts inventory correctly
- ✅ POs create and receive inventory
- **Deliverable:** Complete production and purchasing workflow

### Phase 4-5 (Weeks 5-6)
- ✅ Lot tracking functional for raw materials
- ✅ Production runs consume specific lots
- ✅ BOMs pre-fill production forms
- **Deliverable:** Full traceability and recipe management

### Phase 6-7 (Weeks 7-8)
- ✅ Multi-stage production supported
- ✅ Reports display meaningful data
- ✅ CSV export works
- **Deliverable:** Analytics and complex production flows

### Phase 8+ (Week 9+)
- ✅ Settings configurable
- ✅ User management functional
- ✅ App polished and performant
- **Deliverable:** Production-ready application

---

## File Structure Overview

```
app/
├── inventory/
│   ├── page.tsx
│   └── [id]/page.tsx
├── raw-materials/
│   └── page.tsx
├── production/
│   ├── page.tsx
│   └── [id]/page.tsx
├── boms/
│   └── [id]/page.tsx
├── suppliers/
│   ├── page.tsx
│   └── [id]/page.tsx
├── purchase-orders/
│   └── page.tsx
├── reports/
│   └── page.tsx
├── settings/
│   └── page.tsx
└── onboarding/
    └── page.tsx

components/
├── inventory/
│   ├── inventory-table.tsx
│   ├── add-item-dialog.tsx
│   ├── adjust-quantity-dialog.tsx
│   └── transaction-history.tsx
├── production/
│   ├── start-run-dialog.tsx
│   ├── complete-run-dialog.tsx
│   ├── production-runs-table.tsx
│   └── stage-builder.tsx
├── boms/
│   ├── boms-table.tsx
│   └── bom-dialog.tsx
├── purchase-orders/
│   ├── create-po-dialog.tsx
│   └── receive-items-dialog.tsx
├── suppliers/
│   └── add-supplier-dialog.tsx
├── reports/
│   ├── cost-breakdown-chart.tsx
│   ├── production-trend-chart.tsx
│   └── inventory-metrics.tsx
└── settings/
    ├── organization-settings.tsx
    └── user-management.tsx

services/
├── inventory.service.ts
├── production.service.ts
├── lots.service.ts
├── boms.service.ts
├── suppliers.service.ts
├── purchase-orders.service.ts
├── reports.service.ts
└── settings.service.ts

hooks/
├── use-organization.tsx
├── use-inventory.ts
├── use-production.ts
├── use-lots.ts
├── use-boms.ts
├── use-suppliers.ts
├── use-purchase-orders.ts
├── use-reports.ts
└── use-permissions.ts

lib/
├── validations/
│   ├── inventory.ts
│   ├── production.ts
│   ├── boms.ts
│   └── purchase-orders.ts
└── calculations/
    └── production-costs.ts

utils/
├── permissions.ts
├── export.ts
└── performance.ts

supabase/
└── migrations/
    ├── YYYYMMDDHHMMSS_core_tables.sql
    ├── YYYYMMDDHHMMSS_inventory_tables.sql
    ├── YYYYMMDDHHMMSS_production_tables.sql
    ├── YYYYMMDDHHMMSS_suppliers_table.sql
    ├── YYYYMMDDHHMMSS_purchase_orders_tables.sql
    ├── YYYYMMDDHHMMSS_lot_tracking_table.sql
    └── YYYYMMDDHHMMSS_production_stages_table.sql
```

---

## Conclusion

This modular build plan ensures:

1. **Always Shippable** - Each module adds complete functionality
2. **Low Risk** - Small increments = easy debugging
3. **Fast Feedback** - Stakeholders see progress weekly
4. **Flexible** - Can re-prioritize modules based on feedback
5. **Maintainable** - Clear boundaries between features

**Key Success Factors:**
- Start with solid foundation (Phase 0)
- Build vertical slices, not horizontal layers
- Test each module before moving forward
- Keep main branch always working
- Document decisions and trade-offs

**Next Steps:**
1. Review and approve this plan
2. Set up development environment
3. Begin Phase 0, Module 0.1
4. Schedule weekly progress reviews

---

**Plan prepared by:** Chronus  
**For questions or clarifications, review:**
- `revised-implementation-plan.md` - Detailed requirements
- `clarifying-questions.md` - Outstanding questions
- `starter_tech_stack_document.md` - Technical foundation
