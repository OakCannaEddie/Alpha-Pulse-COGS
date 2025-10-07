# Clerk Session JWT Timing Issue

**Problem**: Organizations create successfully in the database, but users are redirected back to the onboarding page or see errors when trying to access the dashboard.

**Status**: ✅ RESOLVED

---

## Root Cause

This is a **JWT timing/caching issue** with Clerk authentication:

1. **User creates organization** → API updates Clerk `publicMetadata.activeOrgId`
2. **API returns success** → Frontend receives confirmation
3. **⚠️ Problem**: Clerk's JWT is cached and hasn't regenerated with new metadata yet
4. **Page redirects** → Middleware reads stale JWT (no `activeOrgId` in session claims)
5. **Middleware redirects back** → User sent back to `/onboarding` despite org being created

## Technical Details

### How Clerk + Supabase RLS Works

```typescript
// 1. Clerk provides JWT with user claims
const clerkToken = await session.getToken({ template: 'supabase' })

// 2. Supabase client uses JWT for authentication
headers.set('Authorization', `Bearer ${clerkToken}`)

// 3. Supabase RLS policies extract user ID from JWT
CREATE FUNCTION requesting_user_id() RETURNS text AS $$
    SELECT current_setting('request.jwt.claims', true)::json->>'sub'
$$;

// 4. RLS policies check organization membership
CREATE POLICY "Users can view their organizations" ON organizations
    FOR SELECT USING (
        id IN (
            SELECT organization_id 
            FROM organization_users 
            WHERE user_id = requesting_user_id()
        )
    );
```

### The Timing Problem

```
API Call                          │ Frontend                    │ Database
─────────────────────────────────┼────────────────────────────┼──────────────────
POST /api/organizations/create   │                             │
  ↓                               │                             │
Create organization               │                             │ ✓ org created
Create organization_users         │                             │ ✓ membership created
Update user_profiles              │                             │ ✓ profile updated
Update Clerk metadata:            │                             │
  activeOrgId = "org-123"         │                             │
  ↓                               │                             │
Return 201 Success               │                             │
                                  │ ← Response received         │
                                  │ session.reload()  ← FIX!   │
                                  │   Wait 500ms               │
                                  │ window.location.href       │
                                  │   = '/dashboard'           │
                                  │   ↓                        │
Middleware checks JWT            │                             │
  sessionClaims.publicMetadata   │                             │
  .activeOrgId                   │                             │
  ↓                               │                             │
✅ activeOrgId found              │                             │
Allow access to /dashboard       │                             │
```

**Without the fix:**
- JWT cached, `activeOrgId` not in claims
- Middleware sees no `activeOrgId` → redirects to `/onboarding`

**With the fix:**
- `session.reload()` forces Clerk to fetch fresh JWT
- Wait 500ms for JWT propagation
- Middleware sees `activeOrgId` → allows dashboard access

---

## The Solution

### Code Changes

**Before (BROKEN):**
```typescript
// In app/onboarding/page.tsx
const data = await response.json()

toast({ title: 'Organization created!' })

setTimeout(() => {
  window.location.href = '/dashboard'
}, 1500)
```

**After (FIXED):**
```typescript
// In app/onboarding/page.tsx
import { useSession } from '@clerk/nextjs'

const { session } = useSession()

// After API success...
const data = await response.json()

toast({ 
  title: 'Organization created!',
  description: 'Setting up your workspace...'
})

// Force Clerk to fetch fresh JWT with updated metadata
if (session) {
  await session.reload()
  console.log('Session reloaded successfully')
}

// Wait for JWT propagation
await new Promise(resolve => setTimeout(resolve, 500))

// Now redirect with fresh JWT
window.location.href = '/dashboard'
```

### Why This Works

1. **`session.reload()`** - Forces Clerk to fetch a fresh session object with updated `publicMetadata`
2. **`await`** - Ensures we wait for the reload to complete before redirecting
3. **500ms delay** - Additional safety margin for JWT propagation across Clerk's systems
4. **`window.location.href`** - Full page reload ensures middleware gets fresh JWT from Clerk

---

## Alternative Solutions Considered

### ❌ Option 1: `router.refresh()` only
```typescript
router.push('/dashboard')
router.refresh() // Only refreshes Next.js cache, NOT Clerk session
```
**Problem**: `router.refresh()` only invalidates Next.js data cache, doesn't trigger Clerk JWT refresh.

### ❌ Option 2: Longer setTimeout
```typescript
setTimeout(() => {
  window.location.href = '/dashboard'
}, 5000) // Hope JWT updates in time
```
**Problem**: Unreliable, poor UX (5 second wait), still doesn't guarantee JWT refresh.

### ❌ Option 3: Polling for updated metadata
```typescript
const checkMetadata = async () => {
  await user?.reload()
  return user?.publicMetadata?.activeOrgId === newOrgId
}

while (!(await checkMetadata())) {
  await new Promise(r => setTimeout(r, 200))
}
```
**Problem**: Complex, multiple API calls, still relies on timing.

### ✅ Option 4: `session.reload()` + delay (CHOSEN)
- Explicitly forces JWT refresh
- Simple and reliable
- Clear intent in code
- Good UX with loading message

---

## Testing

### How to Verify the Fix

1. **Clear browser data** (localStorage, cookies) to reset state
2. **Sign out** from Clerk completely
3. **Sign in** with a new test user
4. **Navigate to** `/onboarding`
5. **Create organization** with unique name/slug
6. **Observe in browser console:**
   ```
   Creating organization: { name: "Test Org", slug: "test-org" }
   API Response: { ok: true, status: 201, data: {...} }
   Organization created successfully: {...}
   Reloading Clerk session to get updated JWT...
   Session reloaded successfully
   Redirecting to dashboard...
   ```
7. **Expected result**: Redirected to `/dashboard` successfully
8. **Verify in database**: Check `organizations`, `organization_users`, `user_profiles` tables

### What to Check If Still Failing

1. **Clerk JWT Template Configuration**
   - Go to Clerk Dashboard → JWT Templates
   - Ensure "Supabase" template exists
   - Verify `publicMetadata` is included in claims

2. **Environment Variables**
   ```env
   # Server-side only (NO NEXT_PUBLIC_ prefix)
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...
   
   # Client-side safe
   NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   ```

3. **Database State**
   ```sql
   -- Check if org was created
   SELECT * FROM organizations WHERE slug = 'test-org';
   
   -- Check if membership was created
   SELECT * FROM organization_users 
   WHERE organization_id = 'org-id-here';
   
   -- Check if profile was updated
   SELECT * FROM user_profiles WHERE id = 'user-id-here';
   ```

4. **Clerk Metadata**
   - Check Clerk Dashboard → Users → Select user
   - Verify `publicMetadata` contains `{ "activeOrgId": "uuid" }`

5. **Middleware Logs**
   ```typescript
   // Add to middleware.ts for debugging
   console.log('Session claims:', sessionClaims)
   console.log('Active org ID:', sessionClaims.publicMetadata?.activeOrgId)
   ```

---

## Related Issues

- [Environment Variables Setup](../setup/environment-variables.md)
- [Organization Creation Fix](./organization-creation-fix.md)
- [Multi-Tenant RLS Policies](../features/organization-system.md#row-level-security)

---

## Prevention

**Future Consideration**: Implement a more robust session synchronization pattern:

```typescript
// services/clerk-session.service.ts
export async function waitForMetadataUpdate(
  session: Session,
  checkFn: (metadata: any) => boolean,
  options = { maxAttempts: 10, delayMs: 300 }
) {
  for (let i = 0; i < options.maxAttempts; i++) {
    await session.reload()
    const metadata = session.user?.publicMetadata
    
    if (checkFn(metadata)) {
      return true
    }
    
    await new Promise(r => setTimeout(r, options.delayMs))
  }
  
  throw new Error('Timeout waiting for metadata update')
}

// Usage
await waitForMetadataUpdate(
  session,
  (metadata) => metadata.activeOrgId === newOrgId
)
```

This would eliminate the fixed 500ms delay and handle edge cases better.

---

**Last Updated**: 2024-01-15  
**Status**: Resolved  
**Affected Files**: 
- `app/onboarding/page.tsx`
