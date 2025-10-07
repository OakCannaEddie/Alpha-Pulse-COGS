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
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useUser, useSession } from '@clerk/nextjs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Building2, UserPlus, ArrowRight, Loader2, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function OnboardingPage() {
  const router = useRouter()
  const { user } = useUser()
  const { session } = useSession()
  const { toast } = useToast()

  // Create organization state
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const [createError, setCreateError] = useState('')

  // Join organization state
  const [inviteCode, setInviteCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [joinError, setJoinError] = useState('')

  /**
   * Generate URL-friendly slug from organization name
   */
  const generateSlug = (name: string): string => {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
  }

  /**
   * Handle organization name change and auto-generate slug
   */
  const handleNameChange = (value: string) => {
    setOrgName(value)
    // Auto-generate slug if it hasn't been manually edited
    if (!orgSlug || orgSlug === generateSlug(orgName)) {
      setOrgSlug(generateSlug(value))
    }
  }

  /**
   * Handle organization creation
   */
  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError('')

    if (!orgName.trim()) {
      setCreateError('Organization name is required')
      return
    }

    if (!orgSlug.trim()) {
      setCreateError('Organization slug is required')
      return
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      setCreateError('Slug can only contain lowercase letters, numbers, and hyphens')
      return
    }

    try {
      setIsCreating(true)
      setCreateError('')

      console.log('Creating organization:', { name: orgName, slug: orgSlug })

      const response = await fetch('/api/organizations/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
          settings: {
            currency: 'USD',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          },
        }),
      })

      console.log('API Response status:', response.status, response.statusText)
      
      // Check if response is actually JSON
      const contentType = response.headers.get('content-type')
      console.log('Response content-type:', contentType)
      
      let data
      try {
        data = await response.json()
        console.log('API Response data:', data)
      } catch (jsonError) {
        console.error('Failed to parse JSON response:', jsonError)
        // Try to get the raw response text for debugging
        const text = await response.text()
        console.error('Raw response text:', text)
        throw new Error('Server returned invalid JSON response')
      }

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create organization')
      }

      console.log('Organization created successfully:', data.organization)

      toast({
        title: 'Organization created!',
        description: `Welcome to ${orgName}. Setting up your workspace...`,
      })

      // CRITICAL: Wait for Clerk to regenerate JWT with new metadata
      // The API updated publicMetadata.activeOrgId, but the JWT is cached
      // We must explicitly reload the session before redirecting
      console.log('Reloading Clerk session to get updated JWT...')
      
      try {
        // Force Clerk to fetch a fresh session with updated metadata
        if (session) {
          await session.reload()
          console.log('Session reloaded successfully')
        }
        
        // Wait a bit more to ensure JWT propagation
        await new Promise(resolve => setTimeout(resolve, 500))
        
        console.log('Redirecting to dashboard...')
        // Use window.location for full page reload
        window.location.href = '/dashboard'
      } catch (sessionError) {
        console.error('Failed to reload session:', sessionError)
        // Fallback: redirect anyway and let middleware handle it
        setTimeout(() => {
          window.location.href = '/dashboard'
        }, 1000)
      }
    } catch (error) {
      console.error('Create organization error:', error)
      setCreateError(error instanceof Error ? error.message : 'Failed to create organization')
    } finally {
      setIsCreating(false)
    }
  }

  /**
   * Handle joining organization with invite code
   * TODO: Implement invitation acceptance flow
   */
  const handleJoinOrganization = async (e: React.FormEvent) => {
    e.preventDefault()
    setJoinError('')

    if (!inviteCode.trim()) {
      setJoinError('Invitation code is required')
      return
    }

    try {
      setIsJoining(true)

      // TODO: Implement invitation acceptance API
      toast({
        title: 'Feature coming soon',
        description: 'Invitation system is under development.',
        variant: 'default',
      })

      setJoinError('Invitation system is not yet implemented')
    } catch (error) {
      console.error('Join organization error:', error)
      setJoinError(error instanceof Error ? error.message : 'Failed to join organization')
    } finally {
      setIsJoining(false)
    }
  }
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
            <CardContent>
              <form onSubmit={handleCreateOrganization} className="space-y-4">
                {createError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{createError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., Acme Manufacturing"
                    className="w-full"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={isCreating}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgSlug">URL Slug *</Label>
                  <Input
                    id="orgSlug"
                    placeholder="e.g., acme-mfg"
                    className="w-full"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
                    disabled={isCreating}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This will be used in your organization&apos;s URL. Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isCreating || !orgName || !orgSlug}
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      Create Organization
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <div className="space-y-2 text-xs text-gray-600">
                  <p>✓ 14-day free trial included</p>
                  <p>✓ Full access to all features</p>
                  <p>✓ No credit card required</p>
                </div>
              </form>
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
            <CardContent>
              <form onSubmit={handleJoinOrganization} className="space-y-4">
                {joinError && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{joinError}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="inviteCode">Invitation Code</Label>
                  <Input
                    id="inviteCode"
                    placeholder="Enter invitation code"
                    className="w-full"
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    disabled={isJoining}
                  />
                </div>

                <Button
                  type="submit"
                  variant="outline"
                  className="w-full"
                  size="lg"
                  disabled={isJoining || !inviteCode}
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    <>
                      Join Organization
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </>
                  )}
                </Button>

                <Separator />

                <div className="space-y-3">
                  <p className="text-sm text-gray-600">
                    Don&apos;t have an invitation code?
                  </p>
                  <Button variant="ghost" size="sm" className="w-full" type="button">
                    Request Access
                  </Button>
                </div>
              </form>
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
            <a href="#" className="text-blue-600 hover:underline">
              Terms of Service
            </a>{' '}
            and{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Privacy Policy
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}