/**
 * Organization Context and Provider
 * 
 * Manages the current active organization for multi-tenant functionality.
 * Provides organization switching capabilities and ensures all data operations
 * are scoped to the correct organization.
 * 
 * Features:
 * - Active organization state management
 * - Organization switching with persistence
 * - User organization membership validation
 * - RLS context for database queries
 * 
 * @context OrganizationContext
 */
'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useUser } from '@clerk/nextjs'
import { useSupabase } from '@/utils/supabase/context'
import { Database } from '@/types/database.types'
import { createOrganizationService } from '@/services/organization.service'

// Type definitions for organization data
type Organization = Database['public']['Tables']['organizations']['Row']
type UserRole = Database['public']['Enums']['user_role']
type OrganizationUser = Database['public']['Tables']['organization_users']['Row']

interface OrganizationMembership {
  organization: Organization
  role: UserRole
  joinedAt: string | null
  isActive: boolean
}

interface OrganizationContextType {
  // Current active organization
  activeOrganization: Organization | null
  
  // All organizations user has access to
  userOrganizations: OrganizationMembership[]
  
  // User's role in the active organization
  userRole: UserRole | null
  
  // Loading states
  isLoading: boolean
  isError: boolean
  error: Error | null
  
  // Actions
  switchOrganization: (organizationId: string) => Promise<void>
  refreshOrganizations: () => Promise<void>
  
  // Utility functions
  canPerformAction: (action: 'create' | 'update' | 'delete' | 'manage_users') => boolean
  hasRole: (requiredRole: UserRole | UserRole[]) => boolean
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined)

/**
 * Custom hook to access organization context
 * Must be used within OrganizationProvider
 */
export function useOrganization() {
  const context = useContext(OrganizationContext)
  if (context === undefined) {
    throw new Error('useOrganization must be used within an OrganizationProvider')
  }
  return context
}

/**
 * Organization Provider Component
 * Wraps the app to provide organization context to all children
 */
interface OrganizationProviderProps {
  children: ReactNode
}

export function OrganizationProvider({ children }: OrganizationProviderProps) {
  const { user, isLoaded: userLoaded } = useUser()
  const supabase = useSupabase()
  
  // State management
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null)
  const [userOrganizations, setUserOrganizations] = useState<OrganizationMembership[]>([])
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Load user's organizations from Supabase
   */
  const loadUserOrganizations = async () => {
    if (!user?.id) {
      setIsLoading(false)
      return
    }

    try {
      setIsLoading(true)
      setIsError(false)
      setError(null)

      const orgService = createOrganizationService(supabase)
      
      // Fetch all organizations user has access to
      const organizations = await orgService.getUserOrganizations(user.id)
      
      // Transform to membership format
      const memberships: OrganizationMembership[] = organizations.map(org => ({
        organization: {
          id: org.id,
          name: org.name,
          slug: org.slug,
          status: org.status,
          settings: org.settings,
          subscription_id: org.subscription_id,
          trial_ends_at: org.trial_ends_at,
          created_at: org.created_at,
          updated_at: org.updated_at
        },
        role: org.role,
        joinedAt: org.joinedAt,
        isActive: true
      }))
      
      setUserOrganizations(memberships)
      
      // Check for active organization from Clerk metadata
      const activeOrgId = user.publicMetadata?.activeOrgId as string | undefined
      
      if (activeOrgId && memberships.length > 0) {
        const activeMembership = memberships.find(m => m.organization.id === activeOrgId)
        if (activeMembership) {
          setActiveOrganization(activeMembership.organization)
          setUserRole(activeMembership.role)
        } else if (memberships.length > 0) {
          // Fallback to first organization if metadata org not found
          setActiveOrganization(memberships[0].organization)
          setUserRole(memberships[0].role)
        }
      } else if (memberships.length > 0) {
        // Set first organization as active if none is set
        setActiveOrganization(memberships[0].organization)
        setUserRole(memberships[0].role)
      }
      
    } catch (err) {
      console.error('Failed to load organizations:', err)
      setIsError(true)
      setError(err instanceof Error ? err : new Error('Failed to load organizations'))
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Switch to a different organization
   */
  const switchOrganization = async (organizationId: string) => {
    const membership = userOrganizations.find(
      m => m.organization.id === organizationId
    )
    
    if (!membership) {
      throw new Error('Organization not found or access denied')
    }
    
    if (!membership.isActive) {
      throw new Error('Organization membership is inactive')
    }
    
    try {
      // Call API to update user's active organization
      const response = await fetch('/api/organizations/switch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ organizationId })
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to switch organization')
      }

      // Update local state
      setActiveOrganization(membership.organization)
      setUserRole(membership.role)
      
      // Persist to localStorage
      localStorage.setItem('activeOrganizationId', organizationId)
      
      // Reload the page to update all data with new org context
      window.location.reload()
    } catch (err) {
      console.error('Failed to switch organization:', err)
      throw err
    }
  }

  /**
   * Check if user can perform a specific action based on their role
   */
  const canPerformAction = (action: 'create' | 'update' | 'delete' | 'manage_users'): boolean => {
    if (!userRole) return false
    
    const rolePermissions = {
      admin: ['create', 'update', 'delete', 'manage_users'],
      manager: ['create', 'update', 'delete'],
      operator: ['create', 'update']
    }
    
    return rolePermissions[userRole]?.includes(action) ?? false
  }

  /**
   * Check if user has a specific role or one of the specified roles
   */
  const hasRole = (requiredRole: UserRole | UserRole[]): boolean => {
    if (!userRole) return false
    
    const requiredRoles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
    return requiredRoles.includes(userRole)
  }

  /**
   * Load organizations when user is available
   */
  useEffect(() => {
    if (userLoaded && user) {
      loadUserOrganizations()
    } else if (userLoaded && !user) {
      // User is not authenticated, reset state
      setActiveOrganization(null)
      setUserOrganizations([])
      setUserRole(null)
      setIsLoading(false)
    }
  }, [userLoaded, user])

  const contextValue: OrganizationContextType = {
    activeOrganization,
    userOrganizations,
    userRole,
    isLoading,
    isError,
    error,
    switchOrganization,
    refreshOrganizations: loadUserOrganizations,
    canPerformAction,
    hasRole
  }

  return (
    <OrganizationContext.Provider value={contextValue}>
      {children}
    </OrganizationContext.Provider>
  )
}

/**
 * Higher-order component to require organization context
 * Displays loading state while organizations are being fetched
 */
export function withOrganization<T extends object>(
  Component: React.ComponentType<T>
) {
  return function WithOrganizationComponent(props: T) {
    const { activeOrganization, isLoading, isError, error } = useOrganization()
    
    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-gray-600">Loading organization...</p>
          </div>
        </div>
      )
    }
    
    if (isError || !activeOrganization) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4 max-w-md">
            <div className="text-red-600 text-xl">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-900">
              Organization Not Available
            </h2>
            <p className="text-gray-600">
              {error?.message || 'Unable to load organization data. Please try refreshing the page.'}
            </p>
          </div>
        </div>
      )
    }
    
    return <Component {...props} />
  }
}