/**
 * Organization Settings Page
 * 
 * Allows organization admins to configure organization details,
 * manage settings, and customize their organization.
 * 
 * @route /settings/organization
 * @protected Requires authentication and admin role
 */
'use client'

import { useState, useEffect } from 'react'
import { useOrganization } from '@/hooks/use-organization'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import { 
  Building2, 
  Save, 
  Loader2, 
  AlertCircle, 
  CheckCircle2,
  Settings,
  Globe
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import PageLayout from '@/components/page-layout'

export default function OrganizationSettingsPage() {
  const { activeOrganization, userRole, refreshOrganizations } = useOrganization()
  const { toast } = useToast()

  // Form state
  const [orgName, setOrgName] = useState('')
  const [orgSlug, setOrgSlug] = useState('')
  const [description, setDescription] = useState('')
  
  // Loading and error states
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  // Populate form when organization loads
  useEffect(() => {
    if (activeOrganization) {
      setOrgName(activeOrganization.name)
      setOrgSlug(activeOrganization.slug)
      setDescription((activeOrganization.settings as any)?.description || '')
    }
  }, [activeOrganization])

  /**
   * Check if user has permission to edit
   */
  const canEdit = userRole === 'admin'

  /**
   * Handle form submission
   */
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess(false)

    if (!activeOrganization) {
      setError('No active organization')
      return
    }

    if (!canEdit) {
      setError('You do not have permission to edit organization settings')
      return
    }

    if (!orgName.trim()) {
      setError('Organization name is required')
      return
    }

    if (!orgSlug.trim()) {
      setError('Organization slug is required')
      return
    }

    // Validate slug format
    if (!/^[a-z0-9-]+$/.test(orgSlug)) {
      setError('Slug can only contain lowercase letters, numbers, and hyphens')
      return
    }

    try {
      setIsSaving(true)

      const response = await fetch(`/api/organizations/${activeOrganization.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: orgName,
          slug: orgSlug,
          settings: {
            description,
          },
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update organization')
      }

      setSuccess(true)
      toast({
        title: 'Settings saved!',
        description: 'Organization settings have been updated successfully.',
      })

      // Refresh organization data
      await refreshOrganizations()
    } catch (err) {
      console.error('Save settings error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save settings')
    } finally {
      setIsSaving(false)
    }
  }

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
   * Handle name change and auto-generate slug if not manually edited
   */
  const handleNameChange = (value: string) => {
    setOrgName(value)
    // Only auto-generate if slug matches previous name
    if (!activeOrganization || orgSlug === generateSlug(activeOrganization.name)) {
      setOrgSlug(generateSlug(value))
    }
  }

  if (!activeOrganization) {
    return (
      <PageLayout title="Organization Settings">
        <div className="flex items-center justify-center py-12">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>No active organization found</AlertDescription>
          </Alert>
        </div>
      </PageLayout>
    )
  }

  return (
    <PageLayout title="Organization Settings">
      <div className="max-w-4xl space-y-6">
        <div className="pb-4">
          <p className="text-gray-600">Manage your organization details and preferences</p>
        </div>
        {/* Organization Status */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Building2 className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <CardTitle>{activeOrganization.name}</CardTitle>
                  <CardDescription>
                    Status: <Badge variant={activeOrganization.status === 'active' ? 'default' : 'secondary'}>
                      {activeOrganization.status}
                    </Badge>
                  </CardDescription>
                </div>
              </div>
              {userRole && (
                <Badge variant="outline">
                  {userRole.charAt(0).toUpperCase() + userRole.slice(1)}
                </Badge>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* General Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-gray-600" />
              <CardTitle>General Settings</CardTitle>
            </div>
            <CardDescription>
              Update your organization's basic information
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveSettings} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>Settings saved successfully!</AlertDescription>
                </Alert>
              )}

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    placeholder="e.g., Acme Manufacturing"
                    value={orgName}
                    onChange={(e) => handleNameChange(e.target.value)}
                    disabled={!canEdit || isSaving}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="orgSlug">URL Slug *</Label>
                  <Input
                    id="orgSlug"
                    placeholder="e.g., acme-mfg"
                    value={orgSlug}
                    onChange={(e) => setOrgSlug(e.target.value.toLowerCase())}
                    disabled={!canEdit || isSaving}
                    required
                  />
                  <p className="text-xs text-gray-500">
                    This will be used in your organization's URL. Only lowercase letters, numbers, and hyphens.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Brief description of your organization..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={!canEdit || isSaving}
                    rows={4}
                  />
                </div>
              </div>

              <Separator />

              {!canEdit && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Only organization admins can edit settings
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    if (activeOrganization) {
                      setOrgName(activeOrganization.name)
                      setOrgSlug(activeOrganization.slug)
                      setDescription((activeOrganization.settings as any)?.description || '')
                      setError('')
                      setSuccess(false)
                    }
                  }}
                  disabled={!canEdit || isSaving}
                >
                  Reset
                </Button>
                <Button
                  type="submit"
                  disabled={!canEdit || isSaving}
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Additional Settings (Placeholder for future features) */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-600" />
              <CardTitle>Regional Settings</CardTitle>
            </div>
            <CardDescription>
              Configure currency, timezone, and localization preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm text-gray-500">
              <p>Regional settings configuration coming soon...</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Currency selection</li>
                <li>Timezone configuration</li>
                <li>Date and time formats</li>
                <li>Language preferences</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageLayout>
  )
}
