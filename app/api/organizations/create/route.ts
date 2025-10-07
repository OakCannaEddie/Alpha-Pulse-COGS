/**
 * API Route: Create Organization
 * 
 * POST /api/organizations/create
 * 
 * Creates a new organization and adds the authenticated user as admin.
 * Also updates the user's Clerk metadata to set the new org as active.
 */

import { auth, clerkClient } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'
import { createAdminSupabaseClient } from '@/lib/supabase-server'
import { createOrganizationService } from '@/services/organization.service'
import { validateOrganizationCreation } from '@/lib/validations/organization.validation'

export async function POST(request: Request) {
  try {
    // Authenticate the user
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { name, slug, settings } = body

    // Validate input data
    const validation = validateOrganizationCreation({ name, slug, settings })
    if (!validation.isValid) {
      return NextResponse.json(
        { error: validation.error },
        { status: 400 }
      )
    }

    // Create Supabase admin client for this operation
    const supabase = createAdminSupabaseClient()
    const orgService = createOrganizationService(supabase)

    // Check if slug is available
    const isAvailable = await orgService.isSlugAvailable(slug)
    if (!isAvailable) {
      return NextResponse.json(
        { error: 'This organization slug is already taken' },
        { status: 400 }
      )
    }

    // Get user's email from Clerk first
    const client = await clerkClient()
    const user = await client.users.getUser(userId)
    const userEmail = user.emailAddresses[0]?.emailAddress

    // Validate we have a valid email
    if (!userEmail || !userEmail.includes('@')) {
      return NextResponse.json(
        { error: 'User email is required to create an organization' },
        { status: 400 }
      )
    }

    // Create the organization
    const { organization, membership } = await orgService.createOrganization(userId, {
      name,
      slug,
      settings,
    })

    // Update user profile with email and active organization
    const { error: profileError } = await supabase.from('user_profiles').upsert(
      {
        id: userId,
        email: userEmail,
        first_name: user.firstName || null,
        last_name: user.lastName || null,
        active_organization_id: organization.id,
      },
      { onConflict: 'id' }
    )

    if (profileError) {
      console.error('Error updating user profile:', profileError)
      // Don't fail the request if profile update fails
      // The organization is already created successfully
    }

    // Update Clerk user metadata to include organization info
    try {
      await client.users.updateUserMetadata(userId, {
        publicMetadata: {
          activeOrgId: organization.id,
          role: 'admin',
        },
      })
    } catch (metadataError) {
      console.error('Error updating Clerk metadata:', metadataError)
      // Log but don't fail - org is already created
    }

    // Ensure all response data is JSON-serializable
    // Convert any potential Date objects or undefined values
    const sanitizedOrganization = {
      id: organization.id,
      name: organization.name,
      slug: organization.slug,
      status: organization.status,
      settings: organization.settings || {},
      subscription_id: organization.subscription_id || null,
      trial_ends_at: organization.trial_ends_at || null,
      created_at: organization.created_at,
      updated_at: organization.updated_at,
    }

    const sanitizedMembership = {
      id: membership.id,
      organization_id: membership.organization_id,
      user_id: membership.user_id,
      role: membership.role,
      joined_at: membership.joined_at || null,
      invited_at: membership.invited_at,
      is_active: membership.is_active,
    }

    return NextResponse.json(
      {
        success: true,
        organization: sanitizedOrganization,
        membership: sanitizedMembership,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating organization:', error)
    
    // Provide more detailed error information for debugging
    const errorMessage = error instanceof Error ? error.message : 'Failed to create organization'
    const errorStack = error instanceof Error ? error.stack : undefined
    
    console.error('Error details:', {
      message: errorMessage,
      stack: errorStack,
      error: error,
    })
    
    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}
