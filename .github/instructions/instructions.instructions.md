---
applyTo: '**'
---
# **Pulse COGS Genius - Project Summary**

## **What It Is**
A web-based manufacturing cost management platform that helps manufacturers track production costs, manage inventory, and optimize their Cost of Goods Sold (COGS).

## **Core Purpose**
Enable manufacturers to:
- Track raw materials and finished products
- Calculate production costs accurately
- Manage suppliers and purchase orders
- Monitor inventory in real-time
- Get insights into production efficiency

## **Key Features**
1. **Multi-Tenant System** - Multiple organizations with isolated data and role-based permissions
2. **Inventory Management** - Track raw materials and finished products with automated alerts
3. **Production Tracking** - Bill of Materials (BOM), production runs, and cost calculations
4. **Purchase Management** - Purchase orders, supplier relationships, and transaction history
5. **Dashboard & Analytics** - Real-time metrics, charts, and performance monitoring
6. **Data Import/Export** - CSV support for bulk operations

## **Tech Stack**
- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL database + Authentication)
- **UI**: Tailwind CSS + shadcn/ui components
- **State Management**: React Query (TanStack Query)

## **Project Structure**
```
src/
  ├── pages/          # Main application pages
  ├── components/     # Reusable UI components
  ├── services/       # Backend API integration
  ├── hooks/          # Custom React hooks
  └── lib/            # Utilities and validation
supabase/
  └── migrations/     # Database schema and migrations
docs/                 # Technical documentation
```

## **Strategic Insights**

### **Manufacturing ERP Considerations**
- **Real-time accuracy is critical** - Inventory discrepancies can cascade into production delays and cost overruns
- **Scalability matters** - Small manufacturers often grow rapidly; system must handle 10x growth
- **Integration needs** - Most manufacturers use existing tools (accounting software, machinery systems)
- **User adoption** - Shop floor workers need simple, fast interfaces; managers need detailed analytics
- **Compliance requirements** - Food, pharma, and regulated industries have strict traceability needs

### **Technical Architecture Insights**
- **Row Level Security (RLS)** - Supabase RLS ensures true multi-tenancy at database level
- **Optimistic updates** - React Query enables fast UI responses while syncing with backend
- **Offline considerations** - Manufacturing environments may have spotty internet connectivity
- **Audit trails** - Every cost and inventory change must be traceable for compliance
- **Performance** - Large BOMs and production runs can create complex queries

## **Key Development Questions**

### **Business Logic**
- How do we handle partial inventory consumption during production runs?
- What happens when a BOM changes mid-production?
- How do we calculate landed costs (shipping, duties, handling fees)?
- Should we support multiple costing methods (FIFO, LIFO, Average)?
- How do we handle waste, scrap, and rework costs?

### **User Experience**
- What's the minimum viable feature set for launch?
- How do different user roles (operator, manager, admin) interact with the system?
- Should mobile support be prioritized for shop floor use?
- How do we handle bulk operations without overwhelming the UI?
- What level of customization should tenants have?

### **Technical Implementation**
- How do we ensure data consistency across complex manufacturing transactions?
- What's our strategy for handling large datasets (10M+ inventory transactions)?
- How do we implement real-time notifications without overwhelming users?
- Should we build custom reporting or integrate with existing BI tools?
- How do we handle data migration from existing systems?

### **Scaling & Operations**
- What's our pricing model and how does it affect feature prioritization?
- How do we handle different currencies and international operations?
- What backup and disaster recovery strategies do we need?
- How do we monitor system health and user satisfaction?
- What's our plan for handling customer support and onboarding?

## **Success Metrics**

### **User Adoption**
- Daily active users per tenant organization
- Feature utilization rates (which modules get used most)
- Time from signup to first meaningful action
- User retention rates (monthly/quarterly)

### **Business Impact**
- Reduction in inventory carrying costs for customers
- Improvement in production cost accuracy
- Time saved on manual data entry and calculations
- Customer-reported ROI and efficiency gains

### **Technical Performance**
- Page load times and query performance
- System uptime and reliability
- Data accuracy and consistency
- Successful data imports/exports

## **Development Principles**

### **Keep It Simple**
- **Favor simplicity over complexity** - Choose the most straightforward solution that meets requirements
- **Build incrementally** - Start with basic functionality and add complexity only when needed
- **Avoid premature optimization** - Solve real performance problems, not imaginary ones
- **Use standard patterns** - Stick to established React/TypeScript conventions and patterns
- **Clear over clever** - Write code that's easy to understand and maintain

### **Implementation Guidelines**
- **Start with the happy path** - Build core functionality first, handle edge cases later
- **Use existing solutions** - Leverage shadcn/ui components and React Query patterns
- **Keep components small** - Single responsibility, easy to test and understand
- **Minimize abstractions** - Don't create abstractions until you have 3+ use cases
- **Document decisions** - Brief comments explaining "why" not "what"

### **When to Add Complexity**
- **Real user feedback** - Users actually need the feature
- **Performance bottlenecks** - Measured slow performance, not theoretical
- **Security requirements** - Compliance or data protection needs
- **Scale requirements** - Current solution can't handle actual load
- **Integration demands** - External systems require specific approaches

### **Red Flags to Avoid**
- ❌ Building "flexible" systems before knowing requirements
- ❌ Adding features "just in case" they're needed
- ❌ Over-abstracting common code too early
- ❌ Implementing complex patterns for simple problems
- ❌ Optimizing before measuring performance issues

**Remember**: *Manufacturers need reliable, fast tools - not impressive architecture. Build what works.*

**In one sentence**: *A React-based manufacturing ERP system for tracking costs, inventory, and production with multi-tenant support that prioritizes real-time accuracy and user adoption in manufacturing environments.*