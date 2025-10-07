# Clerk + Supabase Implementation Plan for AlphaPulseCOGS2

**Date:** October 6, 2025  
**Status:** Ready for Implementation  
**Version:** 1.0

---

## Executive Summary

This document provides a comprehensive implementation plan for integrating Clerk authentication with Supabase multi-tenancy for the AlphaPulseCOGS platform. The strategy uses **Clerk's user metadata** (not Clerk Organizations) combined with **Supabase RLS** for true data isolation.

### Key Decision: Why NOT Use Clerk Organizations

After reviewing the Clerk documentation and project requirements, **we will NOT use Clerk's built-in Organizations feature** because:

1. **Cost Implications** - Clerk charges per Monthly Active Organization (MAO), which is $1/org after 100 orgs on Pro plan
2. **Feature Mismatch** - Clerk Organizations are designed for collaboration/teams, not manufacturing companies as tenants
3. **Complexity** - We need simple tenant isolation, not complex role hierarchies within orgs
4. **Control** - We want full control over organization data in our Supabase database
5. **Flexibility** - Our `organizations` table allows custom settings, branding, and manufacturing-specific data

### Our Approach: Metadata + RLS

Instead, we'll use:
- **Clerk `publicMetadata`** to store active organization ID and user roles
- **Supabase `organization_users` junction table** to manage multi-org membership
- **Supabase RLS policies** to enforce data isolation at the database level
- **Custom organization switcher component** for multi-org users

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Side                          │
├─────────────────────────────────────────────────────────────┤
│  Clerk Auth (User Sessions)                                 │
│  ├─ User ID (from Clerk)                                    │
│  ├─ publicMetadata: { activeOrgId, role }                   │
│  └─ Session Token (JWT with custom claims)                  │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Middleware Layer                          │
├─────────────────────────────────────────────────────────────┤
│  Clerk Middleware (middleware.ts)                           │
│  ├─ Protects routes                                         │
│  ├─ Injects user info into session                          │
│  └─ Redirects unauthenticated users                         │
└────────────────────┬────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    Supabase Database                         │
├─────────────────────────────────────────────────────────────┤
│  Row Level Security (RLS)                                   │
│  ├─ organization_id filter on ALL tables                    │
│  ├─ Reads activeOrgId from JWT claims                       │
│  └─ Prevents cross-org data access                          │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Phases

### Phase 0: Core Setup (Already Complete ✅)

**Status:** Complete based on existing files

**What Exists:**
- ✅ `ClerkClientProvider` component with theme customization
- ✅ `middleware.ts` with route protection
- ✅ Supabase migration with `organizations`, `organization_users`, `users_profile` tables
- ✅ RLS policies enabled on organizations table

**What's Missing:**
- ❌ Custom session token claims configuration
- ❌ TypeScript type definitions for metadata
- ❌ Organization context/hooks
- ❌ Onboarding flow for new users

---

## Phase 1: Session Token Customization (HIGH PRIORITY)

### Step 1.1: Configure Clerk Session Token

**Action Required:** Manual configuration in Clerk Dashboard

1. Navigate to [Clerk Dashboard > Sessions](https://dashboard.clerk.com/last-active?path=sessions)
2. Under **Customize session token**, add the following JSON in the **Claims** editor:

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

3. Click **Save**

**Why:** This embeds the user's `publicMetadata` directly into the JWT session token, making it accessible without additional API calls.

---

### Step 1.2: Create TypeScript Type Definitions

**File:** `types/globals.d.ts`

```typescript
export {}

// User roles within an organization
export type UserRole = 'admin' | 'manager' | 'operator'

// Organization metadata stored in Clerk
export interface UserOrgMetadata {
  activeOrgId: string | null
  role?: UserRole
}

declare global {
  interface CustomJwtSessionClaims {
    metadata: UserOrgMetadata
  }
}
```

**Purpose:** 
- Provides TypeScript autocomplete for `auth().sessionClaims.metadata`
- Prevents type errors when accessing metadata
- Documents the expected structure

---

### Step 1.3: Create Metadata Helper Functions

**File:** `lib/auth/metadata.ts`

```typescript
import { auth } from '@clerk/nextjs/server'
import { clerkClient } from '@clerk/nextjs/server'
import type { UserRole, UserOrgMetadata } from '@/types/globals'

/**
 * Get the current user's active organization ID from session claims
 * Returns null if no active organization is set
 */
export async function getActiveOrgId(): Promise<string | null> {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.activeOrgId ?? null
}

/**
 * Get the current user's role in their active organization
 * Returns null if no role is set
 */
export async function getUserRole(): Promise<UserRole | null> {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata?.role ?? null
}

/**
 * Check if the user has a specific role
 * @param role - The role to check for
 * @returns true if user has the role, false otherwise
 */
export async function checkRole(role: UserRole): Promise<boolean> {
  const userRole = await getUserRole()
  return userRole === role
}

/**
 * Check if the user has admin privileges
 * Admins have full access to all features
 */
export async function isAdmin(): Promise<boolean> {
  return checkRole('admin')
}

/**
 * Check if the user has manager or admin privileges
 * Managers can view reports and manage operations
 */
export async function isManagerOrAbove(): Promise<boolean> {
  const role = await getUserRole()
  return role === 'admin' || role === 'manager'
}

/**
 * Set the active organization for a user
 * Updates Clerk publicMetadata which will be reflected in the next session token
 * 
 * @param userId - Clerk user ID
 * @param orgId - Organization ID to set as active
 * @param role - User's role in the organization
 */
export async function setActiveOrg(
  userId: string, 
  orgId: string, 
  role: UserRole
): Promise<void> {
  const client = await clerkClient()
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      activeOrgId: orgId,
      role: role,
    },
  })
}

/**
 * Clear the active organization (set to personal account)
 * Only relevant if personal accounts are enabled
 */
export async function clearActiveOrg(userId: string): Promise<void> {
  const client = await clerkClient()
  
  await client.users.updateUserMetadata(userId, {
    publicMetadata: {
      activeOrgId: null,
      role: null,
    },
  })
}

/**
 * Get full metadata object for current user
 */
export async function getMetadata(): Promise<UserOrgMetadata> {
  const { sessionClaims } = await auth()
  return sessionClaims?.metadata ?? { activeOrgId: null }
}
```

**Usage Examples:**

```typescript
// In a Server Component
import { getActiveOrgId, checkRole } from '@/lib/auth/metadata'

export default async function DashboardPage() {
  const orgId = await getActiveOrgId()
  const isAdmin = await checkRole('admin')
  
  if (!orgId) {
    redirect('/onboarding')
  }
  
  return <Dashboard orgId={orgId} isAdmin={isAdmin} />
}
```

---

## Phase 2: Supabase RLS Integration

### Step 2.1: Update RLS Policies to Use JWT Claims

**File:** `supabase/migrations/20251006000001_rls_with_clerk_jwt.sql`

```sql
-- =====================================================
-- Migration: RLS Policies with Clerk JWT Integration
-- Purpose: Use Clerk session token claims for RLS enforcement
-- Date: 2025-10-06
-- =====================================================

-- Helper function to extract active org ID from JWT claims
CREATE OR REPLACE FUNCTION auth.active_org_id()
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'metadata'->>'activeOrgId',
    ''
  )::TEXT;
$$ LANGUAGE sql STABLE;

-- Helper function to extract user role from JWT claims
CREATE OR REPLACE FUNCTION auth.user_role()
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'metadata'->>'role',
    ''
  )::TEXT;
$$ LANGUAGE sql STABLE;

-- Helper function to get Clerk user ID from JWT
CREATE OR REPLACE FUNCTION auth.clerk_user_id()
RETURNS TEXT AS $$
  SELECT NULLIF(
    current_setting('request.jwt.claims', true)::json->>'sub',
    ''
  )::TEXT;
$$ LANGUAGE sql STABLE;

-- =====================================================
-- RLS Policies for organizations table
-- =====================================================

-- Users can only see organizations they are members of
DROP POLICY IF EXISTS "Users can view their organizations" ON organizations;
CREATE POLICY "Users can view their organizations" ON organizations
  FOR SELECT
  USING (
    id IN (
      SELECT organization_id 
      FROM organization_users 
      WHERE user_id = auth.clerk_user_id() 
      AND status = 'active'
    )
  );

-- Only admins can update organization settings
DROP POLICY IF EXISTS "Admins can update organizations" ON organizations;
CREATE POLICY "Admins can update organizations" ON organizations
  FOR UPDATE
  USING (
    id = auth.active_org_id()::UUID 
    AND auth.user_role() = 'admin'
  );

-- =====================================================
-- RLS Policies for organization_users table
-- =====================================================

-- Users can see all members of their active organization
DROP POLICY IF EXISTS "Users can view org members" ON organization_users;
CREATE POLICY "Users can view org members" ON organization_users
  FOR SELECT
  USING (organization_id = auth.active_org_id()::UUID);

-- Admins and managers can invite users to their organization
DROP POLICY IF EXISTS "Managers can invite users" ON organization_users;
CREATE POLICY "Managers can invite users" ON organization_users
  FOR INSERT
  WITH CHECK (
    organization_id = auth.active_org_id()::UUID
    AND auth.user_role() IN ('admin', 'manager')
  );

-- Admins can update member roles
DROP POLICY IF EXISTS "Admins can update member roles" ON organization_users;
CREATE POLICY "Admins can update member roles" ON organization_users
  FOR UPDATE
  USING (
    organization_id = auth.active_org_id()::UUID
    AND auth.user_role() = 'admin'
  );

-- =====================================================
-- Generic RLS Policy Template for All Data Tables
-- =====================================================

-- Example: Apply to inventory_items table (repeat for all tables)
DROP POLICY IF EXISTS "Users can view org inventory" ON inventory_items;
CREATE POLICY "Users can view org inventory" ON inventory_items
  FOR SELECT
  USING (organization_id = auth.active_org_id()::UUID);

DROP POLICY IF EXISTS "Users can insert org inventory" ON inventory_items;
CREATE POLICY "Users can insert org inventory" ON inventory_items
  FOR INSERT
  WITH CHECK (organization_id = auth.active_org_id()::UUID);

DROP POLICY IF EXISTS "Users can update org inventory" ON inventory_items;
CREATE POLICY "Users can update org inventory" ON inventory_items
  FOR UPDATE
  USING (organization_id = auth.active_org_id()::UUID);

-- Operators can't delete inventory
DROP POLICY IF EXISTS "Managers can delete org inventory" ON inventory_items;
CREATE POLICY "Managers can delete org inventory" ON inventory_items
  FOR DELETE
  USING (
    organization_id = auth.active_org_id()::UUID
    AND auth.user_role() IN ('admin', 'manager')
  );

-- =====================================================
-- Note: Apply similar policies to all tables with organization_id:
-- - inventory_transactions
-- - production_runs
-- - production_materials
-- - raw_material_lots
-- - bills_of_materials
-- - bom_components
-- - suppliers
-- - purchase_orders
-- - purchase_order_items
-- =====================================================
```

---

### Step 2.2: Configure Supabase Client to Pass JWT

**File:** `lib/supabase/client.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { useAuth } from '@clerk/nextjs'

/**
 * Create a Supabase client that uses Clerk session token
 * This ensures RLS policies can read the activeOrgId from JWT claims
 */
export function useSupabaseClient() {
  const { getToken } = useAuth()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: async () => {
        const token = await getToken({ template: 'supabase' })
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    },
  })

  return supabase
}
```

**Server-Side Version:**

**File:** `lib/supabase/server.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'

/**
 * Create a Supabase client for server-side use with Clerk auth
 */
export async function createSupabaseServerClient() {
  const { getToken } = await auth()
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

  const token = await getToken({ template: 'supabase' })

  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  })
}
```

---

### Step 2.3: Create JWT Template in Clerk Dashboard

**Action Required:** Manual configuration in Clerk Dashboard

1. Navigate to [Clerk Dashboard > JWT Templates](https://dashboard.clerk.com/last-active?path=jwt-templates)
2. Click **New Template**
3. Name it `supabase`
4. Add the following claims:

```json
{
  "metadata": "{{user.public_metadata}}",
  "sub": "{{user.id}}"
}
```

5. Set **Token Lifetime** to `60` seconds (short-lived for security)
6. Click **Save**

**Why:** Supabase needs a JWT with the user's metadata to enforce RLS policies. Clerk's JWT templates allow us to customize the token structure.

---

## Phase 3: Organization Context & Hooks

### Step 3.1: Create Organization Context

**File:** `contexts/organization-context.tsx`

```typescript
'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { useUser, useAuth } from '@clerk/nextjs'
import type { UserRole } from '@/types/globals'

interface OrganizationContextType {
  activeOrgId: string | null
  role: UserRole | null
  isLoading: boolean
  switchOrg: (orgId: string, role: UserRole) => Promise<void>
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user, isLoaded: userLoaded } = useUser()
  const { getToken } = useAuth()
  
  const [activeOrgId, setActiveOrgId] = useState<string | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Sync with user metadata on mount and user changes
  useEffect(() => {
    if (userLoaded && user) {
      const metadata = user.publicMetadata as { activeOrgId?: string; role?: UserRole }
      setActiveOrgId(metadata.activeOrgId ?? null)
      setRole(metadata.role ?? null)
      setIsLoading(false)
    }
  }, [user, userLoaded])

  const switchOrg = async (newOrgId: string, newRole: UserRole) => {
    if (!user) return

    try {
      setIsLoading(true)
      
      // Update Clerk metadata
      await user.update({
        publicMetadata: {
          activeOrgId: newOrgId,
          role: newRole,
        },
      })

      // Force token refresh to get new claims
      await getToken({ template: 'supabase', skipCache: true })

      // Update local state
      setActiveOrgId(newOrgId)
      setRole(newRole)
      
      // Refresh the page to reload all data with new org context
      window.location.reload()
    } catch (error) {
      console.error('Failed to switch organization:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <OrganizationContext.Provider value={{ activeOrgId, role, isLoading, switchOrg }}>
      {children}
    </OrganizationContext.Provider>
  )
}

export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within OrganizationProvider')
  }
  return context
}
```

---

### Step 3.2: Add Organization Provider to Layout

**File:** `app/layout.tsx` (Update)

```typescript
import ClerkClientProvider from '@/components/providers/clerk-client-provider'
import { OrganizationProvider } from '@/contexts/organization-context'
import TanstackClientProvider from '@/components/providers/tanstack-client-provider'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkClientProvider>
          <OrganizationProvider>
            <TanstackClientProvider>
              <HeaderNav />
              {children}
            </TanstackClientProvider>
          </OrganizationProvider>
        </ClerkClientProvider>
      </body>
    </html>
  )
}
```

---

## Phase 4: Organization Switcher Component

### Step 4.1: Create Organization Switcher

**File:** `components/organization-switcher.tsx`

```typescript
'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/contexts/organization-context'
import { useSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Building2, Check, ChevronsUpDown } from 'lucide-react'
import type { UserRole } from '@/types/globals'

interface OrgMembership {
  id: string
  organization_id: string
  role: UserRole
  organization: {
    id: string
    name: string
    slug: string
    logo_url: string | null
  }
}

export function OrganizationSwitcher() {
  const { activeOrgId, switchOrg, isLoading: contextLoading } = useOrganization()
  const supabase = useSupabaseClient()
  
  const [memberships, setMemberships] = useState<OrgMembership[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    fetchMemberships()
  }, [])

  const fetchMemberships = async () => {
    try {
      const { data, error } = await supabase
        .from('organization_users')
        .select(`
          id,
          organization_id,
          role,
          organization:organizations(id, name, slug, logo_url)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })

      if (error) throw error
      setMemberships(data || [])
    } catch (error) {
      console.error('Error fetching organizations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSwitch = async (orgId: string, role: UserRole) => {
    await switchOrg(orgId, role)
  }

  const activeOrg = memberships.find(m => m.organization_id === activeOrgId)

  if (isLoading || contextLoading) {
    return (
      <Button variant="outline" disabled>
        <Building2 className="mr-2 h-4 w-4" />
        Loading...
      </Button>
    )
  }

  if (memberships.length === 0) {
    return (
      <Button variant="outline" disabled>
        <Building2 className="mr-2 h-4 w-4" />
        No Organizations
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-full justify-between">
          <div className="flex items-center gap-2">
            {activeOrg?.organization.logo_url ? (
              <img 
                src={activeOrg.organization.logo_url} 
                alt={activeOrg.organization.name}
                className="h-5 w-5 rounded"
              />
            ) : (
              <Building2 className="h-4 w-4" />
            )}
            <span className="truncate">
              {activeOrg?.organization.name || 'Select Organization'}
            </span>
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        <DropdownMenuLabel>Switch Organization</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {memberships.map((membership) => (
          <DropdownMenuItem
            key={membership.id}
            onClick={() => handleSwitch(membership.organization_id, membership.role)}
            className="cursor-pointer"
          >
            <div className="flex items-center gap-2 w-full">
              {membership.organization.logo_url ? (
                <img 
                  src={membership.organization.logo_url} 
                  alt={membership.organization.name}
                  className="h-5 w-5 rounded"
                />
              ) : (
                <Building2 className="h-4 w-4" />
              )}
              <span className="truncate flex-1">{membership.organization.name}</span>
              {membership.organization_id === activeOrgId && (
                <Check className="h-4 w-4" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
```

---

### Step 4.2: Add Organization Switcher to Header

**File:** `components/header-nav.tsx` (Update)

```typescript
import { OrganizationSwitcher } from './organization-switcher'

export function HeaderNav() {
  return (
    <header className="border-b">
      <div className="flex h-16 items-center px-4 gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <span className="font-semibold">Pulse COGS</span>
        </div>
        
        {/* Organization Switcher */}
        <div className="flex-1 max-w-xs">
          <OrganizationSwitcher />
        </div>
        
        {/* Other header items (user menu, etc.) */}
      </div>
    </header>
  )
}
```

---

## Phase 5: Onboarding Flow

### Step 5.1: Create Onboarding Page

**File:** `app/onboarding/page.tsx`

```typescript
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { useSupabaseClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default function OnboardingPage() {
  const { user } = useUser()
  const router = useRouter()
  const supabase = useSupabaseClient()
  
  const [orgName, setOrgName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleCreateOrg = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      // 1. Create organization in Supabase
      const { data: org, error: orgError } = await supabase
        .from('organizations')
        .insert({
          name: orgName,
          slug: orgName.toLowerCase().replace(/\s+/g, '-'),
          created_by: user.id,
        })
        .select()
        .single()

      if (orgError) throw orgError

      // 2. Add user as admin member
      const { error: memberError } = await supabase
        .from('organization_users')
        .insert({
          organization_id: org.id,
          user_id: user.id,
          role: 'admin',
          status: 'active',
          joined_at: new Date().toISOString(),
        })

      if (memberError) throw memberError

      // 3. Update Clerk metadata
      await user.update({
        publicMetadata: {
          activeOrgId: org.id,
          role: 'admin',
        },
      })

      // 4. Redirect to dashboard
      router.push('/dashboard')
    } catch (error) {
      console.error('Error creating organization:', error)
      alert('Failed to create organization. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome to Pulse COGS</CardTitle>
          <CardDescription>
            Let's get started by creating your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateOrg} className="space-y-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                placeholder="Acme Manufacturing"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
              />
              <p className="text-sm text-muted-foreground mt-1">
                This is your company or business name
              </p>
            </div>
            
            <Button type="submit" className="w-full" disabled={isLoading || !orgName}>
              {isLoading ? 'Creating...' : 'Create Organization'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
```

---

### Step 5.2: Add Onboarding Check to Middleware

**File:** `middleware.ts` (Update)

```typescript
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/inventory(.*)',
  '/production(.*)',
  '/suppliers(.*)',
  '/purchase-orders(.*)',
  '/reports(.*)',
  '/settings(.*)',
])

const isPublicRoute = createRouteMatcher([
  '/',
  '/login(.*)',
  '/signup(.*)',
  '/onboarding',
  '/api/webhooks(.*)',
])

export default clerkMiddleware(async (auth, req) => {
  if (isPublicRoute(req)) {
    return
  }

  if (isProtectedRoute(req)) {
    const { userId, sessionClaims } = await auth.protect({
      unauthenticatedUrl: '/login',
      unauthorizedUrl: '/login',
    })

    // Check if user has an active organization
    const activeOrgId = sessionClaims?.metadata?.activeOrgId
    
    if (!activeOrgId && !req.nextUrl.pathname.startsWith('/onboarding')) {
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }
})

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
  ],
}
```

---

## Phase 6: Usage Patterns & Best Practices

### Pattern 1: Server Component Data Fetching

```typescript
// app/dashboard/page.tsx
import { getActiveOrgId } from '@/lib/auth/metadata'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export default async function DashboardPage() {
  const orgId = await getActiveOrgId()
  
  if (!orgId) {
    redirect('/onboarding')
  }

  const supabase = await createSupabaseServerClient()
  
  // RLS will automatically filter by activeOrgId
  const { data: items } = await supabase
    .from('inventory_items')
    .select('*')
    .limit(10)

  return <DashboardView items={items} />
}
```

---

### Pattern 2: Client Component with React Query

```typescript
// hooks/use-inventory.ts
import { useQuery } from '@tanstack/react-query'
import { useSupabaseClient } from '@/lib/supabase/client'
import { useOrganization } from '@/contexts/organization-context'

export function useInventoryItems() {
  const { activeOrgId } = useOrganization()
  const supabase = useSupabaseClient()

  return useQuery({
    queryKey: ['inventory-items', activeOrgId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data
    },
    enabled: !!activeOrgId,
  })
}
```

---

### Pattern 3: Role-Based UI Rendering

```typescript
// components/inventory/inventory-actions.tsx
'use client'

import { useOrganization } from '@/contexts/organization-context'
import { Button } from '@/components/ui/button'

export function InventoryActions() {
  const { role } = useOrganization()
  
  // Operators can only adjust quantities
  if (role === 'operator') {
    return <Button variant="outline">Adjust Quantity</Button>
  }
  
  // Managers and admins can delete items
  return (
    <>
      <Button variant="outline">Adjust Quantity</Button>
      <Button variant="destructive">Delete Item</Button>
    </>
  )
}
```

---

## Phase 7: Testing Checklist

### Authentication Flow
- [ ] User can sign up successfully
- [ ] User can sign in and session persists
- [ ] User is redirected to onboarding if no org exists
- [ ] User can create organization during onboarding
- [ ] User metadata is updated with activeOrgId and role

### Multi-Tenancy
- [ ] User can only see data from their active organization
- [ ] Switching organizations updates all queries
- [ ] RLS prevents cross-org data access (test with SQL directly)
- [ ] User with multiple orgs sees all in switcher dropdown

### Role-Based Access
- [ ] Admin can delete records
- [ ] Manager can view reports but not delete orgs
- [ ] Operator cannot delete inventory items
- [ ] Middleware blocks unauthorized access

### Edge Cases
- [ ] User removed from org is redirected to onboarding
- [ ] User with no organizations is redirected to onboarding
- [ ] Session token refresh works after metadata update
- [ ] Page reload maintains organization context

---

## Environment Variables Checklist

Ensure these are set in `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Common Pitfalls & Solutions

### Issue: "User has no active organization" error

**Cause:** Metadata not synced or token not refreshed

**Solution:**
```typescript
// Force token refresh after updating metadata
await getToken({ template: 'supabase', skipCache: true })
```

---

### Issue: RLS policies not filtering data

**Cause:** JWT not being passed to Supabase or claims missing

**Solution:** Verify JWT template includes metadata and supabase client uses correct headers

```typescript
// Check if token has metadata
const token = await getToken({ template: 'supabase' })
console.log('Token:', token) // Should contain metadata claim
```

---

### Issue: Organization switcher not updating UI

**Cause:** Context not triggering re-render or stale queries

**Solution:** Reload page after org switch or invalidate all queries

```typescript
// In switchOrg function
await queryClient.invalidateQueries()
window.location.reload() // Nuclear option but reliable
```

---

## Next Steps

1. ✅ **Configure Clerk Session Token** - Add metadata claims in dashboard
2. ✅ **Create JWT Template** - Named 'supabase' with custom claims
3. ✅ **Update RLS Policies** - Add helper functions and policies
4. ✅ **Implement Organization Context** - React context for org state
5. ✅ **Build Organization Switcher** - Dropdown component for multi-org users
6. ✅ **Create Onboarding Flow** - First-time user experience
7. ⏳ **Test Multi-Tenancy** - Verify data isolation
8. ⏳ **Add Role-Based UI** - Show/hide features by role

---

## References

- [Clerk Basic RBAC Guide](https://clerk.com/docs/guides/secure/basic-rbac)
- [Clerk Organizations Overview](https://clerk.com/docs/guides/organizations/overview)
- [Clerk Custom Session Token Claims](https://clerk.com/docs/guides/sessions/session-tokens)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [AlphaPulseCOGS Requirements](/docs/features/revised-implementation-plan.md)

---

**Last Updated:** October 6, 2025  
**Author:** Chronus (AI Assistant)  
**Version:** 1.0
