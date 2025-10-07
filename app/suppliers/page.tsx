/**
 * Suppliers Page - Coming Soon
 * 
 * This page will handle:
 * - Supplier contact management
 * - Supplier performance tracking
 * - Material sourcing information
 * - Communication history
 * 
 * @route /suppliers
 * @protected Requires authentication
 */
'use client'

import PageLayout from '@/components/page-layout'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, Plus } from 'lucide-react'

export default function SuppliersPage() {
  return (
    <PageLayout
      title="Suppliers"
      subtitle="Manage supplier relationships and contacts"
      breadcrumbs={[
        { label: 'Dashboard', href: '/dashboard' },
        { label: 'Suppliers' }
      ]}
      primaryAction={{
        label: 'Add Supplier',
        onClick: () => console.log('Add supplier'),
        icon: <Plus className="h-4 w-4" />
      }}
    >
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Users className="h-6 w-6 text-orange-500" />
            <CardTitle>Coming Soon</CardTitle>
          </div>
          <CardDescription>
            Supplier management features are currently under development
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-gray-600">
              This section will include:
            </p>
            <ul className="list-disc list-inside space-y-2 text-sm text-gray-600">
              <li>Supplier contact information and details</li>
              <li>Material sourcing and availability</li>
              <li>Performance metrics and ratings</li>
              <li>Communication history and notes</li>
              <li>Payment terms and contract management</li>
              <li>Supplier comparison and selection tools</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </PageLayout>
  )
}