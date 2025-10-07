/**
 * API Route: Manage Individual Organization Member
 * 
 * PATCH /api/organizations/[id]/members/[memberId] - Update member role
 * DELETE /api/organizations/[id]/members/[memberId] - Remove member
 */

import { auth } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { createOrganizationService } from '@/services/organization.service'

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId, memberId } = await params
    const body = await request.json()
    const { role } = body

    if (!role) {
      return NextResponse.json({ error: 'Role is required' }, { status: 400 })
    }

    const supabase = createAdminSupabaseClient()
    const orgService = createOrganizationService(supabase)

    // Only admins can change roles
    const userRole = await orgService.getUserRole(userId, organizationId)
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can change user roles' },
        { status: 403 }
      )
    }

    const updatedMember = await orgService.updateMemberRole(memberId, role)

    return NextResponse.json({
      success: true,
      member: updatedMember,
    })
  } catch (error) {
    console.error('Error updating member role:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to update member role',
      },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; memberId: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: organizationId, memberId } = await params

    const supabase = createAdminSupabaseClient()
    const orgService = createOrganizationService(supabase)

    // Only admins can remove members
    const userRole = await orgService.getUserRole(userId, organizationId)
    if (userRole !== 'admin') {
      return NextResponse.json(
        { error: 'Only admins can remove members' },
        { status: 403 }
      )
    }

    await orgService.removeMember(memberId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error removing member:', error)
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : 'Failed to remove member',
      },
      { status: 500 }
    )
  }
}
