/**
 * Production Management Page - Coming Soon
 * 
 * This page will handle:
 * - Production run creation and tracking
 * - Bill of Materials (BOM) management
 * - Cost calculation and COGS tracking
 * - Material consumption recording
 * 
 * @route /production
 * @protected Requires authentication
 */
'use client'

import PageLayout from '@/components/page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Factory, Plus } from 'lucide-react'

export default function ProductionPage() {
  return (
    <PageLayout
      title="Production Management"
      subtitle="Track production runs and manage BOMs"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Production' }
      ]}
      primaryAction={{
        label: 'New Production Run',
        onClick: () => console.log('Create production run'),
        icon: <Plus className="h-4 w-4" />
      }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Factory className="h-6 w-6 text-green-500" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
            <CardDescription>
              Production management features are currently under development
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-gray-600">
                This section will include:
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
                <li>Production run creation and tracking</li>
                <li>Bill of Materials (BOM) creation and versioning</li>
                <li>Material consumption recording by lot</li>
                <li>Labor and overhead cost tracking</li>
                <li>Real-time COGS calculation</li>
                <li>Production efficiency reporting</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </PageLayout>
  )
}