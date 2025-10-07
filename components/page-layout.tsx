/**
 * Page Layout Component
 * 
 * Provides consistent page structure for all internal application pages.
 * Includes navigation sidebar, header, and main content area with proper
 * responsive design and loading states.
 * 
 * Features:
 * - Responsive sidebar navigation
 * - Page title and subtitle support
 * - Primary action button placement
 * - Loading and error states
 * - Breadcrumb navigation support
 * - Organization context integration
 * 
 * @component PageLayout
 */
'use client'

import React, { ReactNode } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import { SidebarNav } from '@/components/sidebar-nav'
import { MobileNav } from '@/components/mobile-nav'
import { Button } from '@/components/ui/button'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import OrganizationSwitcher from '@/components/organization-switcher'
import { UserButton } from '@clerk/nextjs'
import { Menu, Bell } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

interface BreadcrumbItem {
  label: string
  href?: string
}

interface PageLayoutProps {
  title: string
  subtitle?: string
  children: ReactNode
  
  // Header actions
  primaryAction?: {
    label: string
    onClick: () => void
    variant?: 'default' | 'outline' | 'destructive'
    icon?: ReactNode
  }
  
  // Navigation
  breadcrumbs?: BreadcrumbItem[]
  
  // Layout options
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  padding?: 'none' | 'sm' | 'md' | 'lg'
  
  // States
  isLoading?: boolean
  error?: Error | null
  
  // Custom content
  headerContent?: ReactNode
  sidebarContent?: ReactNode
}

export default function PageLayout({
  title,
  subtitle,
  children,
  primaryAction,
  breadcrumbs,
  maxWidth = '2xl',
  padding = 'lg',
  isLoading = false,
  error = null,
  headerContent,
  sidebarContent
}: PageLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { activeOrganization, userRole } = useOrganization()

  // Max width classes mapping
  const maxWidthClasses = {
    sm: 'max-w-3xl',
    md: 'max-w-5xl',
    lg: 'max-w-6xl',
    xl: 'max-w-7xl',
    '2xl': 'max-w-[1400px]',
    full: 'max-w-none'
  }

  // Padding classes mapping
  const paddingClasses = {
    none: '',
    sm: 'px-4 py-4',
    md: 'px-6 py-6',
    lg: 'px-6 py-8'
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="text-red-600 text-2xl">⚠️</div>
          <h2 className="text-xl font-semibold text-gray-900">Something went wrong</h2>
          <p className="text-gray-600">{error.message}</p>
          <Button onClick={() => window.location.reload()}>
            Try Again
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile menu overlay */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Desktop: Flex container for sidebar + content side-by-side */}
      <div className="lg:flex">
        {/* Sidebar */}
        <div className={cn(
          "fixed inset-y-0 left-0 w-64 bg-white border-r border-gray-200 transform transition-transform duration-200 ease-in-out z-50",
          // Mobile: slide in/out, Desktop: always visible and in flex flow
          "lg:translate-x-0 lg:static lg:inset-0 lg:z-auto lg:flex-shrink-0",
          mobileMenuOpen ? "translate-x-0" : "-translate-x-full",
          sidebarCollapsed ? "lg:w-16" : "lg:w-64"
        )}>
          <SidebarNav 
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            extraContent={sidebarContent}
          />
        </div>

        {/* Main content area - takes remaining space in flex container */}
        <div className="flex flex-col min-h-screen flex-1">
          {/* Top header */}
          <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
          <div className="flex items-center justify-between h-16 px-4 lg:px-6">
            {/* Left side - Mobile menu + breadcrumbs */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setMobileMenuOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              {breadcrumbs && breadcrumbs.length > 0 && (
                <Breadcrumb className="hidden sm:block">
                  <BreadcrumbList>
                    {breadcrumbs.map((crumb, index) => (
                      <React.Fragment key={index}>
                        <BreadcrumbItem>
                          {crumb.href ? (
                            <BreadcrumbLink href={crumb.href}>
                              {crumb.label}
                            </BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {index < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}
            </div>

            {/* Right side - Organization + User */}
            <div className="flex items-center gap-4">
              {/* Notifications (placeholder) */}
              <Button variant="ghost" size="sm" className="hidden md:flex">
                <Bell className="h-4 w-4" />
              </Button>
              
              {/* Organization switcher */}
              <div className="hidden md:block min-w-[200px]">
                <OrganizationSwitcher variant="minimal" />
              </div>
              
              {/* User menu */}
              <UserButton afterSignOutUrl="/" />
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1">
          <div className={cn(
            "mx-auto",
            maxWidthClasses[maxWidth],
            paddingClasses[padding]
          )}>
            {/* Page header */}
            <div className="space-y-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-1">
                  {isLoading ? (
                    <>
                      <Skeleton className="h-8 w-64" />
                      <Skeleton className="h-4 w-96" />
                    </>
                  ) : (
                    <>
                      <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                        {title}
                      </h1>
                      {subtitle && (
                        <p className="text-gray-600">{subtitle}</p>
                      )}
                      
                      {/* Organization context */}
                      {activeOrganization && (
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <span>{activeOrganization.name}</span>
                          {userRole && (
                            <Badge variant="outline" className="text-xs">
                              {userRole}
                            </Badge>
                          )}
                        </div>
                      )}
                    </>
                  )}
                </div>
                
                {/* Primary action */}
                {primaryAction && !isLoading && (
                  <Button
                    variant={primaryAction.variant || 'default'}
                    onClick={primaryAction.onClick}
                    className="flex items-center gap-2"
                  >
                    {primaryAction.icon}
                    {primaryAction.label}
                  </Button>
                )}
              </div>
              
              {/* Custom header content */}
              {headerContent && !isLoading && (
                <div>{headerContent}</div>
              )}
            </div>

            {/* Main content */}
            <div className="mt-8">
              {isLoading ? (
                <PageContentSkeleton />
              ) : (
                children
              )}
            </div>
          </div>
        </main>
      </div>

      {/* End of Desktop flex container */}
      </div>

      {/* Mobile navigation */}
      <MobileNav 
        isOpen={mobileMenuOpen} 
        onClose={() => setMobileMenuOpen(false)} 
      />
    </div>
  )
}

/**
 * Loading skeleton for page content
 */
function PageContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow border space-y-3">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-full" />
          </div>
        ))}
      </div>
      
      {/* Table skeleton */}
      <div className="bg-white rounded-lg shadow border">
        <div className="p-6 space-y-4">
          <Skeleton className="h-6 w-48" />
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}