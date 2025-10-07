/**
 * API Route: Update Organization
 * 
 * PATCH /api/organizations/[id]/route
 * 
 * Updates organization details. Only admins can update.
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { createOrganizationService } from '@/services/organization.service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params
    const body = await request.json()

    // Create Supabase client with user context
    const supabase = createAdminSupabaseClient()
    const orgService = createOrganizationService(supabase)

    // Check user's role in the organization
    const userRole = await orgService.getUserRole(userId, organizationId)
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can update organization settings' },
        { status: 403 }
      )
    }

    // If slug is being changed, check availability
    if (body.slug) {
      const isAvailable = await orgService.isSlugAvailable(body.slug)
      if (!isAvailable) {
        return NextResponse.json(
          { error: 'This organization slug is already taken' },
          { status: 400 }
        )
      }
    }

    // Update the organization
    const updatedOrg = await orgService.updateOrganization(organizationId, body)

    return NextResponse.json({ success: true, organization: updatedOrg })
  } catch (error) {
    console.error('Error updating organization:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update organization',
      },
      { status: 500 }
    )
  }
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId } = await params

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

    const organization = await orgService.getOrganization(organizationId)

    return NextResponse.json({ organization, role: userRole })
  } catch (error) {
    console.error('Error fetching organization:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch organization',
      },
      { status: 500 }
    )
  }
}
