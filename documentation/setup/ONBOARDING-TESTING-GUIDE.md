# Onboarding Flow Testing Guide

## Overview
This guide outlines how to test the complete onboarding flow for new users after implementing the organization setup system.

## Prerequisites

### 1. Database Setup
Before testing, ensure the database migration has been applied:

```bash
# Navigate to project root
cd codeguide-starter-pro

# Apply the migration using Supabase CLI
npx supabase db push

# Or apply manually via Supabase Dashboard
# 1. Go to your Supabase Dashboard
# 2. Navigate to SQL Editor
# 3. Run the contents of: supabase/migrations/20250206000001_core_organization_schema.sql
```

### 2. Environment Variables
Ensure these environment variables are set in your `.env.local`:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/login
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/signup

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Start Development Server
```bash
npm run dev
```

## Testing Flow

### Test Case 1: Complete Organization Setup

**Steps:**
1. Navigate to `/signup`
2. Create a new account with a test email
3. Complete Clerk email verification
4. Should automatically redirect to `/onboarding`
5. Verify onboarding page displays:
   - Welcome message with user's name/email
   - Organization setup card (enabled)
   - Data import card (disabled)
   - Quick start option
6. Click "Start Organization Setup"
7. Complete the 3-step form:
   - **Step 1 (Basic Info)**: Company name, industry, size
   - **Step 2 (Details)**: Manufacturing type, address, currency
   - **Step 3 (Preferences)**: Time zone, accounting method
8. Submit the form
9. Should redirect to `/dashboard`

**Expected Results:**
- Organization created in database
- User becomes owner of organization
- No compilation errors during form submission
- Successful redirect to dashboard

### Test Case 2: Quick Start Option

**Steps:**
1. Follow steps 1-5 from Test Case 1
2. Click "Continue to Dashboard" (green button)
3. Should redirect to `/dashboard`

**Expected Results:**
- User proceeds without creating organization
- No errors during navigation
- Dashboard loads successfully

### Test Case 3: User Already Has Organization

**Steps:**
1. Using an account that already completed organization setup
2. Navigate directly to `/onboarding`
3. Should automatically redirect to `/dashboard`

**Expected Results:**
- Immediate redirect (no onboarding page displayed)
- No infinite redirect loops

### Test Case 4: Loading States

**Steps:**
1. Navigate to `/onboarding` with slow network
2. Verify skeleton loading states display correctly
3. Verify smooth transition to content once loaded

**Expected Results:**
- Skeleton placeholders shown during loading
- No content flash or layout shift
- Graceful transition to actual content

## Database Verification

After completing organization setup, verify in Supabase:

### Organizations Table
```sql
SELECT * FROM organizations;
```
Should show the created organization with:
- Unique `id`
- Company `name` from form
- Selected `industry`
- Proper timestamps

### Organization Users Table
```sql
SELECT * FROM organization_users WHERE user_id = 'clerk_user_id';
```
Should show:
- User linked to organization
- `role` set to 'owner'
- `is_active` set to true

### Users Profile Table
```sql
SELECT * FROM users_profile WHERE clerk_user_id = 'clerk_user_id';
```
Should show:
- User profile created/updated
- Proper email and name mapping

## Error Scenarios to Test

### 1. Form Validation
- Try submitting empty required fields
- Test invalid email formats
- Test boundary cases (very long names, etc.)

### 2. Network Issues
- Test form submission with poor connectivity
- Verify error messages display properly
- Test retry mechanisms

### 3. Authentication Edge Cases
- Test expired sessions during onboarding
- Test rapid page navigation
- Test browser back/forward buttons

## Common Issues & Solutions

### Issue: "Cannot find module '@/utils/supabase/client'"
**Solution:** 
- Restart TypeScript service in VS Code (Cmd/Ctrl + Shift + P → "TypeScript: Restart TS Server")
- Verify tsconfig.json has correct path mapping

### Issue: Database connection errors
**Solution:**
- Verify Supabase environment variables
- Check database migration status
- Ensure Row Level Security policies are active

### Issue: Clerk authentication not working
**Solution:**
- Verify Clerk environment variables
- Check middleware configuration
- Ensure sign-in/sign-up URLs match routes

### Issue: Form submission fails silently
**Solution:**
- Check browser console for errors
- Verify React Query dev tools for failed mutations
- Check network tab for API request failures

## Performance Considerations

- Page should load within 2 seconds on good connection
- Form submission should complete within 5 seconds
- No memory leaks during navigation
- Responsive design works on mobile devices

## Next Steps After Testing

Once onboarding flow is verified:
1. Implement dashboard content
2. Add organization settings page
3. Build invitation system for team members
4. Add data import functionality
5. Implement role-based permissions

---

*Last updated: 2024-01-15*
*For support: Check project documentation or create GitHub issue*