/**
 * Organization Onboarding Page
 * 
 * Handles new user onboarding flow for users who don't have
 * any organization memberships yet. Allows them to create
 * a new organization or wait for an invitation.
 * 
 * @route /onboarding
 * @protected Requires authentication
 */
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Building2, UserPlus, ArrowRight } from 'lucide-react'

export default function OnboardingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center">
            <div className="p-3 bg-blue-100 rounded-full">
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome to Pulse COGS
          </h1>
          <p className="text-gray-600 max-w-md mx-auto">
            To get started, you&apos;ll need to create an organization or join an existing one.
          </p>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Create Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Create Organization
              </CardTitle>
              <CardDescription>
                Set up a new organization for your manufacturing company
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="orgName">Organization Name</Label>
                <Input 
                  id="orgName"
                  placeholder="e.g., Acme Manufacturing"
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="orgSlug">URL Slug</Label>
                <Input 
                  id="orgSlug"
                  placeholder="e.g., acme-mfg"
                  className="w-full"
                />
                <p className="text-xs text-gray-500">
                  This will be used in your organization&apos;s URL
                </p>
              </div>
              
              <Button className="w-full" size="lg">
                Create Organization
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <div className="space-y-2 text-xs text-gray-600">
                <p>✓ 14-day free trial included</p>
                <p>✓ Full access to all features</p>
                <p>✓ No credit card required</p>
              </div>
            </CardContent>
          </Card>

          {/* Join Organization */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-green-600" />
                Join Organization
              </CardTitle>
              <CardDescription>
                Join an existing organization with an invitation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inviteCode">Invitation Code</Label>
                <Input 
                  id="inviteCode"
                  placeholder="Enter invitation code"
                  className="w-full"
                />
              </div>
              
              <Button variant="outline" className="w-full" size="lg">
                Join Organization
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
              
              <Separator />
              
              <div className="space-y-3">
                <p className="text-sm text-gray-600">
                  Don&apos;t have an invitation code?
                </p>
                <Button variant="ghost" size="sm" className="w-full">
                  Request Access
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Help Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Need Help?</CardTitle>
            <CardDescription>
              Get assistance with setting up your organization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <h4 className="font-medium">Documentation</h4>
                <p className="text-sm text-gray-600">
                  Learn how to set up and configure your organization
                </p>
                <Button variant="outline" size="sm">
                  Read Docs
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Video Tutorial</h4>
                <p className="text-sm text-gray-600">
                  Watch a quick walkthrough of the setup process
                </p>
                <Button variant="outline" size="sm">
                  Watch Video
                </Button>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Contact Support</h4>
                <p className="text-sm text-gray-600">
                  Get personalized help from our team
                </p>
                <Button variant="outline" size="sm">
                  Contact Us
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center text-sm text-gray-500">
          <p>
            By creating an organization, you agree to our{' '}
            <a href="#" className="text-blue-600 hover:underline">Terms of Service</a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">Privacy Policy</a>
          </p>
        </div>
      </div>
    </div>
  )
}