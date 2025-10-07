/**
 * Sidebar Navigation Component
 * 
 * Main navigation sidebar for the application with collapsible design
 * and role-based menu items. Supports both expanded and collapsed states
 * with smooth transitions and proper accessibility.
 * 
 * Features:
 * - Collapsible sidebar with icon-only mode
 * - Role-based navigation items
 * - Active route highlighting
 * - Organization context integration
 * - Responsive design
 * 
 * @component SidebarNav
 */
'use client'

import React, { ReactNode } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
// import { Separator } from '@/components/ui/separator' // Reserved for future section dividers
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import OrganizationSwitcher from '@/components/organization-switcher'
import { 
  LayoutDashboard,
  Package,
  Factory,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  ChevronLeft,
  ChevronRight,
  Building2
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  requiredRoles?: Array<'admin' | 'manager' | 'operator'>
  subItems?: Array<{
    label: string
    href: string
    description?: string
  }>
}

/**
 * Navigation menu structure
 * Items are ordered by most commonly used features first
 */
const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    description: 'Overview and quick actions'
  },
  {
    label: 'Inventory',
    href: '/inventory',
    icon: Package,
    description: 'Raw materials and finished goods',
    badge: 'Core'
  },
  {
    label: 'Production',
    href: '/production',
    icon: Factory,
    description: 'Production runs and BOMs',
    badge: 'Active'
  },
  {
    label: 'Purchase Orders',
    href: '/purchase-orders',
    icon: TrendingUp,
    description: 'Supplier orders and receiving',
    badge: 'New'
  },
  {
    label: 'Suppliers',
    href: '/suppliers',
    icon: Users,
    description: 'Supplier management and contacts'
  },
  {
    label: 'Reports',
    href: '/reports',
    icon: BarChart3,
    description: 'Analytics and insights',
    requiredRoles: ['admin', 'manager']
  },
  {
    label: 'Settings',
    href: '/settings',
    icon: Settings,
    description: 'Organization and user settings',
    requiredRoles: ['admin', 'manager']
  }
]

interface SidebarNavProps {
  collapsed?: boolean
  onToggleCollapse?: () => void
  extraContent?: ReactNode
}

export function SidebarNav({ 
  collapsed = false, 
  onToggleCollapse,
  extraContent 
}: SidebarNavProps) {
  const pathname = usePathname()
  const { activeOrganization, userRole, hasRole } = useOrganization()

  /**
   * Check if a navigation item should be visible based on user role
   */
  const isItemVisible = (item: NavigationItem): boolean => {
    if (!item.requiredRoles) return true
    return hasRole(item.requiredRoles)
  }

  /**
   * Check if a route is currently active
   */
  const isActiveRoute = (href: string): boolean => {
    if (href === '/dashboard') {
      return pathname === '/dashboard'
    }
    return pathname.startsWith(href)
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col h-full bg-white border-r border-gray-200">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          {collapsed ? (
            <div className="flex items-center justify-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Building2 className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Logo/Brand */}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <h1 className="font-bold text-lg text-gray-900">Pulse COGS</h1>
                  <p className="text-xs text-gray-500">Manufacturing ERP</p>
                </div>
              </div>
              
              {/* Organization switcher */}
              {activeOrganization && (
                <OrganizationSwitcher variant="minimal" />
              )}
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
          {NAVIGATION_ITEMS.filter(isItemVisible).map((item) => {
            const IconComponent = item.icon
            const isActive = isActiveRoute(item.href)
            
            const navigationButton = (
              <Button
                variant={isActive ? 'default' : 'ghost'}
                className={cn(
                  "w-full justify-start h-10",
                  collapsed ? "px-2" : "px-3",
                  isActive && "bg-blue-600 text-white hover:bg-blue-700"
                )}
                asChild
              >
                <Link href={item.href}>
                  <IconComponent className={cn(
                    "h-5 w-5 flex-shrink-0",
                    collapsed ? "mx-auto" : "mr-3"
                  )} />
                  
                  {!collapsed && (
                    <>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.badge && (
                        <Badge 
                          variant={isActive ? 'secondary' : 'outline'} 
                          className="text-xs ml-auto"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              </Button>
            )

            // Wrap in tooltip when collapsed
            if (collapsed) {
              return (
                <Tooltip key={item.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    {navigationButton}
                  </TooltipTrigger>
                  <TooltipContent side="right" className="flex flex-col gap-1">
                    <span className="font-medium">{item.label}</span>
                    {item.description && (
                      <span className="text-xs text-gray-500">{item.description}</span>
                    )}
                    {item.badge && (
                      <Badge variant="outline" className="text-xs w-fit">
                        {item.badge}
                      </Badge>
                    )}
                  </TooltipContent>
                </Tooltip>
              )
            }

            return (
              <div key={item.href}>
                {navigationButton}
              </div>
            )
          })}
        </nav>

        {/* Extra content */}
        {extraContent && !collapsed && (
          <div className="p-4 border-t border-gray-200">
            {extraContent}
          </div>
        )}

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          {!collapsed && (
            <div className="space-y-3">
              {/* Quick stats */}
              {activeOrganization && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Organization</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        activeOrganization.status === 'active' 
                          ? "border-green-200 text-green-700"
                          : activeOrganization.status === 'trial'
                          ? "border-yellow-200 text-yellow-700"
                          : "border-red-200 text-red-700"
                      )}
                    >
                      {activeOrganization.status}
                    </Badge>
                  </div>
                  
                  {userRole && (
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>Your role</span>
                      <Badge variant="outline" className="text-xs">
                        {userRole}
                      </Badge>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Collapse toggle */}
          <div className="flex justify-end mt-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggleCollapse}
              className="h-8 w-8 p-0"
            >
              {collapsed ? (
                <ChevronRight className="h-4 w-4" />
              ) : (
                <ChevronLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </div>
    </TooltipProvider>
  )
}

/**
 * Sidebar navigation item component for custom menu items
 */
export function SidebarNavItem({
  href,
  icon: IconComponent,
  label,
  badge,
  isActive = false,
  collapsed = false,
  description
}: {
  href: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  badge?: string
  isActive?: boolean
  collapsed?: boolean
  description?: string
}) {
  const navigationButton = (
    <Button
      variant={isActive ? 'default' : 'ghost'}
      className={cn(
        "w-full justify-start h-10",
        collapsed ? "px-2" : "px-3",
        isActive && "bg-blue-600 text-white hover:bg-blue-700"
      )}
      asChild
    >
      <Link href={href}>
        <IconComponent className={cn(
          "h-5 w-5 flex-shrink-0",
          collapsed ? "mx-auto" : "mr-3"
        )} />
        
        {!collapsed && (
          <>
            <span className="flex-1 text-left">{label}</span>
            {badge && (
              <Badge 
                variant={isActive ? 'secondary' : 'outline'} 
                className="text-xs ml-auto"
              >
                {badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    </Button>
  )

  if (collapsed && description) {
    return (
      <Tooltip delayDuration={0}>
        <TooltipTrigger asChild>
          {navigationButton}
        </TooltipTrigger>
        <TooltipContent side="right">
          <div className="flex flex-col gap-1">
            <span className="font-medium">{label}</span>
            <span className="text-xs text-gray-500">{description}</span>
          </div>
        </TooltipContent>
      </Tooltip>
    )
  }

  return navigationButton
}