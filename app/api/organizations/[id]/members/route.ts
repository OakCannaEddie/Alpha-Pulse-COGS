/**
 * API Route: Organization Members
 * 
 * GET /api/organizations/[id]/members - Get all members
 * POST /api/organizations/[id]/members - Invite a new member
 * PATCH /api/organizations/[id]/members/[memberId] - Update member role
 * DELETE /api/organizations/[id]/members/[memberId] - Remove member
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { createOrganizationService } from '@/services/organization.service'
import { validateInvitation } from '@/lib/validations/organization.validation'

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

    const members = await orgService.getOrganizationMembers(organizationId)

    return NextResponse.json({ members })
  } catch (error) {
    console.error('Error fetching members:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to fetch members',
      },
      { status: 500 }
    )
  }
}

export async function POST(
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
    const { email, role } = body

    const supabase = createAdminSupabaseClient()
    const orgService = createOrganizationService(supabase)

    // Get user's role in the organization
    const userRole = await orgService.getUserRole(userId, organizationId)
    if (!userRole || (userRole !== 'admin' && userRole !== 'manager')) {
      return NextResponse.json(
        { error: 'Only admins and managers can invite users' },
        { status: 403 }
      )
    }

    // Validate invitation data
    const validation = validateInvitation({ email, role, inviterRole: userRole })
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Send invitation
    const invitation = await orgService.inviteUser(
      {
        email,
        role,
        organizationId,
      },
      userId
    )

    // TODO: Send invitation email via email service
    // This would be implemented in a separate email service

    return NextResponse.json(
      {
        success: true,
        invitation,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error inviting user:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to invite user',
      },
      { status: 500 }
    )
  }
}
