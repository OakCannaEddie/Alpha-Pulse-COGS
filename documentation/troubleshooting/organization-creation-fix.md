# Organization Creation Fix - Summary

## Issue Identified

The organization creation was failing due to a database constraint violation on the `user_profiles` table. The error occurred because:

1. The `user_profiles` table has an email format check constraint: `CHECK (email ~ '^[^@]+@[^@]+\.[^@]+$')`
2. The `createOrganization` method in the service layer was trying to create a user profile with an empty string for email
3. Empty strings don't match the email regex pattern, causing the constraint violation

## Changes Made

### 1. Updated `services/organization.service.ts`

**Removed** the user profile creation step from `createOrganization()` method:
- The service no longer tries to create/update user_profiles
- This avoids the empty email constraint violation
- User profile creation is now handled in the API route where we have access to Clerk user data

### 2. Updated `app/api/organizations/create/route.ts`

**Added** email validation and improved flow:
```typescript
// 1. Get user email from Clerk FIRST
const user = await client.users.getUser(userId)
const userEmail = user.emailAddresses[0]?.emailAddress

// 2. Validate email exists
if (!userEmail || !userEmail.includes('@')) {
  return error
}

// 3. Create organization (no profile creation)
const { organization, membership } = await orgService.createOrganization(...)

// 4. Create/update user profile with VALID email
await supabase.from('user_profiles').upsert({ email: userEmail, ... })

// 5. Update Clerk metadata
await client.users.updateUserMetadata(...)
```

**Added** error handling for profile update:
- If profile update fails, we log the error but don't fail the request
- The organization is already created successfully at this point
- This prevents partial failures from blocking the user

### 3. Environment Variable Fix

**Renamed** `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY` to `SUPABASE_SERVICE_ROLE_KEY`:
- Service role key should NEVER be exposed to the client (no `NEXT_PUBLIC_` prefix)
- Only server-side code (API routes) should access this key
- This is a critical security fix

### 4. Created Helper Utilities

**Added** `lib/supabase-server.ts`:
- `createAdminSupabaseClient()` - For server-side operations with service role
- `createAnonSupabaseClient()` - For client-side operations with anon key
- Both functions validate environment variables and provide helpful error messages

## Testing Instructions

1. **Clear Previous Test Data** (if organization was partially created):
   ```sql
   -- Run in Supabase SQL Editor if needed
   DELETE FROM organization_users WHERE user_id = 'your-clerk-user-id';
   DELETE FROM organizations WHERE slug = 'your-test-slug';
   DELETE FROM user_profiles WHERE id = 'your-clerk-user-id';
   ```

2. **Test Organization Creation**:
   - Go to http://localhost:3001/onboarding
   - Sign in with Clerk
   - Fill in organization name and slug
   - Click "Create Organization"
   - Should see success toast
   - Should redirect to dashboard after 1.5 seconds

3. **Verify Database**:
   - Check `organizations` table - new org should exist
   - Check `organization_users` - user should be admin
   - Check `user_profiles` - should have valid email

4. **Test Organization Switching** (if you create a second org):
   - Go to dashboard
   - Click organization switcher in sidebar
   - Select different organization
   - Page should reload with new org context

## Expected Flow

```
User submits onboarding form
  ↓
API receives request
  ↓
Validate slug format
  ↓
Get user from Clerk (validate email exists)
  ↓
Check slug availability
  ↓
Create organization (organizations table)
  ↓
Create admin membership (organization_users table)
  ↓
Create/update user profile with valid email (user_profiles table)
  ↓
Update Clerk metadata (publicMetadata.activeOrgId)
  ↓
Return success
  ↓
Frontend shows toast and redirects to /dashboard
```

## Common Issues & Solutions

### Issue: "User email is required"
**Cause**: Clerk user doesn't have an email address
**Solution**: Ensure user completes email verification in Clerk

### Issue: "Slug already taken"
**Cause**: Organization with that slug already exists from previous test
**Solution**: Use a different slug or delete the existing organization

### Issue: Still redirected to onboarding after creation
**Cause**: Clerk metadata not updated or middleware not checking properly
**Solution**: 
1. Check browser console for errors
2. Verify Clerk JWT template includes publicMetadata
3. Check middleware.ts is reading activeOrgId correctly

### Issue: Database foreign key errors
**Cause**: RLS policies or missing user_profiles entry
**Solution**: Ensure user_profiles is created before organization_users

## Files Modified

1. `services/organization.service.ts` - Removed user profile creation
2. `app/api/organizations/create/route.ts` - Added email validation, improved flow
3. `lib/supabase-server.ts` - Created new helper utilities
4. `.env.local` - Fixed SUPABASE_SERVICE_ROLE_KEY variable name
5. All organization API routes - Updated to use `createAdminSupabaseClient()`

## Next Steps

After successful testing:
- [ ] Test organization switching
- [ ] Test organization settings page
- [ ] Test team member invitations
- [ ] Test role-based permissions
- [ ] Document any remaining issues

---

**Status**: Ready for testing
**Last Updated**: 2025-10-07
