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
import { Database } from '@/types/database.types'

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
  
  // State management
  const [activeOrganization, setActiveOrganization] = useState<Organization | null>(null)
  const [userOrganizations, setUserOrganizations] = useState<OrganizationMembership[]>([])
  const [userRole, setUserRole] = useState<UserRole | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isError, setIsError] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  /**
   * Load user's organizations and active organization from API
   * This will be replaced with actual Supabase calls once we have the service layer
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

      // TODO: Replace with actual API calls to Supabase
      // For now, using mock data to establish the structure
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // Mock organization data - will be replaced with real API calls
      const mockOrganizations: OrganizationMembership[] = [
        {
          organization: {
            id: 'org-1',
            name: 'Acme Manufacturing',
            slug: 'acme-mfg',
            status: 'active' as const,
            settings: {},
            subscription_id: null,
            trial_ends_at: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          role: 'admin' as const,
          joinedAt: new Date().toISOString(),
          isActive: true
        }
      ]
      
      setUserOrganizations(mockOrganizations)
      
      // Set the first organization as active if none is set
      if (mockOrganizations.length > 0 && !activeOrganization) {
        const firstOrg = mockOrganizations[0]
        setActiveOrganization(firstOrg.organization)
        setUserRole(firstOrg.role)
        
        // Store in localStorage for persistence
        localStorage.setItem('activeOrganizationId', firstOrg.organization.id)
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
    
    setActiveOrganization(membership.organization)
    setUserRole(membership.role)
    
    // Persist to localStorage
    localStorage.setItem('activeOrganizationId', organizationId)
    
    // TODO: Update user profile in database with new active organization
    // This will be implemented when we have the user profile service
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

  /**
   * Restore active organization from localStorage on mount
   */
  useEffect(() => {
    if (userOrganizations.length > 0 && !activeOrganization) {
      const savedOrgId = localStorage.getItem('activeOrganizationId')
      if (savedOrgId) {
        const savedMembership = userOrganizations.find(
          m => m.organization.id === savedOrgId
        )
        if (savedMembership && savedMembership.isActive) {
          setActiveOrganization(savedMembership.organization)
          setUserRole(savedMembership.role)
        }
      }
    }
  }, [userOrganizations])

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