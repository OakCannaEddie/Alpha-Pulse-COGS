# AlphaPulseCOGS2 Setup Summary

**Date:** October 6, 2025  
**Status:** Implementation Ready  
**Priority:** HIGH

---

## Quick Overview

After reviewing the Clerk documentation and your project requirements, here's the recommended approach:

### ✅ **Decision: Use Clerk Metadata + Supabase RLS (NOT Clerk Organizations)**

**Why NOT Clerk Organizations?**

1. **Cost** - Clerk charges $1/MAO after 100 organizations on Pro plan
2. **Use Case Mismatch** - Clerk Organizations are for team collaboration, not tenant isolation
3. **Control** - We need full control over organization data in Supabase
4. **Flexibility** - Manufacturing-specific settings don't fit Clerk's model
5. **Simplicity** - We only need basic tenant isolation, not complex team hierarchies

### ✅ **Our Approach: Custom Multi-Tenancy**

```
User (Clerk Auth)
  └─ publicMetadata: { activeOrgId, role }
       └─ Supabase RLS reads JWT claims
            └─ Filters ALL queries by organization_id
```

**Benefits:**

- True data isolation at database level
- No additional costs beyond Clerk authentication
- Full control over organization structure
- Manufacturing-specific features (overhead rates, fiscal year, etc.)
- Supports users in multiple organizations

---

## Implementation Steps

### Step 1: Configure Clerk Session Token (5 min)

**Action:** Clerk Dashboard → Sessions → Customize session token

```json
{
  "metadata": "{{user.public_metadata}}"
}
```

This embeds user metadata in JWT so Supabase RLS can read it.

---

### Step 2: Create JWT Template for Supabase (5 min)

**Action:** Clerk Dashboard → JWT Templates → New Template

- **Name:** `supabase`
- **Claims:**

```json
{
  "metadata": "{{user.public_metadata}}",
  "sub": "{{user.id}}"
}
```

- **Lifetime:** 60 seconds

This creates a custom token Supabase can verify.

---

### Step 3: Run Database Migrations (2 min)

```powershell
# Already exists - just verify
supabase db push
```

**Verifies:**

- ✅ `organizations` table
- ✅ `organization_users` junction table
- ✅ `users_profile` for extended user data
- ✅ RLS policies enabled

---

### Step 4: Add Type Definitions (5 min)

**File:** `types/globals.d.ts`

```typescript
export type UserRole = 'admin' | 'manager' | 'operator'

export interface UserOrgMetadata {
  activeOrgId: string | null
  role?: UserRole
}

declare global {
  interface CustomJwtSessionClaims {
    metadata: UserOrgMetadata
  }
}
```

Provides TypeScript autocomplete for metadata.

---

### Step 5: Create Helper Functions (10 min)

**File:** `lib/auth/metadata.ts`

Key functions:

- `getActiveOrgId()` - Get current user's active org
- `getUserRole()` - Get user's role in active org
- `checkRole(role)` - Check if user has specific role
- `setActiveOrg(userId, orgId, role)` - Switch organizations

See full implementation in `docs/setup/clerk-supabase-implementation-plan.md`

---

### Step 6: Update RLS Policies (15 min)

**File:** `supabase/migrations/20251006000001_rls_with_clerk_jwt.sql`

Creates helper functions:

- `auth.active_org_id()` - Reads from JWT claims
- `auth.user_role()` - Reads role from JWT
- `auth.clerk_user_id()` - Gets Clerk user ID

Applies policies to all tables to filter by `organization_id`.

---

### Step 7: Configure Supabase Clients (10 min)

**Client-side:** `lib/supabase/client.ts`

```typescript
export function useSupabaseClient() {
  const { getToken } = useAuth()
  
  return createClient(url, anonKey, {
    global: {
      headers: async () => {
        const token = await getToken({ template: 'supabase' })
        return token ? { Authorization: `Bearer ${token}` } : {}
      },
    },
  })
}
```

**Server-side:** `lib/supabase/server.ts` (similar pattern)

---

### Step 8: Create Organization Context (20 min)

**File:** `contexts/organization-context.tsx`

Provides:

- `activeOrgId` - Current organization ID
- `role` - User's role in organization
- `isLoading` - Loading state
- `switchOrg(orgId, role)` - Change active organization

Syncs with Clerk metadata and triggers page reload on switch.

---

### Step 9: Build Organization Switcher (20 min)

**File:** `components/organization-switcher.tsx`

Dropdown showing all user's organizations with:

- Organization logo/icon
- Organization name
- Check mark for active org
- Click to switch

---

### Step 10: Create Onboarding Flow (20 min)

**File:** `app/onboarding/page.tsx`

First-time user experience:

1. User enters organization name
2. Creates organization in Supabase
3. Adds user as admin
4. Updates Clerk metadata
5. Redirects to dashboard

---

### Step 11: Update Middleware (10 min)

**File:** `middleware.ts`

Checks if user has `activeOrgId` in metadata:

- If yes → Allow access to protected routes
- If no → Redirect to `/onboarding`

---

## Total Time Estimate

**Setup Time:** ~2 hours for manual configuration + code implementation

**Breakdown:**

- Clerk Dashboard config: 10 minutes
- Database migrations: 5 minutes
- Helper functions: 30 minutes
- Supabase clients: 20 minutes
- Organization context: 30 minutes
- Organization switcher: 20 minutes
- Onboarding flow: 20 minutes
- Testing: 30 minutes

---

## Testing Checklist

### Critical Tests

- [ ] User can sign up and is redirected to onboarding
- [ ] User can create organization during onboarding
- [ ] User can only see data from their active organization (test with SQL)
- [ ] User with multiple orgs can switch between them
- [ ] Switching org updates all data queries
- [ ] Admin can delete records, operator cannot
- [ ] RLS prevents accessing other org's data (even with direct SQL)

### Edge Cases

- [ ] User removed from org is redirected to onboarding
- [ ] User with no orgs sees onboarding
- [ ] Session token refresh works after metadata update
- [ ] Page reload maintains organization context

---

## Environment Variables

Add to `.env.local`:

```bash
# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxx
CLERK_SECRET_KEY=sk_test_xxxxx
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup
NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL=/dashboard
NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL=/onboarding

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## Common Issues & Solutions

### Issue: "User has no active organization"

**Solution:** Force token refresh after updating metadata

```typescript
await getToken({ template: 'supabase', skipCache: true })
```

---

### Issue: RLS not filtering data

**Solution:** Verify JWT template includes metadata and check Supabase client headers

```typescript
const token = await getToken({ template: 'supabase' })
console.log('Token:', token) // Should contain metadata
```

---

### Issue: Organization switcher not updating UI

**Solution:** Invalidate queries or reload page

```typescript
await queryClient.invalidateQueries()
window.location.reload()
```

---

## Key Files to Create

1. `types/globals.d.ts` - TypeScript definitions
2. `lib/auth/metadata.ts` - Helper functions
3. `lib/supabase/client.ts` - Client-side Supabase
4. `lib/supabase/server.ts` - Server-side Supabase
5. `contexts/organization-context.tsx` - Organization state
6. `components/organization-switcher.tsx` - Switcher UI
7. `app/onboarding/page.tsx` - Onboarding flow
8. `supabase/migrations/20251006000001_rls_with_clerk_jwt.sql` - RLS policies

---

## Next Actions

1. **Immediate:** Configure Clerk Dashboard (session token + JWT template)
2. **Day 1:** Implement helper functions and Supabase clients
3. **Day 2:** Build organization context and switcher
4. **Day 3:** Create onboarding flow and test multi-tenancy
5. **Day 4:** Add role-based UI elements and polish

---

## References

- **Full Implementation Guide:** `docs/setup/clerk-supabase-implementation-plan.md`
- **Clerk RBAC Guide:** [https://clerk.com/docs/guides/secure/basic-rbac](https://clerk.com/docs/guides/secure/basic-rbac)
- **Supabase RLS:** [https://supabase.com/docs/guides/auth/row-level-security](https://supabase.com/docs/guides/auth/row-level-security)

---

## Summary

**This approach gives you:**

✅ True multi-tenancy with data isolation  
✅ No additional costs beyond base Clerk plan  
✅ Full control over organization data  
✅ Manufacturing-specific features  
✅ Support for users in multiple orgs  
✅ Role-based access control  
✅ Simple, maintainable architecture

**Start with:** Clerk Dashboard configuration (10 minutes), then follow the step-by-step implementation guide.

---

**Questions?** See full details in `clerk-supabase-implementation-plan.md` or ask!
