/**
 * Organization Validation Utilities
 * 
 * Provides validation functions for organization-related data including:
 * - Organization name and slug validation
 * - Email validation for invitations
 * - Role validation
 * 
 * These validations are used both on the client and server side
 * to ensure data consistency and security.
 */

import { Database } from '@/types/database.types'

type UserRole = Database['public']['Enums']['user_role']

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean
  error?: string
}

/**
 * Validate organization name
 * - Must not be empty
 * - Must be at least 2 characters
 * - Must not exceed 255 characters
 */
export function validateOrganizationName(name: string): ValidationResult {
  const trimmedName = name.trim()

  if (!trimmedName) {
    return {
      isValid: false,
      error: 'Organization name is required',
    }
  }

  if (trimmedName.length < 2) {
    return {
      isValid: false,
      error: 'Organization name must be at least 2 characters',
    }
  }

  if (trimmedName.length > 255) {
    return {
      isValid: false,
      error: 'Organization name must not exceed 255 characters',
    }
  }

  return { isValid: true }
}

/**
 * Validate organization slug
 * - Must not be empty
 * - Must be at least 2 characters
 * - Must not exceed 100 characters
 * - Must only contain lowercase letters, numbers, and hyphens
 * - Must not start or end with a hyphen
 */
export function validateOrganizationSlug(slug: string): ValidationResult {
  const trimmedSlug = slug.trim()

  if (!trimmedSlug) {
    return {
      isValid: false,
      error: 'Organization slug is required',
    }
  }

  if (trimmedSlug.length < 2) {
    return {
      isValid: false,
      error: 'Slug must be at least 2 characters',
    }
  }

  if (trimmedSlug.length > 100) {
    return {
      isValid: false,
      error: 'Slug must not exceed 100 characters',
    }
  }

  // Check format: only lowercase letters, numbers, and hyphens
  if (!/^[a-z0-9-]+$/.test(trimmedSlug)) {
    return {
      isValid: false,
      error: 'Slug can only contain lowercase letters, numbers, and hyphens',
    }
  }

  // Check that it doesn't start or end with hyphen
  if (trimmedSlug.startsWith('-') || trimmedSlug.endsWith('-')) {
    return {
      isValid: false,
      error: 'Slug cannot start or end with a hyphen',
    }
  }

  // Check for consecutive hyphens
  if (trimmedSlug.includes('--')) {
    return {
      isValid: false,
      error: 'Slug cannot contain consecutive hyphens',
    }
  }

  return { isValid: true }
}

/**
 * Generate a valid slug from a name
 */
export function generateSlugFromName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // Replace non-alphanumeric with hyphens
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .replace(/--+/g, '-') // Replace multiple hyphens with single
    .slice(0, 100) // Enforce max length
}

/**
 * Validate email address
 * Basic email validation for invitations
 */
export function validateEmail(email: string): ValidationResult {
  const trimmedEmail = email.trim()

  if (!trimmedEmail) {
    return {
      isValid: false,
      error: 'Email address is required',
    }
  }

  // Basic email regex - not perfect but good enough for most cases
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

  if (!emailRegex.test(trimmedEmail)) {
    return {
      isValid: false,
      error: 'Please enter a valid email address',
    }
  }

  if (trimmedEmail.length > 320) {
    return {
      isValid: false,
      error: 'Email address is too long',
    }
  }

  return { isValid: true }
}

/**
 * Validate user role
 * Ensures the role is one of the allowed values
 */
export function validateRole(role: string): ValidationResult {
  const validRoles: UserRole[] = ['admin', 'manager', 'operator']

  if (!validRoles.includes(role as UserRole)) {
    return {
      isValid: false,
      error: 'Invalid role. Must be admin, manager, or operator',
    }
  }

  return { isValid: true }
}

/**
 * Check if a user can assign a specific role
 * - Admins can assign any role
 * - Managers can assign operator role only
 * - Operators cannot assign roles
 */
export function canAssignRole(
  assignerRole: UserRole,
  targetRole: UserRole
): ValidationResult {
  if (assignerRole === 'admin') {
    return { isValid: true }
  }

  if (assignerRole === 'manager' && targetRole === 'operator') {
    return { isValid: true }
  }

  return {
    isValid: false,
    error: `${assignerRole}s cannot assign ${targetRole} role`,
  }
}

/**
 * Validate organization settings object
 * Ensures settings have valid structure
 */
export function validateOrganizationSettings(
  settings: Record<string, unknown>
): ValidationResult {
  // Check if it's a valid object
  if (typeof settings !== 'object' || settings === null || Array.isArray(settings)) {
    return {
      isValid: false,
      error: 'Settings must be a valid object',
    }
  }

  // Validate specific settings if they exist
  if (settings.currency && typeof settings.currency !== 'string') {
    return {
      isValid: false,
      error: 'Currency must be a string',
    }
  }

  if (settings.timezone && typeof settings.timezone !== 'string') {
    return {
      isValid: false,
      error: 'Timezone must be a string',
    }
  }

  return { isValid: true }
}

/**
 * Batch validation for organization creation
 * Validates all required fields at once
 */
export function validateOrganizationCreation(data: {
  name: string
  slug: string
  settings?: Record<string, unknown>
}): ValidationResult {
  // Validate name
  const nameValidation = validateOrganizationName(data.name)
  if (!nameValidation.isValid) {
    return nameValidation
  }

  // Validate slug
  const slugValidation = validateOrganizationSlug(data.slug)
  if (!slugValidation.isValid) {
    return slugValidation
  }

  // Validate settings if provided
  if (data.settings) {
    const settingsValidation = validateOrganizationSettings(data.settings)
    if (!settingsValidation.isValid) {
      return settingsValidation
    }
  }

  return { isValid: true }
}

/**
 * Batch validation for user invitation
 * Validates all required fields for sending an invitation
 */
export function validateInvitation(data: {
  email: string
  role: string
  inviterRole: UserRole
}): ValidationResult {
  // Validate email
  const emailValidation = validateEmail(data.email)
  if (!emailValidation.isValid) {
    return emailValidation
  }

  // Validate role
  const roleValidation = validateRole(data.role)
  if (!roleValidation.isValid) {
    return roleValidation
  }

  // Check if inviter can assign this role
  const assignmentValidation = canAssignRole(data.inviterRole, data.role as UserRole)
  if (!assignmentValidation.isValid) {
    return assignmentValidation
  }

  return { isValid: true }
}
