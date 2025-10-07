# Page Scaffolding Plan - Pulse COGS Platform

**Date:** October 2, 2025  
**Status:** Planning  
**Phase:** Initial Scaffolding

## Overview

This document outlines the plan to scaffold the core pages of the Pulse COGS manufacturing cost management platform. The goal is to create working page templates with mock data that demonstrate functionality before implementing full backend integration.

## Guiding Principles

- **Start Simple:** Build basic, working interfaces first
- **Mock Data First:** Use realistic sample data to validate UX before API integration
- **Consistent Patterns:** Establish reusable components and layouts
- **Authentication Required:** All feature pages require logged-in users
- **Mobile-First:** Responsive design for shop floor and office use

---

## 1. Inventory Management Page

**Route:** `/inventory`  
**File:** `app/inventory/page.tsx`

### Purpose

Provide a high-level overview of all inventory items - both raw materials and finished goods - with filtering and basic CRUD operations.

### Key Features

- Data table with sortable columns (SKU, name, type, quantity, value)
- Filters: Item type (raw/finished), low stock alerts, category
- Search functionality
- Add New Item button → opens dialog/form
- Row actions: View details, Edit, Delete
- Stock level indicators (adequate, low, critical)
- Total inventory value summary card

### Mock Data Structure

```typescript
interface InventoryItem {
  id: string
  sku: string
  name: string
  type: 'raw_material' | 'finished_good'
  category: string
  quantity: number
  unit: string
  unitCost: number
  totalValue: number
  reorderPoint: number
  supplier?: string
  lastUpdated: Date
}
```

### Questions & Implications

**Business Logic Questions:**

- Should we show mixed raw materials and finished goods in one table, or separate tabs?
  - *Implication:* Affects filtering complexity and user mental model
  - I think we should separate them into tabs for clarity and user experience. The production tab will focus on creating finished goods from raw materials via a bill of materials to assign production usage and goods tracking. The raw materials page will be mostly for viewing stock levels and managing items that are inputs for production.
- What units of measure do we support (kg, lbs, units, liters)?
  - *Implication:* Needs unit conversion logic or standardization
  - The system should support common manufacturing units like kg, lbs, liters, and pieces. We may need a unit conversion utility to handle different supplier units versus internal usage. For example, a supplier may sell sugar in lbs but we use grams when creating production runs.
- How do we handle multi-location inventory tracking?
  - *Implication:* May need location column and filtering
  - There will be no multi-location tracking, that is completely out of scope.
- Should quantity be editable directly in table or require adjustment transactions?
  - *Implication:* Affects audit trail and data integrity
  - quantity should only be editable via adjustment transactions to maintain a proper audit trail and maintain cost records for calculating COGS.

**Technical Questions:**

- What's the expected scale? (100 items vs 10,000 items)
  - *Implication:* May need pagination, virtual scrolling, or different data fetching strategy
  - The program is currently aimed at small-to-medium manufacturers, so we expect inventory items to be in the range of 100-1,000 initially. Keep scalability in mind, but do not over-engineer for massive scale.
- Should we use optimistic updates when editing quantities?
  - *Implication:* Affects user experience but adds complexity
  - Optimistic updates are completely out of scope for now.
- How do we handle concurrent edits by multiple users?
  - *Implication:* Need conflict resolution strategy
  - The system will check for the latest data version before allowing edits, prompting users to refresh if conflicts arise.

**UX Questions:**

- Do users need bulk import/export functionality immediately?
  - *Implication:* CSV upload feature may be critical for adoption
  - Bulk import/export is out of scope for the initial version.
- Should we show historical quantity changes on this page?
  - *Implication:* May need expandable rows or separate history view
  - Yes, showing historical changes can help users understand inventory trends and make informed decisions.
- What's the most common user workflow - adding items or viewing current stock?
  - *Implication:* Affects primary action placement and default view
  - The user workflow will primarily focus on inputting data for analysis. Most of the production tracking is likely going to be done after the production has already completed, so focus on easy data entry and review. Make sure that the CRUD actions are intuitive and accessible.

---

## 2. Raw Materials Tracking Page

**Route:** `/raw-materials`  
**File:** `app/raw-materials/page.tsx`

### Purpose

Detailed tracking of raw materials with lot/batch management, supplier relationships, and usage analytics specifically for manufacturing inputs.

### Key Features

- Detailed material cards/table with expanded information
- Lot/batch tracking with expiration dates (for perishables)
- Supplier information and alternate suppliers
- Reorder point alerts and recommendations
- Material usage history (which production runs consumed it)
- Cost trends chart showing price changes over time
- Quick actions: Record receipt, Adjust quantity, Create PO

### Mock Data Structure

```typescript
interface RawMaterial {
  id: string
  sku: string
  name: string
  category: string
  currentStock: number
  unit: string
  reorderPoint: number
  reorderQuantity: number
  primarySupplier: {
    id: string
    name: string
    leadTime: number // days
    lastPrice: number
  }
  alternateSuppliers: Supplier[]
  lots: {
    lotNumber: string
    quantity: number
    receivedDate: Date
    expirationDate?: Date
    cost: number
  }[]
  usageHistory: {
    date: Date
    quantity: number
    productionRunId: string
    cost: number
  }[]
  priceHistory: {
    date: Date
    price: number
    supplierId: string
  }[]
}
```

### Questions & Implications

**Business Logic Questions:**

- Do we enforce FIFO (First In First Out) consumption of lots?
  - *Implication:* Requires automatic lot selection logic in production
  - No, allow the user to input whatever lot they want to consume. Most of the data is likely going to be input after-the-fact, so strict FIFO enforcement is not necessary. Prioritize allowing the user to accurately reflect what actually happened on the production floor.
- How do we handle partial lot consumption and remnants?
  - *Implication:* Affects inventory accuracy and waste tracking
  - Track the remaining quantity in each lot after consumption to maintain accurate inventory levels. Include a history of lot consumption for audit purposes. Allow users to designate waste from lots.
- Should reorder points be calculated automatically based on usage patterns?
  - *Implication:* Needs consumption analytics and forecasting logic
  - No, this is out of scope for now.
- Do materials have shelf life/expiration that affects valuation?
  - *Implication:* May need expiration alerts and write-off processes
  - No, this is out of scope for now.

**Compliance & Traceability:**

- Are lot numbers required for regulatory compliance?
  - *Implication:* Makes lot tracking mandatory, not optional
  - Implement lot numbers for all raw materials to ensure traceability and compliance with industry standards.
- How long must we retain lot traceability records?
  - *Implication:* Affects data retention and archival strategy
  - Out of scope for now.
- Do we need to track material origin (country, farm, facility)?
  - *Implication:* Extended supplier data and compliance reporting
  - No, this is out of scope for now.

**Technical Questions:**

- How do we handle materials received in different units than used?
  - *Implication:* Need unit conversion system (received in pallets, used in kg)
    - The system should support common manufacturing units like kg, lbs, liters, and pieces. We may need a unit conversion utility to handle different supplier units versus internal usage. For example, a supplier may sell sugar in lbs but we use grams when creating production runs.
- Should we support composite materials (premixed/pre-processed)?
  - *Implication:* Materials that are themselves products of production runs
  - Out of scope, the user should be able to define multiple different BOMs that have different raw materials for usage.
- How do we link lot numbers across the supply chain?
  - The system will assign an internal lot number for each receipt of raw materials and track the linkage and usage of raw materials throughout the production process. Tracking outside of our system is out of scope.

**UX Questions:**

- Should lot selection be manual or automatic during production?
  - *Implication:* Balance between control and automation
  - Lot selection should be a searchable dropdown to allow users to pick a lot or input their own lot number if needed.
- Do users need mobile access for receiving materials on warehouse floor?
  - *Implication:* Mobile-optimized receiving workflow needed
  - The program should be generally mobile responsive with a modern design, but a dedicated mobile functionality is out of scope.
- How prominently should we display low stock alerts?
  - *Implication:* May need dashboard widget or notification system
  - Display low stock alerts on the inventory dashboard and within the raw materials page itself, using color-coded indicators to draw attention to critical items.

---

## 3. Production Management Page

**Route:** `/production`  
**File:** `app/production/page.tsx`

### Purpose

Track production runs, manage Bills of Materials (BOMs), calculate production costs, and monitor manufacturing efficiency.

### Key Features

- Tabs: Active Runs | Completed Runs | BOMs
- Active runs list with progress indicators
- BOM viewer with nested components and cost rollup
- Start New Production Run form
- Cost calculation breakdown (materials + labor + overhead)
- Actual vs. Estimated cost comparison
- Material consumption tracking
- Production efficiency metrics (cycle time, yield %)
- Production run details view with edit capability

### Mock Data Structure

```typescript
interface ProductionRun {
  id: string
  runNumber: string
  productId: string
  productName: string
  quantityPlanned: number
  quantityProduced: number
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled'
  startDate: Date
  completedDate?: Date
  bomId: string
  estimatedCost: number
  actualCost: number
  materialCosts: MaterialConsumption[]
  laborHours: number
  laborCost: number
  overheadCost: number
  notes: string
}

interface BillOfMaterials {
  id: string
  productId: string
  productName: string
  version: string
  isActive: boolean
  components: {
    materialId: string
    materialName: string
    quantity: number
    unit: string
    costPerUnit: number
    totalCost: number
  }[]
  totalMaterialCost: number
  estimatedLaborHours: number
  estimatedLaborCost: number
  overheadRate: number
  totalEstimatedCost: number
}
```

### Questions & Implications

**Business Logic Questions:**

- How do we handle BOM versioning when recipes change?
  - *Implication:* Need to track which BOM version was used for each run
  - Each production batch and item will have a raw materials usage history tied to it. The BOM just defines the standard recipe, but the actual history of what was used is what matters for cost tracking. The BOM will have versioning to allow users to update recipes over time, but historical runs will always reference the actual raw materials used.
- What happens when actual material usage differs from BOM?
  - *Implication:* Variance reporting and investigation workflow
  - The goal of the system is not to enforce regulatory compliance, so all fields should be editable after-the-fact to reflect what actually happened on the production floor. Implement a variance report to allow the user to note errors or discrepancies, but do not enforce strict adherence to the BOM.
- Should we support multi-level BOMs (sub-assemblies)?
  - *Implication:* Complex cost rollup and nested material tracking
  - Out of scope for now. We will allow users to have multi-stage production runs, e.g. production and packaging but not nested BOMs.
- How do we calculate overhead allocation (per unit, per run, per time)?
  - *Implication:* Affects cost accuracy and requires configuration
  - Overhead will be a configurable rate applied per production run based on estimated labor hours. This simplifies calculations while still providing a reasonable allocation method.

**Production Planning:**

- Do we need production scheduling and capacity planning?
  - *Implication:* Much more complex feature set
    - Out of scope for now.
- Should we support batch production with multiple recipes?
  - *Implication:* Co-product and by-product tracking
  - Out of scope for now.
- How do we handle scrap, waste, and rework?
  - *Implication:* Separate cost categories and yield calculations
  - Out of scope for now. Implement a rework feature that allows users to manually allocate more raw materials and labor to a production run if needed.
- Can production runs be paused and resumed?
  - *Implication:* State management and partial costing
    - Out of scope for now. Only track planned, in-progress, and completed states. Labor and time recording will be manually input.

**Cost Accounting:**

- What costing method do we use (Standard, Actual, Average)?
  - *Implication:* Fundamental impact on cost calculations
  - Start with Actual costing to reflect real usage and costs. Standard costing can be considered for future versions, but is out of scope for now.
- How do we handle work-in-progress (WIP) inventory?
  - *Implication:* Need to track partially completed production
  - Track the raw materials that are tied up in a WIP production run as "committed" inventory until the run is completed or cancelled, to avoid using materials that are already allocated to production.
- Should labor costs be tracked per operation or per run?
  - *Implication:* Granularity of time tracking required
    - Labor costs will be tracked per production run to simplify data entry and focus on overall production efficiency rather than micro-managing individual operations.
- How do we allocate shared resources across multiple runs?
  - *Implication:* Complex overhead allocation logic
  - The program will not track shared resources in detail. Overhead will be a flat rate applied per run based on estimated labor hours.

**Technical Questions:**

- How do we ensure atomic material consumption (all or nothing)?
  - *Implication:* Transaction management and rollback capability
  - Implement transaction management to ensure that material consumption is only recorded if the entire production run is successfully started or completed. If any part fails, roll back all changes to maintain data integrity, if material is consumed but the run fails, the user should be able to manually adjust raw materials or inventory as waste.
- Should production runs automatically create inventory transactions?
  - *Implication:* Tight coupling between production and inventory modules
  Yes, starting a production run should reserve the necessary raw materials in inventory, and completing the run should deduct the consumed materials and add the finished goods to inventory. The complete run dialog will show the user what materials will be consumed and allow them to adjust if needed.
- How do we handle real-time cost updates during a run?
  - *Implication:* WebSocket or polling for live updates
  - Real-time updates are out of scope for now. Cost calculations will be done at the start and completion of the run, with manual adjustments allowed if needed.

**UX Questions:**

- Should operators be able to start/stop runs from mobile devices?
  - *Implication:* Shop floor usability considerations.
    - The program should be generally mobile responsive with a modern design, but a dedicated mobile functionality is out of scope.
- Do we need barcode/QR scanning for material consumption?
  - *Implication:* Integration with scanning hardware
    - Out of scope for now.
- How detailed should progress tracking be (percentage, stages, operations)?
  - *Implication:* Affects data entry burden on operators
    - Track progress at a high level (planned, in-progress, completed) to minimize data entry burden. Detailed operation tracking is out of scope for now.

---

## 4. Suppliers Management Page

**Route:** `/suppliers`  
**File:** `app/suppliers/page.tsx`

### Purpose

Maintain supplier directory, track relationships, monitor performance, and view purchase history.

### Key Features

- Supplier cards or list view with contact details
- Search and filter by location, material type, rating
- Supplier performance metrics (on-time delivery, quality score)
- Purchase order history per supplier
- Add/Edit supplier information
- Active vs. Inactive suppliers toggle
- Quick action: Create Purchase Order

### Mock Data Structure

```typescript
interface Supplier {
  id: string
  name: string
  code: string
  contactPerson: string
  email: string
  phone: string
  address: {
    street: string
    city: string
    state: string
    zip: string
    country: string
  }
  materials: string[] // categories they supply
  status: 'active' | 'inactive' | 'pending'
  rating: number // 1-5
  metrics: {
    totalOrders: number
    onTimeDeliveryRate: number
    qualityScore: number
    averageLeadTime: number
  }
  paymentTerms: string
  notes: string
  createdDate: Date
  lastOrderDate?: Date
}
```

### Questions & Implications

**Supplier Relationships:**

- Should we support tiered suppliers (preferred, approved, occasional)?
  - *Implication:* Affects procurement workflows and approval processes
  - Out of scope for now.
- Do we need multi-contact support (sales, logistics, quality)?
  - *Implication:* More complex contact management
  - Out of scope.
- How do we handle supplier certifications (ISO, organic, etc.)?
  - *Implication:* Document management and compliance tracking
    - Out of scope for now.
- Should we track supplier insurance and financial health?
  - *Implication:* Risk management features
    - Out of scope for now.

**Performance Tracking:**

- How do we calculate quality scores?
  - *Implication:* Need rejection/return data from receiving
  - Out of scope for now.
- Should we track price competitiveness across suppliers?
  - *Implication:* Comparative pricing analysis tools
  - The system should allow users to view historical pricing from different suppliers for the same material to help with cost analysis and supplier selection.
- Do we need to track claims and disputes?
  - *Implication:* Dispute resolution workflow and documentation
  - Out of scope.
- How often should performance metrics be recalculated?
  - *Implication:* Background job scheduling and data freshness
  - Performance metrics for suppliers are out of scope for now.

**Procurement Integration:**

- Should suppliers have portal access to view POs?
  - *Implication:* Authentication, authorization, and external user management
    - Out of scope for now.
- Do we need automated RFQ (Request for Quote) workflows?
  - *Implication:* Bidding system and comparison tools
    - Out of scope for now.
- Should we support EDI or API integration with suppliers?
  - *Implication:* Technical integration complexity
    - Out of scope for now.
- How do we handle contract pricing vs. spot pricing?
  - *Implication:* Pricing tier management
    - Out of scope for now.

**Technical Questions:**

- Do we need to store supplier documents (W9, insurance, contracts)?
  - *Implication:* File storage and document management
    - Out of scope for now.
- Should supplier data sync with accounting systems?
  - *Implication:* Integration with QuickBooks, Xero, etc.
    - Out of scope for now.
- How do we handle duplicate supplier entries?
  - *Implication:* Deduplication and merge functionality
    - Implement basic duplicate detection during supplier creation based on name and contact details, with a manual review process for merging duplicates.

**UX Questions:**

- Should we show a map view of supplier locations?
  - *Implication:* Mapping integration (Google Maps, Mapbox)
  - Implement a small map view showing supplier locations to help users visualize geographic distribution.
- How important is mobile access to supplier information?
  - *Implication:* Mobile-optimized contact cards
    - The program should be generally mobile responsive with a modern design, but a dedicated mobile functionality is out of scope.
- Do users need to export supplier lists?
  - *Implication:* CSV/PDF export functionality
  - Yes, allow the user to download the supplier list as a CSV for offline analysis and sharing.

---

## 5. Purchase Orders Page

**Route:** `/purchase-orders`  
**File:** `app/purchase-orders/page.tsx`

### Purpose

Add raw material entries to inventory via purchase orders, which will track costs and supplier relationships. The PO system will also handle receiving and updating inventory levels. This program is more for cost and inventory tracking, so the PO system will be fairly simple and not include complex procurement workflows or financial integrations. Users will be able to input raw materials, quantities, costs, and suppliers to create POs, and then mark items as received to update inventory and costs.

### Key Features

- PO list table with status badges (draft, sent, partial, received, closed)
- Filters: Status, Supplier, Date range, Material
- Create New PO workflow with line items
- PO detail view with receiving status
- Receive items functionality (partial or full receipt)
- Link to related supplier page
- Expected delivery dates and tracking
- Cost comparison (PO cost vs. actual received cost)

### Mock Data Structure

```typescript
interface PurchaseOrder {
  id: string
  poNumber: string
  supplierId: string
  supplierName: string
  status: 'draft' | 'sent' | 'confirmed' | 'partial' | 'received' | 'closed' | 'cancelled'
  orderDate: Date
  expectedDeliveryDate: Date
  actualDeliveryDate?: Date
  lineItems: {
    id: string
    materialId: string
    materialName: string
    quantityOrdered: number
    quantityReceived: number
    unit: string
    unitPrice: number
    totalPrice: number
    receivedLots?: {
      lotNumber: string
      quantity: number
      receivedDate: Date
    }[]
  }[]
  subtotal: number
  taxAmount: number
  shippingCost: number
  totalAmount: number
  paymentTerms: string
  notes: string
  createdBy: string
  approvedBy?: string
}
```

### Questions & Implications

**Procurement Workflow:**

- Do POs require approval before sending to supplier?
  - *Implication:* Approval workflow with roles and limits
  - Supplier communication is out of scope.
- Can users edit POs after they're sent?
  - *Implication:* Change order management and supplier notification
  - Out of scope.
- How do we handle partial deliveries?
  - *Implication:* Multiple receiving transactions per line item
    - Allow users to receive items in multiple transactions, updating the quantity received and tracking lot numbers as needed.
- Should we support blanket POs or recurring orders?
  - *Implication:* Schedule-based ordering and release management
  - Out of scope for now.

**Receiving Process:**

- Should receiving create inventory transactions automatically?
  - *Implication:* Tight integration between PO and inventory modules
  - Out of scope.
- How do we handle over/under deliveries?
  - *Implication:* Tolerance settings and exception handling
    - Allow users to manually adjust quantities during receiving to account for over/under deliveries, with notes for audit purposes.
- Do we need quality inspection before accepting receipt?
  - *Implication:* QA workflow and rejection process
    - Out of scope for now.
- Should we support drop shipping (received directly to customer)?
  - *Implication:* Different inventory flow
    - Out of scope.

**Cost Management:**

- How do we handle price changes between PO and invoice?
  - *Implication:* Three-way matching (PO, receipt, invoice)
  - User will manually adjust costs if there are discrepancies between the PO and actual invoice. Three-way matching is out of scope for now.
- Should we track landed costs (freight, duties, handling)?
  - *Implication:* Additional cost allocation to materials
  - Allow users to input shipping costs on the PO, but detailed landed cost allocation is out of scope for now.
- Do we need to handle foreign currency POs?
  - *Implication:* Currency conversion and exchange rate tracking
    - Out of scope for now, user must convert to their base currency before inputting costs.
- How do we handle discounts and rebates?
  - *Implication:* Net cost calculations and accruals
  - Out of scope for now.

**Technical Questions:**

- Should POs generate PDF documents for emailing?
  - *Implication:* PDF generation library and email integration
  - Supplier communication is out of scope.
- Do we need PO number auto-generation and sequences?
  - *Implication:* Database sequences or custom numbering logic
    - Yes, implement auto-generation of PO numbers using a sequential format (e.g., PO-0001, PO-0002).
- How do we prevent duplicate POs for the same materials?
  - *Implication:* Smart suggestions and duplicate detection
    - Implement basic duplicate detection during PO creation based on supplier and material combinations, with a manual review process for confirmation.
- Should we integrate with supplier systems for auto-confirmation?
  - *Implication:* API integration and status synchronization
  - Out of scope for now.

**UX Questions:**

- Should creating POs be wizard-based or single form?
  - *Implication:* Affects user experience and form complexity
  - Single form with inline line item addition for simplicity and speed.
- Do we need templates for common orders?
  - *Implication:* Template management and quick-order features
  - Out of scope for now.
- How do we handle PO cancellations and returns?
  - *Implication:* Status management and inventory adjustments
  - PO tracking beyond the minimum viable product for cost tracking is out of scope for now.
- Should users see suggested reorder quantities based on usage?
  - *Implication:* Demand forecasting and smart recommendations
  - Yes, but implement this late in the development cycle after core functionality is stable.
- How do we make receiving items fast for warehouse staff?
  - *Implication:* Mobile-optimized receiving with barcode scanning
  - The program should be generally mobile responsive with a modern design, but a dedicated mobile functionality is out of scope for now.

---

## 6. Analytics/Reports Page

**Route:** `/reports`  
**File:** `app/reports/page.tsx`

### Purpose

Provide visual analytics, cost insights, and performance metrics to help manufacturers optimize operations and reduce COGS.

### Key Features

- Dashboard-style layout with multiple chart cards
- Date range selector for all reports
- Cost analysis charts (material costs, labor, overhead breakdown)
- Inventory trends (stock levels over time, turnover rate)
- Production efficiency metrics (cost per unit, cycle time)
- Supplier performance comparisons
- Profit margin analysis by product
- Export reports to PDF/CSV

### Mock Data & Charts

```typescript
interface ReportData {
  // Cost Breakdown (Pie/Donut Chart)
  costBreakdown: {
    materials: number
    labor: number
    overhead: number
    shipping: number
  }
  
  // Production Cost Trend (Line Chart)
  costTrend: {
    date: Date
    avgCostPerUnit: number
    volume: number
  }[]
  
  // Inventory Turnover (Bar Chart)
  inventoryTurnover: {
    category: string
    turnoverRate: number
    daysOnHand: number
  }[]
  
  // Top Cost Materials (Bar Chart)
  topCostMaterials: {
    materialName: string
    totalCost: number
    percentOfTotal: number
  }[]
  
  // Production Efficiency (Gauge/Metric Cards)
  efficiency: {
    actualVsBudget: number // percentage
    scrapRate: number
    onTimeDelivery: number
    cycleTime: number // hours
  }
  
  // Supplier Performance (Scatter Plot)
  supplierPerformance: {
    supplierName: string
    onTimeRate: number
    qualityScore: number
    costCompetitiveness: number
  }[]
}
```

### Questions & Implications

**Reporting Scope:**

- What time periods should be available (daily, weekly, monthly, quarterly)?
  - *Implication:* Data aggregation strategies and performance
  - weekly, monthly, quarterly, yearly, 2y, 3y, 5y
- Should reports be real-time or cached/scheduled?
  - *Implication:* Balance between freshness and performance
    - Cached/scheduled for performance, with the option to refresh on-demand.
- Do we need to compare multiple time periods (YoY, MoM)?
  - *Implication:* Comparative analytics and trend analysis
  - Yes, but implement this late in the development cycle after core functionality is stable.
- Should users be able to create custom reports?
  - *Implication:* Report builder interface and complexity
    - Out of scope for now.

**Key Metrics:**

- Which KPIs are most critical for manufacturers?
  - *Implication:* Need to prioritize most valuable insights
    - Material costs, labor costs, overhead costs, cost per unit, inventory turnover, production efficiency
- How do we calculate Cost of Goods Sold accurately?
  - *Implication:* Proper cost accounting methodology
  - COGS = Beginning Inventory + Purchases - Ending Inventory + Direct Labor + Overhead
  - Calculate COGS on a per-production-run basis to ensure accuracy. Each item produced will have its own COGS based on the actual raw materials, labor, and overhead allocated to that specific run, which will enable precise profit margin analysis by product.
- Should we track contribution margin by product/customer?
  - *Implication:* Additional revenue data required
    - Out of scope for now.
- Do we need industry benchmark comparisons?
  - *Implication:* External data sources and anonymized aggregation
    - Out of scope for now.

**Data Visualization:**

- What chart types are most useful for manufacturing data?
  - *Implication:* Recharts component selection and configuration
    - Pie/Donut, Line, Bar, Gauge, Scatter
- Should charts be interactive (drill-down, filtering)?
  - *Implication:* Enhanced interactivity and data exploration
  - Good, interactive charts with tooltips and filtering options will be the lifeblood of the project. Make sure to prioritize usability and clarity in data presentation with a modern design and themeing.
- Do we need to support dashboard customization?
  - *Implication:* User preferences and layout management
    - Yes, the user should be able to configure what charts and chart types show up. Allow them to save different dashboard views.
- Should reports be shareable with stakeholders?
  - *Implication:* Public links or email scheduling
    - Out of scope for now.

**Technical Questions:**

- How do we handle large datasets for reporting?
  - *Implication:* Data warehousing or aggregation tables
    - Use aggregation tables and background jobs to pre-calculate common metrics for performance. Avoid real-time calculations on large datasets. Only implement real-time data fetching for small datasets or summary metrics, not detailed reports. Do not over-engineer for massive scale until performance issues arise.
- Should we pre-calculate common metrics?
  - *Implication:* Background jobs and materialized views
    - Yes, pre-calculate common metrics nightly to ensure fast report loading times.
- Do we need to support data exports for external analysis?
  - *Implication:* CSV, Excel, API access for BI tools
  - Data export as csv is a must-have feature. More export formats can be considered later.
- How do we ensure report performance with growing data?
  - *Implication:* Query optimization and caching strategies
  - Use indexing, query optimization, and caching strategies to maintain performance as data grows. Monitor performance and adjust as needed.

**Business Intelligence:**

- Should we integrate with existing BI tools (Tableau, Power BI)?
  - *Implication:* API design for third-party access
  - Out of scope for now.
- Do we need predictive analytics (forecasting, anomaly detection)?
  - *Implication:* Machine learning integration
  - Out of scope for now, plan for simple analytics only at first, then consider more advanced features later.
- Should reports include actionable recommendations?
  - *Implication:* Smart insights based on patterns
  - The AI recommendation engine will be added later in development, after the core functionality is stable.
- Do we need audit trails for who viewed what reports?
  - *Implication:* Access logging and compliance
  - Out of scope for now.

**UX Questions:**

- Should reports auto-refresh or require manual refresh?
  - *Implication:* Real-time vs. on-demand data fetching
  - Allow a manual refresh button to avoid unnecessary data fetching and performance hits.
- Do users need mobile access to reports?
  - *Implication:* Mobile-optimized charts and responsive design
    - The program should be generally mobile responsive with a modern design, but a dedicated mobile functionality is out of scope.
- Should we support report subscriptions (email digest)?
  - *Implication:* Email scheduling and notification system
    - Out of scope for now.
- How do we handle reports with no data (new users)?
  - *Implication:* Empty states and sample data
    - Show helpful empty states with tips on how to get started and what data is needed to populate reports. Consider showing sample data or demo mode for new users.

---

## 7. Settings Page

**Route:** `/settings`  
**File:** `app/settings/page.tsx`

### Purpose

Configure organization settings, manage users and permissions, customize system behavior, and integrate with external systems.

### Key Features

- Tabbed interface: Organization | Users | Integrations | Preferences
- Organization profile (name, logo, address, tax info)
- User management table with role assignment
- Invite new users with email
- Costing method configuration (FIFO, LIFO, Average)
- Currency and units of measure settings
- Notification preferences
- API keys for integrations
- Subscription and billing information

### Mock Data Structure

```typescript
interface OrganizationSettings {
  id: string
  name: string
  logo?: string
  address: Address
  taxId: string
  fiscalYearEnd: string
  currency: string
  defaultUnit: string
  costingMethod: 'FIFO' | 'LIFO' | 'AVERAGE' | 'STANDARD'
  timezone: string
}

interface UserManagement {
  users: {
    id: string
    name: string
    email: string
    role: 'admin' | 'manager' | 'operator' | 'viewer'
    status: 'active' | 'invited' | 'suspended'
    lastLogin: Date
  }[]
  invitations: {
    email: string
    role: string
    sentDate: Date
    expiresDate: Date
  }[]
}

interface IntegrationSettings {
  accounting: {
    provider: 'quickbooks' | 'xero' | 'none'
    connected: boolean
    lastSync: Date
  }
  erp: {
    provider: string
    apiKey: string
    enabled: boolean
  }
  notifications: {
    email: boolean
    slack: boolean
    webhookUrl?: string
  }
}
```

### Questions & Implications

**Multi-Tenancy:**

- How do we ensure data isolation between organizations?
  - *Implication:* Database design with org_id filtering everywhere
  - Organizations will be completely isolated from each other. A user that belongs to multiple organizations will be presented with a switcher at login to select which organization they want to work in, but the routes and data will always be scoped to the selected organization.
- Can users belong to multiple organizations?
  - *Implication:* Organization switching and context management
    - Yes, a user can belong to multiple organizations. Implement an organization switcher in the UI to allow users to select which organization they want to work in during their session.
- Should we support org-to-org data sharing?
  - *Implication:* Complex permissions and data visibility rules
  - No, out of scope, each organization is completely isolated.
- How do we handle organization deletion?
  - *Implication:* Data retention policies and soft deletion
    - Implement soft deletion for organizations to allow recovery within a certain time frame. Ensure that all associated data is also marked as deleted but retained for audit purposes.

**User Management:**

- What roles and permissions do we need?
  - *Implication:* RBAC system design and enforcement
  - Keep simple roles: Admin (full access), Manager (most access), Operator (limited access, delete can be restricted).
- Should we support SSO (Single Sign-On)?
  - *Implication:* SAML/OAuth integration complexity
  - Authentication is handled with Clerk, which supports SSO out of the box.
- Do we need team/department structures within orgs?
  - *Implication:* Hierarchical permissions
    - Out of scope for now.
- How do we handle user deactivation vs. deletion?
  - *Implication:* Audit trail preservation
    - Implement user deactivation to preserve audit trails and historical data. Deleted users should be soft-deleted with the option to recover within a certain time frame.

**Configuration Impact:**

- Can costing method be changed after production runs exist?
  - *Implication:* Data migration and recalculation requirements
    - For now, we will only support one costing method per organization to prevent complexity. Changing costing methods after production runs exist is out of scope.
- How do we handle currency conversion for multi-currency orgs?
  - *Implication:* Exchange rate management and reporting complexity
  - Out of scope for now, only support a single currency per organization.
- Should we support multiple currencies in one organization?
  - *Implication:* Complex currency conversion throughout app
    - Out of scope for now, only support a single currency per organization.
- How do we handle changes to default units of measure?
  - *Implication:* Potential data inconsistency
  - Make sure that all calculations and reports are correctly accounting for the current unit of measure. e.g. 1L = 1000mL, taking 800ml from inventory should reduce 0.8L if the default unit is L.
- Can users customize which features are enabled?
  - *Implication:* Feature flags and conditional rendering
    - Out of scope for now.

**Integration Strategy:**

- Which integrations are highest priority?
  - *Implication:* Development effort allocation
  - Integrations are currently out of scope for the MVP. Plan to add QuickBooks and Xero accounting integrations later in development.
- Should integrations sync data or just push/pull?
  - *Implication:* Two-way sync complexity and conflict resolution
    - Out of scope for now.
- How do we handle integration failures?
  - *Implication:* Error handling, retries, and user notification
    - Out of scope for now.
- Should we provide webhooks for custom integrations?
  - *Implication:* Webhook infrastructure and security
    - Custom integrations are completely out of scope.

**Technical Questions:**

- How do we store sensitive settings (API keys)?
  - *Implication:* Encryption and key management
    - Store sensitive settings like API keys in an encrypted format in the database. Use environment variables for encryption keys and ensure that only authorized services can access them.
- Should settings changes trigger background jobs?
  - *Implication:* Change propagation and data consistency
    - Out of scope for now.
- Do we need settings versioning and rollback?
  - *Implication:* Configuration history tracking
    - Out of scope for now.
- How do we validate settings before saving?
  - *Implication:* Validation logic and error messaging
    - Implement client-side and server-side validation for all settings fields to ensure data integrity. Provide clear error messages to guide users in correcting any issues.

**Security & Compliance:**

- What audit logging do we need for settings changes?
  - *Implication:* Comprehensive audit trail
    - Out of scope
- Should certain settings require two-factor authentication?
  - *Implication:* Enhanced security for critical changes
  - Out of scope for now.
- Do we need to support data residency requirements?
  - *Implication:* Multi-region deployment
    - Out of scope for now.
- How do we handle GDPR/data privacy settings?
  - *Implication:* Data export, deletion, and consent management
    - The program should comply with GDPR regulations by allowing users to request data exports and deletions. Implement a consent management system to track user consent for data processing.

**UX Questions:**

- Should settings have a preview mode before saving?
  - *Implication:* Temporary state and confirmation workflows
  - Out of scope for now.
- How do we prevent accidental destructive changes?
  - *Implication:* Confirmation dialogs and safeguards
  - Implement confirmation dialogs for any destructive changes, such as deleting users. Use clear warnings to inform users of the potential impact of their actions.
- Should we show help text or tooltips for complex settings?
  - *Implication:* Documentation and in-app guidance
  - Provide help text for complex settings to guide users in understanding their implications.
- Do we need settings search functionality?
  - *Implication:* Settings are numerous and hard to find
    - Out of scope for now.

---

## 8. Update Header Navigation Links

**Component:** `components/header-nav.tsx`

### Changes Required

- Add "Raw Materials" link
- Add "Purchase Orders" link  
- Add "Reports" link
- Add "Settings" link (with admin icon/indicator)
- Implement mobile menu (hamburger) for responsive navigation
- Add active route highlighting
- Consider dropdown menus for grouped features

### Questions & Implications

**Navigation Architecture:**

- Should we group related pages in dropdowns?
  - *Example:* "Inventory" dropdown → Inventory, Raw Materials
  - *Implication:* Cleaner header but adds click depth
  - Implement a left-side vertical navigation bar for desktop and a hamburger menu for mobile to improve usability and accessibility.
- Do we need breadcrumbs in addition to nav links?
  - *Implication:* Better orientation but more UI elements
    - Out of scope for now.
- Should frequently accessed pages be pinned/favorites?
  - *Implication:* User personalization and state management
    - Out of scope for now.

**Mobile Experience:**

- Should mobile menu be slide-out drawer or full overlay?
  - *Implication:* Different UX patterns and implementation
  - Mobile specific features are out of scope for now, but the program should be generally mobile responsive with a modern design.
- Do we need bottom navigation for mobile?
  - *Implication:* Easier thumb reach on mobile devices
    - Out of scope for now.
- Should we show different links for mobile vs. desktop?
  - *Implication:* Context-aware navigation
    - Out of scope for now.

**Permissions:**

- Should navigation hide links based on user role?
  - *Implication:* Permission-aware rendering
    - Yes, hide links to restricted features based on user role to prevent unauthorized access.
- How do we indicate restricted features?
  - *Implication:* Lock icons or disabled states
    - Grey out links to restricted features.

---

## 9. Create Reusable Page Layout Component

**Component:** `components/page-layout.tsx`

### Purpose

Provide consistent structure for all internal pages with header, breadcrumbs, actions, and content area.

### Features

- Page title with optional subtitle
- Breadcrumb navigation
- Primary action button(s) in header
- Secondary actions menu
- Content area with proper spacing
- Loading states
- Empty states
- Error boundaries

### Component API

```typescript
interface PageLayoutProps {
  title: string
  subtitle?: string
  breadcrumbs?: { label: string; href?: string }[]
  primaryAction?: {
    label: string
    icon?: ReactNode
    onClick: () => void
  }
  secondaryActions?: MenuItem[]
  isLoading?: boolean
  isEmpty?: boolean
  emptyState?: ReactNode
  children: ReactNode
}
```

### Questions & Implications

**Design System:**

- Should page layout enforce strict spacing/sizing?
  - *Implication:* Consistency vs. flexibility trade-off
    - Enforce consistent spacing and sizing to maintain a uniform look and feel across the application.
- Do we need multiple layout variants (full-width, centered, sidebar)?
  - *Implication:* Layout complexity and documentation
    - Start with a single layout variant and consider adding more in the future if needed.
- Should we support sticky headers/footers?
  - *Implication:* Scroll behavior and positioning
    - Sticky headers

**Content Patterns:**

- Should tabs be part of page layout or separate?
  - *Implication:* Tab state management
    - Out of scope for now.
- Do we need built-in filters/search in header?
  - *Implication:* Common filter patterns
    - Out of scope for now.
- Should page layout handle error states?
  - *Implication:* Error boundary integration
    - Yes, include error boundaries to catch and display errors gracefully within the content area.

**Accessibility:**

- How do we ensure proper heading hierarchy?
  - *Implication:* Semantic HTML and screen reader support
    - Use semantic HTML elements (e.g., `<h1>`, `<h2>`) to ensure proper heading hierarchy for accessibility.
- Should page layout manage focus on navigation?
  - *Implication:* Keyboard navigation and focus management
    - Yes, manage focus appropriately to enhance keyboard navigation and accessibility.
- Do we need skip-to-content links?
  - *Implication:* Accessibility best practices
    - no, pages should be simple enough that skip links are not necessary.

---

## Implementation Strategy

### Phase 1: Foundation (Current Phase)

1. ✅ Header Navigation with user display
2. 🎯 Page Layout Component
3. 🎯 Update Header with all navigation links

### Phase 2: Core Pages (Priority Order)

1. Dashboard (already exists - enhance if needed)
2. Inventory Management
3. Raw Materials Tracking
4. Production Management

### Phase 3: Supporting Pages

1. Suppliers Management
2. Purchase Orders
3. Settings

### Phase 4: Analytics

1. Reports/Analytics page

### Success Criteria

**For Each Page:**

- ✅ Implements authentication check
- ✅ Uses PageLayout component for consistency
- ✅ Includes realistic mock data structures
- ✅ Has loading, empty, and error states
- ✅ Is responsive (mobile, tablet, desktop)
- ✅ Follows Tailwind/shadcn patterns
- ✅ Has clear comments indicating future API integration points

**Overall:**

- ✅ All navigation links work
- ✅ User can navigate entire app flow
- ✅ Mock data demonstrates business logic
- ✅ Code is simple and maintainable
- ✅ Ready for backend integration

---

## Technical Debt & Future Considerations

### Known Limitations

- Mock data is client-side only (will move to API calls)
- No actual data persistence
- No real-time updates between users
- No actual file uploads
- No email sending
- Simplified cost calculations

### Future Enhancements

- Real-time WebSocket updates for production runs
- Advanced filtering and saved filters
- Bulk operations (bulk edit, bulk import)
- Mobile apps for shop floor workers
- Barcode scanning integration
- Advanced analytics and ML predictions
- Multi-language support
- Advanced reporting and exports
- Workflow automation and approval chains

---

## Questions to Resolve Before Full Implementation

### Critical Business Decisions

1. What costing method(s) must we support? (FIFO, LIFO, Average, Standard)
2. Do we need multi-location inventory tracking?
3. Is lot/batch tracking required for compliance?
4. What approval workflows are needed for POs and production?
5. What integrations are highest priority?

### User Experience Priorities

1. Which user workflows are most time-critical?
2. What reports do users need daily vs. monthly?
3. How technical are the primary users?
4. Is mobile access required for which features?
5. What causes the most manual data entry pain today?

### Technical Architecture

1. What's our scalability target (users, transactions, data volume)?
2. Do we need real-time features or is polling acceptable?
3. What's our data retention policy?
4. How do we handle multi-currency if needed?
5. What's our API integration strategy?

---

**Next Steps:**

1. Review and validate this plan with stakeholders
2. Prioritize which questions need answers before building
3. Begin implementation with PageLayout component
4. Build pages incrementally, testing each before moving forward
5. Document any new decisions in ADRs (Architecture Decision Records)

---

*Last updated: October 2, 2025*  
*Author: Development Team*
