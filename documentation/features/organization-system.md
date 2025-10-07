# Organization Features Documentation

## Overview

The organization system provides complete multi-tenant functionality for Pulse COGS, allowing multiple manufacturing companies to use the application while keeping their data completely isolated. Each user can belong to one or more organizations with different roles and permissions.

## Architecture

### Multi-Tenancy Strategy

- **Authentication**: Handled by Clerk
- **Authorization**: Enforced by Supabase Row Level Security (RLS)
- **Organization Context**: Stored in Clerk's `publicMetadata` and Supabase user profiles
- **Data Isolation**: All queries automatically filtered by active organization ID

### Database Schema

#### Tables

##### organizations

- Core tenant table containing organization details
- Fields: id, name, slug, status, settings, subscription_id, trial_ends_at
- Unique slug for URL-friendly identification

##### user_profiles

- Links Clerk users to organizations
- Stores active_organization_id for quick access
- Fields: id (Clerk user ID), email, first_name, last_name, active_organization_id

##### organization_users

- Junction table for many-to-many relationship
- Includes role-based access control
- Fields: organization_id, user_id, role, invited_at, joined_at, is_active
- Roles: admin, manager, operator

## Features Implemented

### 1. Organization Creation (Onboarding)

**Route**: `/onboarding`

**Functionality**:

- New users create their first organization
- Auto-generates URL-friendly slug from organization name
- Validates slug uniqueness
- Creates user profile and admin membership
- Updates Clerk metadata with organization info

**Files**:

- `app/onboarding/page.tsx` - UI component
- `app/api/organizations/create/route.ts` - API endpoint
- `services/organization.service.ts` - Business logic

### 2. Organization Switching

**Component**: `OrganizationSwitcher`

**Functionality**:

- Dropdown showing all user's organizations
- Visual indication of active organization
- Smooth switching with loading states
- Updates Clerk metadata and Supabase profile
- Reloads page to refresh all data with new context

**Files**:

- `components/organization-switcher.tsx` - UI component
- `app/api/organizations/switch/route.ts` - API endpoint
- `hooks/use-organization.tsx` - React context and state management

### 3. Organization Settings

**Route**: `/settings/organization`

**Functionality**:

- Update organization name and slug
- Edit organization description
- Manage regional settings (placeholder for future)
- Admin-only access
- Real-time validation and error handling

**Files**:

- `app/settings/organization/page.tsx` - UI component
- `app/api/organizations/[id]/route.ts` - API endpoints (GET, PATCH)

### 4. Team Management

**Route**: `/settings/team`

**Functionality**:

- View all team members with roles and status
- Invite new members by email
- Change member roles (admin only)
- Remove members from organization
- Role-based permissions enforcement
- Pending invitation status display

**Files**:

- `app/settings/team/page.tsx` - UI component
- `app/api/organizations/[id]/members/route.ts` - List and invite API
- `app/api/organizations/[id]/members/[memberId]/route.ts` - Update and remove API

### 5. Role-Based Access Control

**Roles**:

##### Admin

- Full access to all features
- Can manage organization settings
- Can invite, promote, and remove team members
- Can change billing and subscription

##### Manager

- Can manage inventory, production, suppliers
- Can invite operators and view all data
- Cannot modify organization settings
- Cannot remove admin users

##### Operator

- Can view and create records
- Cannot delete or modify settings
- Limited to operational tasks
- Cannot invite users

**Implementation**:

- `hooks/use-organization.tsx` - `canPerformAction()` and `hasRole()` helpers
- Enforced at API level via Supabase RLS
- UI elements conditionally rendered based on role

## Security

### Row Level Security (RLS)

All database tables have RLS policies that automatically filter data by organization:

```sql
-- Example: Users can only view their organizations
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id() 
            AND is_active = true
        )
    );
```

### Middleware Protection

**File**: `middleware.ts`

- Checks authentication on all protected routes
- Verifies user has an active organization
- Redirects to onboarding if no organization exists
- Prevents unauthorized access at routing level

### API Authorization

All API routes verify:

1. User is authenticated (Clerk)
2. User has access to the organization
3. User has the required role for the action
4. Request data is validated before processing

## Validation

**File**: `lib/validations/organization.validation.ts`

Comprehensive validation for:

- Organization names (2-255 chars, non-empty)
- Slugs (2-100 chars, lowercase, alphanumeric + hyphens)
- Email addresses (standard email format)
- Roles (admin, manager, operator only)
- Settings objects (valid JSON structure)

Used on both client and server side for consistency.

## Usage Examples

### Creating an Organization

```typescript
// In onboarding page
const response = await fetch('/api/organizations/create', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'Acme Manufacturing',
    slug: 'acme-mfg',
    settings: {
      currency: 'USD',
      timezone: 'America/Los_Angeles'
    }
  })
})
```

### Accessing Organization Context

```typescript
'use client'
import { useOrganization } from '@/hooks/use-organization'

export function MyComponent() {
  const { 
    activeOrganization, 
    userRole, 
    canPerformAction 
  } = useOrganization()

  if (canPerformAction('delete')) {
    // Show delete button
  }

  return <div>{activeOrganization.name}</div>
}
```

### Inviting a Team Member

```typescript
const response = await fetch(`/api/organizations/${orgId}/members`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'colleague@example.com',
    role: 'operator'
  })
})
```

## Database Queries

### Get User's Organizations

```typescript
const orgService = createOrganizationService(supabase)
const organizations = await orgService.getUserOrganizations(userId)
```

### Check User's Role

```typescript
const role = await orgService.getUserRole(userId, organizationId)
if (role === 'admin') {
  // Allow admin actions
}
```

### Update Organization

```typescript
await orgService.updateOrganization(orgId, {
  name: 'New Name',
  slug: 'new-slug',
  settings: { currency: 'EUR' }
})
```

## Future Enhancements

### Planned Features

1. **Email Invitations**
   - Send branded emails with invitation links
   - Track invitation status
   - Resend invitations
   - Set expiration dates

2. **Organization Branding**
   - Custom logos
   - Color schemes
   - Email templates
   - White-labeling options

3. **Advanced Permissions**
   - Custom roles beyond admin/manager/operator
   - Fine-grained permissions per module
   - Department-based access control

4. **Organization Analytics**
   - Team activity tracking
   - Usage metrics per organization
   - Cost tracking and billing
   - Performance dashboards

5. **Multi-Organization Features**
   - Switch between orgs without page reload
   - Cross-organization reporting (for enterprise)
   - Organization hierarchies (parent/child)
   - Shared resources between organizations

## Testing

### Manual Testing Checklist

#### Organization Creation

- [ ] Create organization with valid data
- [ ] Slug validation (special chars, length)
- [ ] Duplicate slug handling
- [ ] User becomes admin automatically
- [ ] Redirect to dashboard after creation

#### Organization Switching

- [ ] Switch between multiple organizations
- [ ] Data updates correctly after switch
- [ ] Role changes per organization
- [ ] Organization switcher shows all orgs

#### Settings Management

- [ ] Update organization name
- [ ] Update slug (check uniqueness)
- [ ] Non-admins cannot edit
- [ ] Changes persist and refresh

#### Team Management

- [ ] Invite user by email
- [ ] Change user role
- [ ] Remove user from organization
- [ ] Pending invitations show correctly
- [ ] Permissions enforced (manager vs admin)

#### Middleware & Security

- [ ] Unauthenticated users redirected
- [ ] Users without org go to onboarding
- [ ] Protected routes require authentication
- [ ] RLS prevents cross-org data access

## Troubleshooting

### Common Issues

#### "No active organization found"

- Check Clerk metadata contains `activeOrgId`
- Verify user is member of at least one org
- Check `organization_users` table for active membership

#### "Permission denied" errors

- Verify user's role in organization
- Check RLS policies are enabled
- Ensure Clerk JWT template includes metadata

#### Slug already taken

- Generate unique slug (add numbers: `acme-mfg-2`)
- Check organization table for duplicates
- Use slug validation before creating

#### Invitation not working

- Verify email service is configured (TODO)
- Check `organization_users` table for pending invitation
- Ensure inviter has permission to invite

## API Reference

### POST /api/organizations/create

Create a new organization

**Body**: `{ name: string, slug: string, settings?: object }`

**Returns**: `{ success: boolean, organization: Organization, membership: OrganizationUser }`

### GET /api/organizations/[id]

Get organization details

**Returns**: `{ organization: Organization, role: UserRole }`

### PATCH /api/organizations/[id]

Update organization (admin only)

**Body**: `{ name?: string, slug?: string, settings?: object }`

**Returns**: `{ success: boolean, organization: Organization }`

### POST /api/organizations/switch

Switch active organization

**Body**: `{ organizationId: string }`

**Returns**: `{ success: boolean, organizationId: string, role: UserRole }`

### GET /api/organizations/[id]/members

Get organization members

**Returns**: `{ members: TeamMember[] }`

### POST /api/organizations/[id]/members

Invite a new member (admin/manager only)

**Body**: `{ email: string, role: UserRole }`

**Returns**: `{ success: boolean, invitation: OrganizationUser }`

### PATCH /api/organizations/[id]/members/[memberId]

Update member role (admin only)

**Body**: `{ role: UserRole }`

**Returns**: `{ success: boolean, member: OrganizationUser }`

### DELETE /api/organizations/[id]/members/[memberId]

Remove member (admin only)

**Returns**: `{ success: boolean }`

---

**Last Updated**: 2024-10-07
**Status**: Production Ready
**Version**: 1.0.0
