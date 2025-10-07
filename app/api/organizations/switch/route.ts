/**
 * API Route: Switch Active Organization
 * 
 * POST /api/organizations/switch
 * 
 * Updates the user's active organization in both Clerk metadata and Supabase.
 */

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { createOrganizationService } from '@/services/organization.service'

export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { organizationId } = body

    if (!organizationId) {
      return NextResponse.json(
        { error: 'Organization ID is required' },
        { status: 400 }
      )
    }

    const supabase = createAdminSupabaseClient()
    const orgService = createOrganizationService(supabase)

    // Verify user has access to this organization
    const userRole = await orgService.getUserRole(userId, organizationId)
    if (!userRole) {
      return NextResponse.json(
        { error: 'You do not have access to this organization' },
        { status: 403 }
      )
    }

    // Update user's active organization in Supabase
    await orgService.setActiveOrganization(userId, organizationId)

    // Update Clerk metadata
    const client = await clerkClient()
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        activeOrgId: organizationId,
        role: userRole,
      },
    })

    // Update last active timestamp
    await supabase
      .from('organization_users')
      .update({ last_active_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('organization_id', organizationId)

    return NextResponse.json({
      success: true,
      organizationId,
      role: userRole,
    })
  } catch (error) {
    console.error('Error switching organization:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to switch organization',
      },
      { status: 500 }
    )
  }
}
