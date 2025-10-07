---
mode: agent
---

# Organization Creation Bug Investigation

## Current Behavior
- **Backend**: Organizations ARE being created successfully in Supabase tables
- **Frontend**: UI shows creation failure OR doesn't reflect the new organization
- **Symptom**: Visual state doesn't match database state

## Required Investigation Steps

1. **Verify Database State**
    - Check `organizations` table for newly created records
    - Confirm `user_organizations` junction table entries exist
    - Verify RLS policies allow reading created organizations

2. **Frontend State Analysis**
    - Check React Query cache invalidation after creation
    - Verify mutation success callbacks are firing
    - Check for error boundaries suppressing success states
    - Review console for JavaScript errors during/after creation

3. **Potential Root Causes**
    - Query cache not invalidating after mutation
    - Success toast/notification not showing despite success
    - Form not resetting, appearing "stuck"
    - User permissions preventing READ after successful CREATE
    - Race condition between create and list queries

## Debugging Actions Needed

**Check Mutation Configuration:**