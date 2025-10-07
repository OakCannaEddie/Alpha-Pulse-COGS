# Revised Implementation Plan - Pulse COGS Platform

**Date:** October 3, 2025  
**Status:** Ready for Development  
**Phase:** Post-Requirements Review

## Document Purpose

This document synthesizes stakeholder responses from `page-scaffolding-plan.md` and provides a concrete implementation plan. It reflects confirmed scope decisions and identifies remaining questions in `clarifying-questions.md`.

---

## Executive Summary: Key Scope Decisions

### ✅ **In Scope - Confirmed**
- **After-the-fact data entry** - System optimized for recording completed activities
- **Manual lot tracking** - User-entered lot numbers with full traceability
- **Actual costing** - Per-run COGS based on actual materials, labor, overhead
- **Tabbed inventory** - Separate views for raw materials vs finished goods
- **Adjustment transactions** - All quantity changes logged for audit trail
- **Editable fields** - Flexibility to record reality vs. enforce BOM adherence
- **Multi-stage production** - Support production + packaging (not nested BOMs)
- **Single currency** - One currency per organization
- **Interactive dashboards** - Customizable charts with CSV export
- **RBAC** - Admin, Manager, Operator roles with permission differences
- **Multi-org users** - Organization switcher for users in multiple companies

### ❌ **Out of Scope - Deferred/Excluded**
- Real-time production tracking
- FIFO enforcement (manual lot selection instead)
- Automated reorder points
- Shelf life/expiration tracking
- Multi-location inventory
- Optimistic updates
- Bulk import/export (MVP)
- Supplier performance metrics (MVP)
- Supplier portal/communication
- Approval workflows for POs
- Three-way matching (PO/receipt/invoice)
- Foreign currency support
- Nested BOMs / sub-assemblies
- Production scheduling
- Barcode scanning
- Mobile-specific features (responsive only)
- External integrations (accounting, ERP)

---

## Technical Architecture Decisions

### Database Design Principles

**Multi-Tenancy**
- Strict organization isolation via `organization_id` on all tables
- RLS policies enforce data access boundaries
- Users can belong to multiple orgs via junction table
- Active org stored in session/JWT

**Audit Trail**
- All inventory changes via `inventory_transactions` table
- Production runs link to specific lots consumed
- Soft delete for records (preserve history)
- `created_by`, `updated_by`, `created_at`, `updated_at` on all tables

**Cost Tracking**
- Snapshot material costs at production run start
- Calculate COGS per unit = (materials + labor + overhead) / quantity produced
- Track actual vs. estimated for variance reporting
- Store cost breakdown for drill-down analysis

### Key Data Models

```typescript
// Organization & Users
interface Organization {
  id: string
  name: string
  currency: string // USD, EUR, etc.
  defaultUnit: string // kg, lbs, etc.
  costingMethod: 'ACTUAL' // Hardcoded for MVP
  overheadRate: number // % or $ per hour
  settings: OrganizationSettings
}

interface User {
  id: string // From Clerk
  email: string
  name: string
  organizations: {
    orgId: string
    role: 'admin' | 'manager' | 'operator'
  }[]
  activeOrganizationId: string
}

// Inventory
interface InventoryItem {
  id: string
  organizationId: string
  sku: string
  name: string
  type: 'raw_material' | 'finished_good'
  category: string
  currentQuantity: number
  unit: string
  reorderPoint?: number
  status: 'active' | 'inactive'
  metadata: any // Flexible field for custom data
}

interface InventoryTransaction {
  id: string
  organizationId: string
  itemId: string
  transactionType: 
    | 'purchase_receive' 
    | 'production_consume' 
    | 'production_complete'
    | 'adjustment'
  quantity: number // positive or negative
  unitCost: number
  totalCost: number
  lotNumber?: string
  referenceId?: string // Links to PO, ProductionRun, etc.
  referenceType?: string
  notes?: string
  createdBy: string
  createdAt: Date
}

// Raw Materials with Lot Tracking
interface RawMaterialLot {
  id: string
  organizationId: string
  materialId: string
  lotNumber: string // User-entered or auto-generated
  quantityReceived: number
  quantityRemaining: number
  unitCost: number
  supplierId: string
  purchaseOrderId?: string
  receivedDate: Date
  status: 'active' | 'depleted'
}

// Production
interface ProductionRun {
  id: string
  organizationId: string
  runNumber: string // Auto-generated: PR-20251003-001
  productId: string
  bomId?: string // Optional reference to BOM template
  bomVersion?: string
  quantityPlanned: number
  quantityProduced: number
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  startDate: Date
  completedDate?: Date
  
  // Cost breakdown (calculated)
  materialCost: number
  laborCost: number
  overheadCost: number
  totalCost: number
  costPerUnit: number
  
  // Labor tracking
  laborHours: number
  laborRate: number
  
  // Material consumption (stored as array)
  materials: {
    materialId: string
    lotNumber: string
    quantityUsed: number
    unitCost: number
    totalCost: number
  }[]
  
  notes?: string
  createdBy: string
  metadata: any
}

interface BillOfMaterials {
  id: string
  organizationId: string
  productId: string
  version: string // e.g., "v1.0", "v2.1"
  isActive: boolean
  components: {
    materialId: string
    quantity: number
    unit: string
    notes?: string
  }[]
  estimatedLaborHours: number
  notes?: string
  createdBy: string
  createdAt: Date
}

// Suppliers & Purchase Orders
interface Supplier {
  id: string
  organizationId: string
  name: string
  code: string // Auto or manual
  contactPerson?: string
  email?: string
  phone?: string
  address?: {
    street: string
    city: string
    state: string
    zip: string
    country: string
    latitude?: number // For map view
    longitude?: number
  }
  materials: string[] // Material IDs or categories
  status: 'active' | 'inactive'
  notes?: string
  createdAt: Date
}

interface PurchaseOrder {
  id: string
  organizationId: string
  poNumber: string // Auto: PO-20251003-001
  supplierId: string
  status: 'draft' | 'ordered' | 'partial' | 'received' | 'closed' | 'cancelled'
  orderDate: Date
  expectedDeliveryDate?: Date
  actualDeliveryDate?: Date
  
  lineItems: {
    id: string
    materialId: string
    quantityOrdered: number
    quantityReceived: number
    unit: string
    unitPrice: number
    totalPrice: number
  }[]
  
  subtotal: number
  shippingCost: number
  taxAmount: number
  totalAmount: number
  
  notes?: string
  createdBy: string
}

// Reports (aggregated/calculated data)
interface ReportMetrics {
  organizationId: string
  periodStart: Date
  periodEnd: Date
  
  // Cost breakdown
  totalMaterialCost: number
  totalLaborCost: number
  totalOverheadCost: number
  
  // Production
  unitsProduced: number
  avgCostPerUnit: number
  productionRuns: number
  
  // Inventory
  rawMaterialValue: number
  finishedGoodsValue: number
  inventoryTurnover: number
  
  // Calculated on-demand, not stored
}
```

---

## Page-by-Page Implementation Details

### 1. Page Layout Component
**Priority:** 🔴 High (Foundation)  
**File:** `components/page-layout.tsx`

**Purpose:** Consistent page structure for all internal pages

**Features:**
- Page title with optional subtitle
- Primary action button (top-right)
- Content area with proper spacing
- Loading skeleton state
- Empty state support
- Error boundary wrapper

**Component Props:**
```typescript
interface PageLayoutProps {
  title: string
  subtitle?: string
  primaryAction?: {
    label: string
    icon?: LucideIcon
    onClick: () => void
    disabled?: boolean
  }
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: {
    icon: LucideIcon
    title: string
    description: string
    action?: {
      label: string
      onClick: () => void
    }
  }
  children: ReactNode
}
```

**Implementation Notes:**
- Use sticky positioning for header (doesn't scroll)
- Max content width: 1400px, centered
- Consistent padding: px-6 py-8
- Loading skeleton matches content structure

---

### 2. Header Navigation Update
**Priority:** 🔴 High (Foundation)  
**File:** `components/header-nav.tsx`

**Changes:**
- Implement vertical sidebar navigation for desktop
- Collapsible sidebar (expanded by default)
- Icon + label for each nav item
- Active route highlighting
- Organization switcher (dropdown at top)
- User menu (avatar + dropdown at bottom)

**Navigation Structure:**
```
[Org Switcher: Acme Manufacturing ▼]

📊 Dashboard
📦 Inventory
  → Raw Materials (sub-item)
🏭 Production
🏢 Suppliers
📄 Purchase Orders
📈 Reports
⚙️ Settings

[User Menu: John Doe ▼]
```

**Mobile Behavior:**
- Hamburger menu icon (top-left)
- Slide-out drawer from left
- Overlay backdrop
- Same nav structure

**Implementation:**
- Use shadcn `Sheet` component for mobile drawer
- Store sidebar collapsed state in localStorage
- Highlight active route with bg color and border
- Show org switcher only if user has multiple orgs

---

### 3. Inventory Management Page
**Priority:** 🔴 High (Core Feature)  
**Route:** `/inventory`  
**File:** `app/inventory/page.tsx`

**Layout:**
- Tabs: "Raw Materials" | "Finished Goods"
- Each tab has its own data table
- Filters above table: Category, Status, Search
- Summary cards at top: Total Items, Total Value, Low Stock Alerts

**Table Columns:**
- SKU
- Name
- Category
- Quantity (with unit)
- Unit Cost
- Total Value
- Status (badge)
- Actions (View, Edit, Adjust)

**Actions:**
- **Add New Item** - Dialog form for creating item
- **Adjust Quantity** - Opens adjustment dialog
  - Adjustment type dropdown (receive, consume, count, waste, other)
  - Quantity change input
  - Notes field (required)
  - Submit creates inventory transaction
- **Edit Item** - Update metadata (name, category, reorder point)
- **View History** - Shows transaction log for item

**Mock Data Structure:**
```typescript
const mockRawMaterials = [
  {
    id: '1',
    sku: 'RM-001',
    name: 'Organic Sugar',
    category: 'Sweeteners',
    quantity: 450,
    unit: 'kg',
    unitCost: 2.50,
    totalValue: 1125,
    reorderPoint: 100,
    status: 'adequate'
  },
  {
    id: '2',
    sku: 'RM-002',
    name: 'Premium Cocoa Powder',
    category: 'Ingredients',
    quantity: 25,
    unit: 'kg',
    unitCost: 15.00,
    totalValue: 375,
    reorderPoint: 50,
    status: 'low' // Triggers alert badge
  }
]

const mockFinishedGoods = [
  {
    id: 'fg-1',
    sku: 'FG-001',
    name: 'Chocolate Bar - Dark 70%',
    category: 'Finished Products',
    quantity: 1200,
    unit: 'units',
    unitCost: 1.85, // From latest production run
    totalValue: 2220,
    reorderPoint: 0, // Not applicable for finished goods
    status: 'adequate'
  }
]
```

**Empty State:**
- "No inventory items yet"
- "Add your first raw material or finished good to get started"
- Button: "Add Raw Material" or "Add Finished Good"

---

### 4. Raw Materials Tracking Page
**Priority:** 🟡 Medium (Enhanced Feature)  
**Route:** `/raw-materials`  
**File:** `app/raw-materials/page.tsx`

**Purpose:** Detailed view of raw materials with lot tracking

**Layout:**
- Material list/cards (left side or top)
- Selected material detail view (right side or bottom)
- Quick filters: Category, Low Stock, Active Lots

**Material Detail View:**
- **Header:** Name, SKU, Current Stock
- **Lots Tab:**
  - Table of active lots
  - Columns: Lot #, Quantity, Received Date, Cost, Supplier, Actions
  - Action: "Use in Production" (links to create production run)
- **Usage History Tab:**
  - Timeline of consumption
  - Which production runs used this material
  - Quantities and dates
- **Cost Trends Tab:**
  - Line chart showing cost over time
  - Data points from PO receipts
  - Hover shows: Date, Supplier, Cost
- **Suppliers Tab:**
  - List of suppliers who provide this material
  - Last price paid to each
  - Quick action: "Create PO"

**Lot Selection Dialog** (for production):
- Searchable dropdown of available lots
- Shows: Lot #, Quantity Available, Cost, Received Date
- Allow manual lot number entry if not in list
- Selected lot auto-fills quantity and cost

**Mock Data:**
```typescript
const mockMaterialDetail = {
  id: 'rm-1',
  sku: 'RM-001',
  name: 'Organic Sugar',
  currentStock: 450,
  unit: 'kg',
  reorderPoint: 100,
  category: 'Sweeteners',
  
  lots: [
    {
      lotNumber: 'LOT-20250920-001',
      quantity: 250,
      unitCost: 2.45,
      supplierId: 'sup-1',
      supplierName: 'Sweet Suppliers Co',
      receivedDate: new Date('2025-09-20'),
      poId: 'po-123'
    },
    {
      lotNumber: 'LOT-20251001-002',
      quantity: 200,
      unitCost: 2.55,
      supplierId: 'sup-1',
      supplierName: 'Sweet Suppliers Co',
      receivedDate: new Date('2025-10-01'),
      poId: 'po-145'
    }
  ],
  
  usageHistory: [
    {
      date: new Date('2025-09-25'),
      quantity: 50,
      lotNumber: 'LOT-20250920-001',
      productionRunId: 'pr-100',
      productName: 'Chocolate Bar - Dark 70%',
      cost: 122.50
    }
  ],
  
  costTrend: [
    { date: new Date('2025-08-15'), cost: 2.40, supplierId: 'sup-1' },
    { date: new Date('2025-09-20'), cost: 2.45, supplierId: 'sup-1' },
    { date: new Date('2025-10-01'), cost: 2.55, supplierId: 'sup-1' }
  ]
}
```

---

### 5. Production Management Page
**Priority:** 🔴 High (Core Feature)  
**Route:** `/production`  
**File:** `app/production/page.tsx`

**Layout:**
- Tabs: "Active Runs" | "Completed Runs" | "BOMs"

**Active Runs Tab:**
- Table of in-progress runs
- Columns: Run #, Product, Quantity, Started, Status, Actions
- Action: "Complete Run" → Opens completion dialog

**Completed Runs Tab:**
- Table of finished runs
- Columns: Run #, Product, Quantity, Date, Cost/Unit, Actions
- Action: "View Details" → Shows full breakdown
- Filters: Date range, Product, Cost range

**BOMs Tab:**
- List of BOMs (cards or table)
- Columns: Product, Version, Active?, Components, Est. Cost, Actions
- Action: "Create Run from BOM" → Pre-fills production form
- Action: "Edit BOM" / "New Version"

**Start Production Run Form:**
```
Product: [Dropdown or autocomplete]
BOM Template: [Optional - dropdown of BOMs for product]
Quantity Planned: [Number input]
Start Date: [Date picker - defaults to today]

Materials Section:
[+ Add Material button]
For each material:
  - Material: [Dropdown]
  - Lot Number: [Searchable dropdown with manual entry]
  - Quantity: [Number]
  - Unit: [Auto from material]
  - Cost/Unit: [Auto from lot]
  - Total: [Calculated]

Material Subtotal: $XXX.XX

Labor:
  Hours: [Number]
  Rate: [$/hour - from settings or override]
  Labor Cost: [Calculated]

Overhead:
  Rate: [% or $/hour - from settings or override]
  Overhead Cost: [Calculated based on labor hours]

Estimated Total Cost: $XXX.XX
Estimated Cost/Unit: $X.XX

Notes: [Textarea]

[Start Production Run button]
```

**Complete Production Run Dialog:**
```
Run #: PR-20251003-001
Product: Chocolate Bar - Dark 70%
Status: In Progress

Adjust Actual Values:
Quantity Produced: [Number - defaults to quantity planned]
Completed Date: [Date picker - defaults to today]

Materials Used: [Show table, allow edits]
  Material | Lot # | Planned | Actual | Cost
  Sugar    | L-001 | 50kg    | [52kg] | $127.50

Labor Hours: [Number - editable]
Labor Cost: [Calculated]
Overhead Cost: [Calculated]

Actual Total Cost: $XXX.XX
Actual Cost/Unit: $X.XX

Notes: [Textarea]

[Complete Run button]
```

**On Completion:**
- Creates inventory transactions:
  - Deduct consumed materials (by lot)
  - Add produced finished goods
- Calculates final COGS
- Updates inventory quantities
- Changes run status to 'completed'

**Mock Data:**
```typescript
const mockProductionRuns = [
  {
    id: 'pr-100',
    runNumber: 'PR-20251001-100',
    productId: 'fg-1',
    productName: 'Chocolate Bar - Dark 70%',
    quantityPlanned: 1000,
    quantityProduced: 985,
    status: 'completed',
    startDate: new Date('2025-10-01'),
    completedDate: new Date('2025-10-01'),
    
    materials: [
      {
        materialId: 'rm-1',
        materialName: 'Organic Sugar',
        lotNumber: 'LOT-20250920-001',
        quantityUsed: 52,
        unit: 'kg',
        unitCost: 2.45,
        totalCost: 127.40
      },
      {
        materialId: 'rm-2',
        materialName: 'Premium Cocoa Powder',
        lotNumber: 'LOT-20250925-003',
        quantityUsed: 85,
        unit: 'kg',
        unitCost: 15.00,
        totalCost: 1275.00
      }
    ],
    
    laborHours: 12,
    laborRate: 25,
    laborCost: 300,
    
    overheadRate: 0.5, // 50% of labor cost
    overheadCost: 150,
    
    totalCost: 1852.40,
    costPerUnit: 1.88
  }
]

const mockBOMs = [
  {
    id: 'bom-1',
    productId: 'fg-1',
    productName: 'Chocolate Bar - Dark 70%',
    version: 'v1.0',
    isActive: true,
    components: [
      {
        materialId: 'rm-1',
        materialName: 'Organic Sugar',
        quantity: 50,
        unit: 'kg'
      },
      {
        materialId: 'rm-2',
        materialName: 'Premium Cocoa Powder',
        quantity: 85,
        unit: 'kg'
      }
    ],
    estimatedLaborHours: 12,
    notes: 'Standard recipe for 1000 bars'
  }
]
```

---

### 6. Purchase Orders Page
**Priority:** 🟡 Medium  
**Route:** `/purchase-orders`  
**File:** `app/purchase-orders/page.tsx`

**Purpose:** Record material purchases and receive inventory

**Layout:**
- PO list table
- Columns: PO #, Supplier, Date, Status, Total, Actions
- Filters: Status, Supplier, Date Range
- Summary cards: Total POs, Total Value, Pending Receives

**Create PO Form:**
```
Supplier: [Dropdown - links to supplier]
Order Date: [Date picker - defaults to today]
Expected Delivery: [Date picker]

Line Items:
[+ Add Line Item button]
For each line:
  - Material: [Dropdown of raw materials]
  - Quantity: [Number]
  - Unit: [Auto from material]
  - Unit Price: [Number input]
  - Total: [Calculated]

Subtotal: [Calculated]
Shipping Cost: [Number input - optional]
Tax: [Number input - optional]
Total Amount: [Calculated]

Payment Terms: [Text input - e.g. "Net 30"]
Notes: [Textarea]

[Save as Draft] [Create PO]
```

**Receive Items Dialog:**
```
PO #: PO-20251003-001
Supplier: Sweet Suppliers Co
Status: Ordered

Receive Items:
Material | Ordered | Received | Receive Now | Lot # | Cost
Sugar    | 500kg   | 0kg      | [500kg]     | [Auto or Manual] | $2.55/kg

Received Date: [Date picker - defaults to today]
Notes: [Textarea]

[Receive Items button]
```

**On Receive:**
- Creates `RawMaterialLot` records
- Creates inventory transactions (purchase_receive)
- Updates PO line item received quantities
- Updates PO status (partial or received)
- Updates material current stock

**Status Flow:**
- Draft → Ordered (manual status change)
- Ordered → Partial (some items received)
- Partial → Received (all items received)
- Received → Closed (manually marked done)

**Mock Data:**
```typescript
const mockPurchaseOrders = [
  {
    id: 'po-1',
    poNumber: 'PO-20251001-001',
    supplierId: 'sup-1',
    supplierName: 'Sweet Suppliers Co',
    status: 'ordered',
    orderDate: new Date('2025-10-01'),
    expectedDeliveryDate: new Date('2025-10-08'),
    
    lineItems: [
      {
        id: 'li-1',
        materialId: 'rm-1',
        materialName: 'Organic Sugar',
        quantityOrdered: 500,
        quantityReceived: 0,
        unit: 'kg',
        unitPrice: 2.55,
        totalPrice: 1275.00
      }
    ],
    
    subtotal: 1275.00,
    shippingCost: 50.00,
    taxAmount: 0,
    totalAmount: 1325.00,
    
    paymentTerms: 'Net 30',
    notes: '',
    createdBy: 'user-1'
  }
]
```

---

### 7. Suppliers Management Page
**Priority:** 🟢 Low  
**Route:** `/suppliers`  
**File:** `app/suppliers/page.tsx`

**Layout:**
- Supplier cards or table view toggle
- Filters: Status, Materials Supplied, Location
- Search by name or code
- Map view toggle (shows supplier locations on map)

**Supplier Card:**
```
┌──────────────────────────────────┐
│ Sweet Suppliers Co        [Edit] │
│ Code: SUP-001                    │
│                                  │
│ 📧 contact@sweetsuppliers.com   │
│ 📞 (555) 123-4567               │
│ 📍 Portland, OR                 │
│                                  │
│ Materials: Sweeteners, Flavors   │
│                                  │
│ [View POs] [Create PO]          │
└──────────────────────────────────┘
```

**Supplier Detail View:**
- Contact information
- Address (with mini map if lat/long available)
- Materials they supply
- Recent purchase orders table
- Historical pricing chart (if multiple POs exist)
- Notes section

**Add/Edit Supplier Form:**
```
Name: [Text input] *required
Code: [Text input - auto-generated or manual]
Contact Person: [Text input]
Email: [Text input with validation]
Phone: [Text input]

Address:
  Street: [Text input]
  City: [Text input]
  State: [Text input]
  Zip: [Text input]
  Country: [Text input]

Materials Supplied: [Multi-select or tags]
Status: [Active / Inactive radio]
Notes: [Textarea]

[Save Supplier]
```

**Mock Data:**
```typescript
const mockSuppliers = [
  {
    id: 'sup-1',
    name: 'Sweet Suppliers Co',
    code: 'SUP-001',
    contactPerson: 'Jane Smith',
    email: 'jane@sweetsuppliers.com',
    phone: '(555) 123-4567',
    address: {
      street: '123 Industrial Way',
      city: 'Portland',
      state: 'OR',
      zip: '97201',
      country: 'USA',
      latitude: 45.5152,
      longitude: -122.6784
    },
    materials: ['Sweeteners', 'Flavors'],
    status: 'active',
    notes: 'Primary sugar supplier. Net 30 terms.',
    createdAt: new Date('2024-01-15')
  }
]
```

---

### 8. Analytics/Reports Page
**Priority:** 🟡 Medium  
**Route:** `/reports`  
**File:** `app/reports/page.tsx`

**Layout:**
- Dashboard-style grid of chart cards
- Global date range selector (top-right)
- "Customize Dashboard" button (allows showing/hiding charts)
- "Export Data" button (downloads CSV)

**Default Charts:**

1. **Cost Breakdown (Donut Chart)**
   - Materials, Labor, Overhead percentages
   - Shows total cost in center
   - Click slice to drill down

2. **Production Cost Trend (Line Chart)**
   - X-axis: Time (weekly, monthly, quarterly)
   - Y-axis: Average cost per unit
   - Multiple lines for different products
   - Hover shows: Date, Product, Cost, Volume

3. **Top Cost Materials (Bar Chart)**
   - Horizontal bars
   - Material name | Cost bar | Percentage
   - Top 10 materials by total cost

4. **Inventory Value (Metric Cards)**
   - Raw Materials: $XX,XXX
   - Finished Goods: $XX,XXX
   - Total Inventory: $XX,XXX
   - Turnover Rate: X.X times/year

5. **Production Volume (Bar Chart)**
   - Products produced over time
   - Grouped by product type
   - Toggle: Units or Dollar Value

6. **COGS Summary (Table)**
   - Product | Units | Material $ | Labor $ | Overhead $ | Total COGS | Cost/Unit
   - Sortable columns
   - Export to CSV

**Date Range Options:**
- Last 7 days
- Last 30 days
- Last 90 days
- Last 12 months
- This Year
- Last Year
- Custom Range

**Dashboard Customization:**
- Modal with checkboxes for each chart
- Drag-and-drop to reorder (future)
- Save preference per user (future)

**CSV Export Format:**
```csv
Report: Production Summary
Organization: Acme Manufacturing
Date Range: 2025-01-01 to 2025-10-03
Generated: 2025-10-03 10:30 AM

Product,Units Produced,Material Cost,Labor Cost,Overhead Cost,Total Cost,Cost Per Unit
Chocolate Bar - Dark 70%,5000,8500.00,1500.00,750.00,10750.00,2.15
...
```

**Mock Data:**
```typescript
const mockReportData = {
  dateRange: {
    start: new Date('2025-09-01'),
    end: new Date('2025-10-03')
  },
  
  costBreakdown: {
    materials: 15750.00, // 70%
    labor: 4500.00,      // 20%
    overhead: 2250.00    // 10%
  },
  
  productionCostTrend: [
    { date: new Date('2025-09-01'), product: 'Chocolate Bar', avgCostPerUnit: 2.10, volume: 1000 },
    { date: new Date('2025-09-08'), product: 'Chocolate Bar', avgCostPerUnit: 2.15, volume: 1200 },
    { date: new Date('2025-09-15'), product: 'Chocolate Bar', avgCostPerUnit: 2.12, volume: 1100 }
  ],
  
  topCostMaterials: [
    { name: 'Premium Cocoa Powder', totalCost: 6500.00, percentOfTotal: 41.3 },
    { name: 'Organic Sugar', totalCost: 3200.00, percentOfTotal: 20.3 },
    { name: 'Vanilla Extract', totalCost: 1800.00, percentOfTotal: 11.4 }
  ],
  
  inventoryValue: {
    rawMaterials: 12500.00,
    finishedGoods: 8750.00,
    total: 21250.00,
    turnoverRate: 4.2
  }
}
```

---

### 9. Settings Page
**Priority:** 🟢 Low  
**Route:** `/settings`  
**File:** `app/settings/page.tsx`

**Layout:**
- Tabbed interface: Organization | Users | Preferences

**Organization Tab:**
```
Organization Profile:
  Name: [Text input]
  Logo: [File upload - image]

Address:
  Street: [Text input]
  City: [Text input]
  State: [Text input]
  Zip: [Text input]
  Country: [Text input]

Settings:
  Currency: [Dropdown: USD, EUR, GBP, etc.]
  Default Unit: [Dropdown: kg, lbs, units, etc.]
  Costing Method: [Display only: "Actual"] (Not editable)
  Overhead Rate: [Number input] [Dropdown: % of Labor / $ per Hour]
  Fiscal Year End: [Month picker]
  Timezone: [Dropdown]

[Save Changes]
```

**Users Tab:**
```
Users Table:
Name | Email | Role | Status | Last Login | Actions

Roles:
- Admin: Full access
- Manager: All except user management and org settings
- Operator: Can't delete, limited financial visibility

[Invite User button]

Invite User Dialog:
  Email: [Text input]
  Role: [Dropdown: Admin / Manager / Operator]
  [Send Invitation]
```

**Preferences Tab:**
```
Display:
  Date Format: [Dropdown: MM/DD/YYYY, DD/MM/YYYY, YYYY-MM-DD]
  Number Format: [Dropdown: 1,234.56 / 1.234,56]

Notifications:
  [ ] Email notifications for low stock
  [ ] Email notifications for completed production runs
  [ ] Weekly summary email

Data:
  [Export All Data] - Downloads full organization data as JSON/CSV
  [Delete Organization] - Requires confirmation, soft delete with 30-day recovery

[Save Preferences]
```

**Organization Switcher** (in header):
- Dropdown showing all orgs user belongs to
- Current org has checkmark
- Click to switch context
- Refreshes page with new org data

---

## Development Workflow

### Phase 1: Foundation (Week 1)
1. ✅ Header Navigation with user display (Done)
2. Create Page Layout Component
3. Update Header with vertical sidebar nav
4. Set up base routing structure
5. Create mock data utilities
6. Set up Supabase schema (basic tables)

### Phase 2: Core Inventory & Production (Week 2-3)
1. Inventory Management Page (tabbed view)
2. Raw Materials Tracking Page
3. Production Management Page
4. Test end-to-end flow: Create material → Create PO → Receive → Produce

### Phase 3: Supporting Features (Week 4)
1. Purchase Orders Page
2. Suppliers Management Page
3. Test purchasing workflow

### Phase 4: Analytics & Settings (Week 5)
1. Reports/Analytics Page
2. Settings Page
3. Polish and bug fixes

### Phase 5: Testing & Refinement (Week 6)
1. User acceptance testing
2. Performance optimization
3. Accessibility audit
4. Documentation
5. Prepare for backend integration

---

## Critical Dependencies & Blockers

### Must Answer Before Starting Development:
1. **Lot number format** - Auto-generated or user-entered? Format pattern?
2. **Labor cost entry** - Flat rate per run or hourly with hours input?
3. **Overhead calculation** - Percentage of labor or dollar per hour?
4. **Multi-stage production** - Separate runs or stages within one run?

### Can Defer:
- Unit conversion specifics (start with manual entry)
- Detailed supplier metrics
- Advanced dashboard customization
- Integration preparation

---

## Success Metrics

### MVP Launch Criteria:
- ✅ All 9 pages implemented and functional
- ✅ Mock data demonstrates complete workflows
- ✅ Responsive design works on mobile, tablet, desktop
- ✅ Authentication and multi-tenancy working
- ✅ Can complete full workflow: Setup → Purchase → Produce → Report
- ✅ Performance: Pages load in <2 seconds
- ✅ Zero console errors
- ✅ Passes accessibility audit (WCAG AA)

### Post-MVP Goals:
- Real Supabase integration
- Production deployment
- 10 pilot users onboarded
- 90% feature satisfaction score
- <5 critical bugs per week

---

## Next Actions

1. **Review clarifying-questions.md** - Answer priority questions
2. **Approve this plan** - Confirm approach and priorities
3. **Begin Phase 1** - Start with Page Layout Component
4. **Daily standups** - Quick sync on progress and blockers
5. **Weekly demos** - Show working features for feedback

---

*Last updated: October 3, 2025*  
*Author: Development Team*
