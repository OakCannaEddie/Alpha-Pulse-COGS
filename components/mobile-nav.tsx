/**
 * Mobile Navigation Component
 * 
 * Slide-out mobile navigation drawer for smaller screens.
 * Provides the same navigation items as the sidebar in a 
 * mobile-optimized format with touch-friendly interactions.
 * 
 * Features:
 * - Slide-out drawer animation
 * - Touch-friendly navigation items
 * - Organization context display
 * - User profile integration
 * - Overlay backdrop
 * 
 * @component MobileNav
 */
'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useOrganization } from '@/hooks/use-organization'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import OrganizationSwitcher from '@/components/organization-switcher'
import { 
  LayoutDashboard,
  Package,
  Factory,
  Users,
  TrendingUp,
  BarChart3,
  Settings,
  Building2,
  X
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface NavigationItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  badge?: string
  description?: string
  requiredRoles?: Array<'admin' | 'manager' | 'operator'>
}

/**
 * Navigation menu structure - same as sidebar
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

interface MobileNavProps {
  isOpen: boolean
  onClose: () => void
}

export function MobileNav({ isOpen, onClose }: MobileNavProps) {
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

  /**
   * Handle navigation item click - close menu after navigation
   */
  const handleNavItemClick = () => {
    onClose()
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="left" className="w-80 p-0">
        <div className="flex flex-col h-full">
          {/* Header */}
          <SheetHeader className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <SheetTitle className="text-lg font-bold text-gray-900">
                    Pulse COGS
                  </SheetTitle>
                  <p className="text-sm text-gray-500">Manufacturing ERP</p>
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {/* Organization switcher */}
            {activeOrganization && (
              <div className="mt-4">
                <OrganizationSwitcher />
              </div>
            )}
          </SheetHeader>

          {/* Navigation */}
          <ScrollArea className="flex-1 px-6 py-4">
            <nav className="space-y-2">
              {NAVIGATION_ITEMS.filter(isItemVisible).map((item) => {
                const IconComponent = item.icon
                const isActive = isActiveRoute(item.href)
                
                return (
                  <Button
                    key={item.href}
                    variant={isActive ? 'default' : 'ghost'}
                    className={cn(
                      "w-full justify-start h-12 text-left",
                      isActive && "bg-blue-600 text-white hover:bg-blue-700"
                    )}
                    asChild
                    onClick={handleNavItemClick}
                  >
                    <Link href={item.href}>
                      <IconComponent className="h-5 w-5 mr-3 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{item.label}</span>
                          {item.badge && (
                            <Badge 
                              variant={isActive ? 'secondary' : 'outline'} 
                              className="text-xs"
                            >
                              {item.badge}
                            </Badge>
                          )}
                        </div>
                        {item.description && (
                          <p className="text-xs text-left opacity-75 mt-0.5">
                            {item.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  </Button>
                )
              })}
            </nav>
          </ScrollArea>

          {/* Footer */}
          {activeOrganization && (
            <div className="p-6 border-t border-gray-200 space-y-4">
              <div className="space-y-3">
                <h4 className="font-medium text-sm text-gray-900">
                  Organization Status
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status</span>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "text-xs",
                        activeOrganization.status === 'active' 
                          ? "border-green-200 text-green-700 bg-green-50"
                          : activeOrganization.status === 'trial'
                          ? "border-yellow-200 text-yellow-700 bg-yellow-50"
                          : "border-red-200 text-red-700 bg-red-50"
                      )}
                    >
                      {activeOrganization.status}
                    </Badge>
                  </div>
                  
                  {userRole && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Your role</span>
                      <Badge variant="outline" className="text-xs">
                        {userRole}
                      </Badge>
                    </div>
                  )}
                </div>
              </div>
              
              <Separator />
              
              <div className="text-center">
                <p className="text-xs text-gray-500">
                  {activeOrganization.name}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Pulse COGS v1.0.0
                </p>
              </div>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Simple mobile navigation trigger button
 * Can be used independently of the main MobileNav component
 */
export function MobileNavTrigger({ onClick }: { onClick: () => void }) {
  return (
    <Button
      variant="ghost"
      size="sm"
      className="lg:hidden"
      onClick={onClick}
    >
      <span className="sr-only">Open navigation menu</span>
      <svg
        className="h-5 w-5"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path d="M4 6h16M4 12h16M4 18h16" />
      </svg>
    </Button>
  )
}