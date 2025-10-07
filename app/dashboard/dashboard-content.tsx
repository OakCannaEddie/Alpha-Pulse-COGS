/**
 * Dashboard Content - Client-side interactive dashboard components
 * 
 * This component handles the interactive parts of the dashboard that require
 * client-side rendering, including organization switching and real-time updates.
 * 
 * @component DashboardContent
 */
'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useOrganization } from '@/hooks/use-organization'
import { 
  Package, 
  Factory, 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Plus,
  ArrowRight 
} from 'lucide-react'
import Link from 'next/link'

/**
 * Quick action cards for navigation to main features
 * Each card represents a major section of the application
 */
const QUICK_ACTIONS = [
  {
    title: 'Inventory',
    description: 'Manage raw materials and finished goods',
    icon: Package,
    href: '/inventory',
    color: 'bg-blue-500',
    badge: 'Core'
  },
  {
    title: 'Production',
    description: 'Track production runs and BOMs',
    icon: Factory,
    href: '/production',
    color: 'bg-green-500',
    badge: 'Active'
  },
  {
    title: 'Purchase Orders',
    description: 'Manage supplier orders and receiving',
    icon: TrendingUp,
    href: '/purchase-orders',
    color: 'bg-purple-500',
    badge: 'New'
  },
  {
    title: 'Suppliers',
    description: 'Supplier relationships and contacts',
    icon: Users,
    href: '/suppliers',
    color: 'bg-orange-500',
    badge: 'Basic'
  }
] as const

export default function DashboardContent() {
  const [, setCurrentTime] = useState(new Date())
  const { } = useOrganization()

  // Update time every minute for live clock (currently not displayed, reserved for future header)
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000)
    
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-8">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Raw materials and finished goods
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Runs</CardTitle>
            <Factory className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Production runs in progress
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Purchase orders to receive
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">
              Items below reorder point
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>
            Jump to the most common tasks and sections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {QUICK_ACTIONS.map((action) => {
              const IconComponent = action.icon
              return (
                <Link key={action.title} href={action.href}>
                  <div className="group relative p-4 rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-md transition-all cursor-pointer">
                    <div className="flex items-start justify-between mb-3">
                      <div className={`p-2 rounded-lg ${action.color} text-white`}>
                        <IconComponent className="h-5 w-5" />
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {action.badge}
                      </Badge>
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 mb-1">
                      {action.title}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">
                      {action.description}
                    </p>
                    
                    <div className="flex items-center text-sm text-gray-500 group-hover:text-gray-700">
                      <span>Get started</span>
                      <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </Link>
              )
            })}
          </div>
        </CardContent>
      </Card>

      {/* Getting Started Section */}
      <Card>
        <CardHeader>
          <CardTitle>Getting Started</CardTitle>
          <CardDescription>
            Set up your manufacturing workspace in a few simple steps
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">1. Set up your organization</h4>
                <p className="text-sm text-gray-600">Configure your company details and settings</p>
              </div>
              <Button variant="outline" size="sm">
                Configure
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">2. Add your first inventory items</h4>
                <p className="text-sm text-gray-600">Import or manually add raw materials and products</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/inventory">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Items
                </Link>
              </Button>
            </div>
            
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div>
                <h4 className="font-medium text-gray-900">3. Create your first BOM</h4>
                <p className="text-sm text-gray-600">Define how your products are made</p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/production">
                  Create BOM
                </Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}