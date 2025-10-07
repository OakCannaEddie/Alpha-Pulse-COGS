/**
 * Dashboard Page - Main entry point after authentication
 * 
 * This page serves as the central hub for the manufacturing ERP system.
 * Features:
 * - Welcome message and overview cards
 * - Quick navigation to major sections
 * - Key metrics and alerts (placeholder for now)
 * - Organization context validation
 * 
 * @route /dashboard
 * @protected Requires authentication via Clerk
 */
import { Suspense } from 'react'
import { currentUser } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import PageLayout from '@/components/page-layout'
import DashboardContent from './dashboard-content'

export default async function DashboardPage() {
  // Server-side authentication check
  const user = await currentUser()
  
  if (!user) {
    redirect('/sign-in')
  }

  return (
    <PageLayout
      title="Dashboard"
      subtitle="Manufacturing operations overview and quick actions"
      breadcrumbs={[
        { label: 'Dashboard' }
      ]}
    >
      <Suspense fallback={<DashboardContentSkeleton />}>
        <DashboardContent />
      </Suspense>
    </PageLayout>
  )
}

/**
 * Loading skeleton for dashboard content
 * Matches the layout structure while content loads
 */
function DashboardContentSkeleton() {
  return (
    <div className="space-y-6">
      {/* Cards skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-6 rounded-lg shadow border">
            <div className="space-y-3">
              <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 w-16 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
        ))}
      </div>
      
      {/* Content skeleton */}
      <div className="bg-white p-6 rounded-lg shadow border">
        <div className="space-y-4">
          <div className="h-6 w-48 bg-gray-200 rounded animate-pulse" />
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 w-full bg-gray-200 rounded animate-pulse" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}