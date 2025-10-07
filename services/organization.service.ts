/**
 * Organization Service
 * 
 * Provides business logic for organization management including:
 * - Creating and updating organizations
 * - Managing organization members and roles
 * - Handling user invitations
 * - Organization switching
 * 
 * All functions enforce Row Level Security (RLS) through Supabase.
 * Operations are scoped to the authenticated user's permissions.
 */

import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database.types'

// Type definitions
type Organization = Database['public']['Tables']['organizations']['Row']
type OrganizationInsert = Database['public']['Tables']['organizations']['Insert']
type OrganizationUpdate = Database['public']['Tables']['organizations']['Update']
type UserProfile = Database['public']['Tables']['user_profiles']['Row']
type OrganizationUser = Database['public']['Tables']['organization_users']['Row']
type UserRole = Database['public']['Enums']['user_role']

// Response types for better type safety
export interface OrganizationWithRole extends Organization {
  role: UserRole
  joinedAt: string | null
}

export interface OrganizationMember {
  id: string
  userId: string
  role: UserRole
  joinedAt: string | null
  invitedAt: string
  isActive: boolean
  user: {
    email: string
    firstName: string | null
    lastName: string | null
  }
}

export interface CreateOrganizationData {
  name: string
  slug: string
  settings?: Database['public']['Tables']['organizations']['Row']['settings']
}

export interface UpdateOrganizationData {
  name?: string
  slug?: string
  settings?: Database['public']['Tables']['organizations']['Row']['settings']
  status?: Database['public']['Enums']['organization_status']
}

export interface InviteUserData {
  email: string
  role: UserRole
  organizationId: string
}

/**
 * OrganizationService class
 * Encapsulates all organization-related operations
 */
export class OrganizationService {
  constructor(private supabase: SupabaseClient<Database>) {}

  /**
   * Create a new organization and add the creator as admin
   * @param userId - Clerk user ID of the creator
   * @param data - Organization creation data
   * @returns The created organization with user's role
   */
  async createOrganization(
    userId: string,
    data: CreateOrganizationData
  ): Promise<{ organization: Organization; membership: OrganizationUser }> {
    try {
      // Step 1: Create the organization
      const { data: organization, error: orgError } = await this.supabase
        .from('organizations')
        .insert({
          name: data.name,
          slug: data.slug,
          settings: data.settings || {},
          status: 'trial', // Default to trial status
        })
        .select()
        .single()

      if (orgError) throw orgError

      // Step 2: Add user as admin member
      const { data: membership, error: memberError } = await this.supabase
        .from('organization_users')
        .insert({
          organization_id: organization.id,
          user_id: userId,
          role: 'admin',
          joined_at: new Date().toISOString(),
          is_active: true,
        })
        .select()
        .single()

      if (memberError) throw memberError

      return { organization, membership }
    } catch (error) {
      console.error('Error creating organization:', error)
      throw new Error(
        error instanceof Error ? error.message : 'Failed to create organization'
      )
    }
  }

  /**
   * Get all organizations for a user
   * @param userId - Clerk user ID
   * @returns Array of organizations with user's role in each
   */
  async getUserOrganizations(userId: string): Promise<OrganizationWithRole[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select(
          `
          role,
          joined_at,
          is_active,
          organization:organizations (*)
        `
        )
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('joined_at', { ascending: false })

      if (error) throw error

      return (data || []).map((membership: any) => ({
        ...membership.organization,
        role: membership.role,
        joinedAt: membership.joined_at,
      }))
    } catch (error) {
      console.error('Error fetching user organizations:', error)
      throw new Error('Failed to fetch organizations')
    }
  }

  /**
   * Get a single organization by ID
   * @param organizationId - Organization UUID
   * @returns Organization details
   */
  async getOrganization(organizationId: string): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('*')
        .eq('id', organizationId)
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error fetching organization:', error)
      throw new Error('Failed to fetch organization')
    }
  }

  /**
   * Update organization details
   * @param organizationId - Organization UUID
   * @param updates - Fields to update
   * @returns Updated organization
   */
  async updateOrganization(
    organizationId: string,
    updates: UpdateOrganizationData
  ): Promise<Organization> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .update(updates)
        .eq('id', organizationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating organization:', error)
      throw new Error('Failed to update organization')
    }
  }

  /**
   * Get all members of an organization
   * @param organizationId - Organization UUID
   * @returns Array of organization members with user details
   */
  async getOrganizationMembers(
    organizationId: string
  ): Promise<OrganizationMember[]> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select(
          `
          id,
          user_id,
          role,
          joined_at,
          invited_at,
          is_active,
          user:user_profiles (
            email,
            first_name,
            last_name
          )
        `
        )
        .eq('organization_id', organizationId)
        .order('invited_at', { ascending: false })

      if (error) throw error

      return (data || []).map((member: any) => ({
        id: member.id,
        userId: member.user_id,
        role: member.role,
        joinedAt: member.joined_at,
        invitedAt: member.invited_at,
        isActive: member.is_active,
        user: {
          email: member.user?.email || '',
          firstName: member.user?.first_name || null,
          lastName: member.user?.last_name || null,
        },
      }))
    } catch (error) {
      console.error('Error fetching organization members:', error)
      throw new Error('Failed to fetch organization members')
    }
  }

  /**
   * Invite a user to an organization
   * Creates a pending membership that user can accept
   * @param data - Invitation data
   * @param invitedBy - User ID of the person sending invitation
   * @returns Created invitation record
   */
  async inviteUser(
    data: InviteUserData,
    invitedBy: string
  ): Promise<OrganizationUser> {
    try {
      // Check if user profile exists, if not create it
      const { data: existingProfile } = await this.supabase
        .from('user_profiles')
        .select('id')
        .eq('email', data.email)
        .single()

      // Create invitation - joined_at is NULL for pending invitations
      const { data: invitation, error } = await this.supabase
        .from('organization_users')
        .insert({
          organization_id: data.organizationId,
          user_id: existingProfile?.id || data.email, // Use email as placeholder if no profile
          role: data.role,
          invited_by: invitedBy,
          is_active: true,
          // joined_at is NULL until user accepts
        })
        .select()
        .single()

      if (error) throw error

      // TODO: Send invitation email via API route
      // This would trigger an email to the user with invitation link

      return invitation
    } catch (error) {
      console.error('Error inviting user:', error)
      throw new Error('Failed to invite user')
    }
  }

  /**
   * Accept an invitation to join an organization
   * @param invitationId - Organization user record ID
   * @param userId - User accepting the invitation
   * @returns Updated membership record
   */
  async acceptInvitation(
    invitationId: string,
    userId: string
  ): Promise<OrganizationUser> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .update({
          user_id: userId,
          joined_at: new Date().toISOString(),
        })
        .eq('id', invitationId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error accepting invitation:', error)
      throw new Error('Failed to accept invitation')
    }
  }

  /**
   * Update a member's role in an organization
   * @param membershipId - Organization user record ID
   * @param newRole - New role to assign
   * @returns Updated membership record
   */
  async updateMemberRole(
    membershipId: string,
    newRole: UserRole
  ): Promise<OrganizationUser> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .update({ role: newRole })
        .eq('id', membershipId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error) {
      console.error('Error updating member role:', error)
      throw new Error('Failed to update member role')
    }
  }

  /**
   * Remove a member from an organization
   * @param membershipId - Organization user record ID
   */
  async removeMember(membershipId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('organization_users')
        .update({ is_active: false })
        .eq('id', membershipId)

      if (error) throw error
    } catch (error) {
      console.error('Error removing member:', error)
      throw new Error('Failed to remove member')
    }
  }

  /**
   * Update user's active organization in their profile
   * @param userId - Clerk user ID
   * @param organizationId - Organization UUID
   */
  async setActiveOrganization(
    userId: string,
    organizationId: string
  ): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('user_profiles')
        .update({ active_organization_id: organizationId })
        .eq('id', userId)

      if (error) throw error
    } catch (error) {
      console.error('Error setting active organization:', error)
      throw new Error('Failed to set active organization')
    }
  }

  /**
   * Check if a slug is available
   * @param slug - Organization slug to check
   * @returns True if slug is available
   */
  async isSlugAvailable(slug: string): Promise<boolean> {
    try {
      const { data, error } = await this.supabase
        .from('organizations')
        .select('id')
        .eq('slug', slug)
        .maybeSingle()

      if (error) throw error
      return data === null
    } catch (error) {
      console.error('Error checking slug availability:', error)
      return false
    }
  }

  /**
   * Get user's role in a specific organization
   * @param userId - Clerk user ID
   * @param organizationId - Organization UUID
   * @returns User's role or null if not a member
   */
  async getUserRole(
    userId: string,
    organizationId: string
  ): Promise<UserRole | null> {
    try {
      const { data, error } = await this.supabase
        .from('organization_users')
        .select('role')
        .eq('user_id', userId)
        .eq('organization_id', organizationId)
        .eq('is_active', true)
        .maybeSingle()

      if (error) throw error
      return data?.role || null
    } catch (error) {
      console.error('Error fetching user role:', error)
      return null
    }
  }
}

/**
 * Factory function to create an OrganizationService instance
 * @param supabase - Authenticated Supabase client
 * @returns OrganizationService instance
 */
export function createOrganizationService(
  supabase: SupabaseClient<Database>
): OrganizationService {
  return new OrganizationService(supabase)
}
