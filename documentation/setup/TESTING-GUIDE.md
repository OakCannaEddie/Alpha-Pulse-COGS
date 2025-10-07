# Testing Guide - Pulse COGS

## Overview

This guide covers how to test the authentication and database integration for Pulse COGS. We've created comprehensive test suites to verify that Clerk authentication, Supabase database connection, and all integrations are working correctly.

---

## Quick Start

### 1. Visual Test Dashboard

Visit the test dashboard in your browser:

```
http://localhost:3000/test
```

Click **"Run All Tests"** to execute all test suites and see results in real-time.

### 2. API Endpoints

You can also run tests via API endpoints:

**Health Check:**
```bash
curl http://localhost:3000/api/health
```

**Authentication Tests:**
```bash
curl http://localhost:3000/api/test/auth
```

**Database Tests:**
```bash
curl http://localhost:3000/api/test/database
```

---

## Test Suites

### 1. Health Check (`/api/health`)

**Purpose**: Verify all system components are configured and accessible

**Tests:**
- ✅ Environment variables configured
- ✅ Clerk authentication setup
- ✅ Supabase database connection
- ✅ RLS helper functions exist

**Response Codes:**
- `200` - All systems healthy
- `207` - Degraded (some warnings)
- `503` - Unhealthy (failures detected)

**Example Response:**
```json
{
  "timestamp": "2024-01-06T12:00:00.000Z",
  "overall": "healthy",
  "checks": {
    "environment": {
      "status": "pass",
      "details": {
        "required": {
          "present": ["NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY", ...],
          "missing": []
        }
      }
    },
    "clerk": {
      "status": "pass",
      "details": {
        "configured": true,
        "authenticated": true,
        "userId": "user_abc123"
      }
    },
    "database": {
      "status": "pass",
      "details": {
        "connected": true,
        "url": "https://xxx.supabase.co"
      }
    },
    "rls": {
      "status": "pass",
      "details": {
        "functionsExist": true
      }
    }
  }
}
```

---

### 2. Authentication Tests (`/api/test/auth`)

**Purpose**: Verify Clerk integration and JWT token handling

**Tests:**

#### Test 1: Clerk Authentication Working
- Verifies Clerk can authenticate users
- Retrieves user data successfully
- **Requires**: User must be logged in

#### Test 2: JWT Contains Custom Claims
- Verifies JWT includes `publicMetadata`
- Checks for `activeOrgId` and `role` in metadata
- **Requires**: Clerk JWT template configured

#### Test 3: Metadata Helper Functions
- Tests `getActiveOrgId()` function
- Tests `getUserRole()` function
- Tests `checkRole()` function
- **Requires**: User has organization assigned

#### Test 4: Metadata Update (Optional)
- Tests updating user's organization metadata
- Verifies changes persist in Clerk
- **Requires**: Admin access

#### Test 5: User Profile Access
- Tests retrieving complete user profile
- Verifies all user data accessible
- **Requires**: Valid session

**Example Response:**
```json
{
  "success": true,
  "summary": {
    "total": 4,
    "passed": 4,
    "failed": 0,
    "timestamp": "2024-01-06T12:00:00.000Z"
  },
  "tests": [
    {
      "passed": true,
      "message": "Clerk authentication working correctly",
      "details": {
        "userId": "user_abc123",
        "email": "user@example.com"
      }
    },
    ...
  ]
}
```

---

### 3. Database Tests (`/api/test/database`)

**Purpose**: Verify Supabase connection and RLS policies

**Tests:**

#### Test 1: Environment Variables
- Checks Supabase URL configured
- Checks anon key configured
- Checks service role key configured (optional)

#### Test 2: Database Connection
- Tests basic Supabase connection
- Queries organizations table
- Verifies network connectivity

#### Test 3: RLS Helper Functions
- Verifies `auth.clerk_user_id()` exists
- Verifies `auth.active_org_id()` exists
- Verifies `auth.user_role()` exists
- **Requires**: Migration deployed

#### Test 4: Server Client Creation
- Tests creating RLS-enforced server client
- Verifies client can query database
- **Requires**: Valid Clerk session

#### Test 5: Admin Client Creation
- Tests creating admin client with service role
- Verifies admin can bypass RLS
- **Requires**: Service role key

#### Test 6: Table Accessibility
- Tests all required tables exist
- Verifies tables are queryable
- **Requires**: Migration deployed

**Example Response:**
```json
{
  "success": true,
  "summary": {
    "total": 6,
    "passed": 6,
    "failed": 0,
    "timestamp": "2024-01-06T12:00:00.000Z"
  },
  "tests": [
    {
      "passed": true,
      "message": "Supabase environment variables configured",
      "details": {
        "url": "https://xxx.supabase.co",
        "hasServiceKey": true
      }
    },
    ...
  ]
}
```

---

## Common Test Scenarios

### Scenario 1: Fresh Installation

**Run tests in this order:**

1. **Health Check** - Verify environment setup
   ```bash
   curl http://localhost:3000/api/health
   ```
   
2. If health check fails on RLS:
   ```bash
   supabase db push
   ```

3. **Database Tests** - Verify Supabase connection
   ```bash
   curl http://localhost:3000/api/test/database
   ```

4. Log in via `/login`

5. **Auth Tests** - Verify Clerk integration
   ```bash
   curl http://localhost:3000/api/test/auth
   ```

---

### Scenario 2: Debugging Authentication Issues

**Problem**: Login page is blank or not working

**Steps:**

1. Check health status:
   ```bash
   curl http://localhost:3000/api/health | jq '.checks.clerk'
   ```

2. Verify Clerk env vars:
   ```bash
   echo $NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
   echo $CLERK_SECRET_KEY
   ```

3. Check browser console for errors

4. Verify Clerk Dashboard:
   - Application exists
   - API keys match .env.local
   - JWT template configured

---

### Scenario 3: Database Connection Issues

**Problem**: Cannot query database

**Steps:**

1. Check database status:
   ```bash
   curl http://localhost:3000/api/health | jq '.checks.database'
   ```

2. Verify Supabase env vars:
   ```bash
   echo $NEXT_PUBLIC_SUPABASE_URL
   echo $NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```

3. Test direct connection:
   ```bash
   supabase status
   ```

4. Check RLS functions:
   ```bash
   curl http://localhost:3000/api/test/database | jq '.tests[2]'
   ```

5. If RLS functions missing:
   ```bash
   supabase db push
   ```

---

### Scenario 4: Organization/Metadata Issues

**Problem**: User redirected to onboarding after login

**Steps:**

1. Check user metadata:
   ```bash
   curl http://localhost:3000/api/test/auth | jq '.tests[1]'
   ```

2. Verify JWT template in Clerk Dashboard:
   - Template named "supabase"
   - Includes: `"publicMetadata": "{{user.public_metadata}}"`

3. Check organization membership:
   ```sql
   -- In Supabase SQL Editor
   SELECT * FROM organization_users WHERE clerk_user_id = 'your_user_id';
   ```

4. Manually set metadata via Clerk Dashboard:
   - Go to Users → Select User → Metadata
   - Add public metadata:
     ```json
     {
       "activeOrgId": "your_org_id",
       "role": "admin"
     }
     ```

---

## Test Files Reference

### Health Check API
**File**: `app/api/health/route.ts`
- Comprehensive system health check
- Returns detailed diagnostics
- No authentication required

### Auth Test Utilities
**File**: `lib/testing/auth-tests.ts`
- `testClerkAuthentication()` - Verify Clerk working
- `testJwtCustomClaims()` - Verify JWT template
- `testMetadataHelpers()` - Test helper functions
- `testUserProfile()` - Test user data access
- `runAuthTestSuite()` - Run all auth tests

### Database Test Utilities
**File**: `lib/testing/database-tests.ts`
- `testSupabaseEnvironment()` - Verify env vars
- `testDatabaseConnection()` - Test connection
- `testRlsHelperFunctions()` - Verify RLS functions
- `testServerClientCreation()` - Test server client
- `testAdminClientCreation()` - Test admin client
- `testTableAccessibility()` - Verify tables exist
- `runDatabaseTestSuite()` - Run all database tests

### Test Dashboard
**File**: `app/test/page.tsx`
- Visual test runner
- Real-time results
- Detailed error messages
- JSON output for debugging

---

## Automated Testing

### Using in CI/CD

Add to your CI pipeline:

```yaml
# .github/workflows/test.yml
- name: Run Health Check
  run: |
    curl -f http://localhost:3000/api/health || exit 1

- name: Run Auth Tests
  run: |
    curl -f http://localhost:3000/api/test/auth || exit 1

- name: Run Database Tests
  run: |
    curl -f http://localhost:3000/api/test/database || exit 1
```

### Using with Jest/Vitest

```typescript
import { runAuthTestSuite } from '@/lib/testing/auth-tests'
import { runDatabaseTestSuite } from '@/lib/testing/database-tests'

describe('Authentication', () => {
  it('should pass all auth tests', async () => {
    const results = await runAuthTestSuite()
    expect(results.failed).toBe(0)
  })
})

describe('Database', () => {
  it('should pass all database tests', async () => {
    const results = await runDatabaseTestSuite()
    expect(results.failed).toBe(0)
  })
})
```

---

## Troubleshooting

### All Tests Failing

**Possible Causes:**
- Environment variables not loaded
- Development server not running
- Database not accessible

**Solutions:**
1. Restart development server
2. Check `.env.local` exists and is correct
3. Run `supabase start` if using local Supabase

### Only Auth Tests Failing

**Possible Causes:**
- Clerk not configured correctly
- JWT template missing
- User not logged in

**Solutions:**
1. Verify Clerk Dashboard setup
2. Add JWT template with `publicMetadata`
3. Log in via `/login` before running tests

### Only Database Tests Failing

**Possible Causes:**
- Supabase not accessible
- Migration not deployed
- RLS policies blocking access

**Solutions:**
1. Check Supabase status
2. Run `supabase db push`
3. Verify RLS policies allow access

---

## Best Practices

1. **Run tests after every major change** - Catch issues early
2. **Check health endpoint first** - Quick overview of system status
3. **Test as different users** - Verify role-based access works
4. **Test with multiple organizations** - Ensure data isolation
5. **Monitor test results in logs** - Server-side logs show detailed output
6. **Use test dashboard during development** - Visual feedback is faster

---

## Next Steps

After all tests pass:

1. ✅ **Test signup flow** - Create new account via `/signup`
2. ✅ **Test onboarding** - Create first organization
3. ✅ **Test organization switching** - Switch between orgs
4. ✅ **Test role permissions** - Verify admin/manager/operator access
5. ✅ **Build features** - Start implementing manufacturing features

---

*For issues or questions, check the logs or run tests with detailed output enabled.*
