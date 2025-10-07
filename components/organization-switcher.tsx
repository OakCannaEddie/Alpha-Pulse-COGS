/**
 * Organization Switcher Component
 * 
 * Provides a dropdown interface for users to switch between organizations
 * they have access to. Displays the current organization and allows selection
 * of different organizations with proper role indication.
 * 
 * Features:
 * - Current organization display
 * - Dropdown list of available organizations
 * - Role badges for each organization
 * - Smooth switching with loading states
 * - Responsive design for mobile/desktop
 * 
 * @component OrganizationSwitcher
 */
'use client'

import React, { useState } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { 
  Building2, 
  Check, 
  ChevronDown, 
  Crown, 
  Shield, 
  User,
  Plus
} from 'lucide-react'
import { cn } from '@/lib/utils'

/**
 * Role icon mapping for visual indication
 */
const roleIcons = {
  admin: Crown,
  manager: Shield,
  operator: User
} as const

/**
 * Role color mapping for badges
 */
const roleColors = {
  admin: 'bg-purple-100 text-purple-800 border-purple-200',
  manager: 'bg-blue-100 text-blue-800 border-blue-200',
  operator: 'bg-green-100 text-green-800 border-green-200'
} as const

interface OrganizationSwitcherProps {
  className?: string
  variant?: 'default' | 'minimal'
}

export default function OrganizationSwitcher({ 
  className,
  variant = 'default'
}: OrganizationSwitcherProps) {
  const {
    activeOrganization,
    userOrganizations,
    userRole,
    switchOrganization,
    isLoading
  } = useOrganization()

  const [isSwitching, setIsSwitching] = useState(false)

  /**
   * Handle organization switch with loading state
   */
  const handleOrganizationSwitch = async (organizationId: string) => {
    if (organizationId === activeOrganization?.id) return
    
    try {
      setIsSwitching(true)
      await switchOrganization(organizationId)
    } catch (error) {
      console.error('Failed to switch organization:', error)
      // TODO: Show toast notification for error
    } finally {
      setIsSwitching(false)
    }
  }

  // Don't render if no organizations or still loading
  if (isLoading || !activeOrganization || userOrganizations.length === 0) {
    return null
  }

  // Minimal variant for mobile or compact layouts
  if (variant === 'minimal') {
    return (
      <Select
        value={activeOrganization.id}
        onValueChange={handleOrganizationSwitch}
        disabled={isSwitching}
      >
        <SelectTrigger className={cn("w-full", className)}>
          <SelectValue>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span className="truncate">{activeOrganization.name}</span>
            </div>
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {userOrganizations.map((membership) => {
            const RoleIcon = roleIcons[membership.role]
            const isActive = membership.organization.id === activeOrganization.id
            
            return (
              <SelectItem
                key={membership.organization.id}
                value={membership.organization.id}
                disabled={!membership.isActive}
              >
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center gap-2">
                    <RoleIcon className="h-4 w-4 text-gray-500" />
                    <span>{membership.organization.name}</span>
                  </div>
                  {isActive && <Check className="h-4 w-4 text-green-600" />}
                </div>
              </SelectItem>
            )
          })}
        </SelectContent>
      </Select>
    )
  }

  // Default variant with full dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-between",
            isSwitching && "opacity-50 cursor-not-allowed",
            className
          )}
          disabled={isSwitching}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 flex-shrink-0" />
            <span className="truncate">{activeOrganization.name}</span>
            {userRole && (
              <Badge 
                variant="outline" 
                className={cn("text-xs", roleColors[userRole])}
              >
                {userRole}
              </Badge>
            )}
          </div>
          <ChevronDown className="h-4 w-4 flex-shrink-0" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="start" className="w-80">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Building2 className="h-4 w-4" />
          Switch Organization
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        {userOrganizations.map((membership) => {
          const RoleIcon = roleIcons[membership.role]
          const isActive = membership.organization.id === activeOrganization.id
          const isInactive = !membership.isActive
          
          return (
            <DropdownMenuItem
              key={membership.organization.id}
              onClick={() => handleOrganizationSwitch(membership.organization.id)}
              disabled={isInactive || isSwitching}
              className={cn(
                "flex items-center justify-between p-3 cursor-pointer",
                isActive && "bg-blue-50 border-l-2 border-l-blue-500",
                isInactive && "opacity-50 cursor-not-allowed"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex-shrink-0">
                  <RoleIcon className={cn(
                    "h-4 w-4",
                    isActive ? "text-blue-600" : "text-gray-500"
                  )} />
                </div>
                
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "font-medium truncate",
                      isActive ? "text-blue-900" : "text-gray-900"
                    )}>
                      {membership.organization.name}
                    </span>
                    {isActive && (
                      <Check className="h-4 w-4 text-blue-600 flex-shrink-0" />
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 mt-1">
                    <Badge 
                      variant="outline" 
                      className={cn("text-xs", roleColors[membership.role])}
                    >
                      {membership.role}
                    </Badge>
                    
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        membership.organization.status === 'active' 
                          ? "bg-green-100 text-green-800 border-green-200"
                          : membership.organization.status === 'trial'
                          ? "bg-yellow-100 text-yellow-800 border-yellow-200"
                          : "bg-red-100 text-red-800 border-red-200"
                      )}
                    >
                      {membership.organization.status}
                    </Badge>
                  </div>
                </div>
              </div>
            </DropdownMenuItem>
          )
        })}
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center gap-2 p-3 cursor-pointer">
          <Plus className="h-4 w-4" />
          <span>Create Organization</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Compact organization display for headers/navigation
 * Shows just the organization name with optional role badge
 */
export function OrganizationDisplay({ 
  showRole = false,
  className 
}: { 
  showRole?: boolean
  className?: string 
}) {
  const { activeOrganization, userRole } = useOrganization()
  
  if (!activeOrganization) {
    return (
      <div className={cn("flex items-center gap-2 text-gray-500", className)}>
        <Building2 className="h-4 w-4" />
        <span className="text-sm">No organization</span>
      </div>
    )
  }
  
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Building2 className="h-4 w-4 text-gray-600" />
      <span className="text-sm font-medium text-gray-900 truncate">
        {activeOrganization.name}
      </span>
      {showRole && userRole && (
        <Badge 
          variant="outline" 
          className={cn("text-xs", roleColors[userRole])}
        >
          {userRole}
        </Badge>
      )}
    </div>
  )
}