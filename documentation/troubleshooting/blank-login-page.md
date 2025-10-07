# 🔧 Blank Login Page - Diagnostic Guide

## Problem
The login page appears blank when you navigate to `/login`.

## Common Causes & Solutions

### 1. Missing Environment Variables ⚠️ **MOST COMMON**

**Symptom**: Page loads but Clerk component doesn't render.

**Diagnosis**:
```bash
npm run test:env
```

**Solution**:
1. Create `.env.local` from the template:
   ```bash
   cp .env.example .env.local
   ```

2. Add your Clerk credentials:
   - Go to https://dashboard.clerk.com
   - Navigate to **API Keys**
   - Copy `Publishable Key` → `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - Copy `Secret Key` → `CLERK_SECRET_KEY`

3. Restart the dev server:
   ```bash
   npm run dev
   ```

### 2. Incorrect Clerk Keys

**Symptom**: Console errors mentioning Clerk or authentication.

**Check**:
- Open browser DevTools (F12) → Console tab
- Look for errors like "Invalid publishable key" or "Failed to load"

**Solution**:
- Verify you're using keys from the **correct Clerk project**
- Ensure you're using **test keys** (starting with `pk_test_` and `sk_test_`) for development
- Keys should match the environment (development vs production)

### 3. Dev Server Not Restarted

**Symptom**: Changed environment variables but no effect.

**Solution**:
```bash
# Stop the server (Ctrl+C)
npm run dev
```

Next.js caches environment variables at startup. You **must** restart after changing `.env.local`.

### 4. Clerk Service Outage (Rare)

**Check**: https://status.clerk.com

**Temporary Solution**: Wait for Clerk services to resume.

## Step-by-Step Diagnostic

Run these commands in order:

### Step 1: Check Environment
```bash
npm run test:env
```

**Expected Output**:
```
✓ All required environment variables are set
✓ Clerk publishable key format is valid
✓ Clerk secret key format is valid
```

**If Failed**:
- See "Missing Environment Variables" above
- Ensure `.env.local` exists and contains valid values

### Step 2: Check Clerk API
```bash
npm run test:clerk
```

**Expected Output**:
```
✓ Successfully connected to Clerk API
✓ Found "supabase" JWT template
```

**If Failed**:
- Verify Clerk keys are correct
- Check internet connection
- Verify Clerk dashboard is accessible

### Step 3: Browser Console Check

1. Open browser DevTools (Press F12)
2. Go to **Console** tab
3. Refresh the page
4. Look for errors

**Common Errors**:

#### "Clerk: Invalid publishable key"
→ Wrong key format or empty key
→ Check `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env.local`

#### "Network error" or "Failed to fetch"
→ Can't reach Clerk servers
→ Check internet connection or firewall settings

#### "Hydration error"
→ Server/client mismatch
→ Clear browser cache and restart dev server

### Step 4: Network Tab Check

1. Open DevTools → **Network** tab
2. Refresh the page
3. Look for requests to `clerk.com` or `accounts.clerk.com`

**Healthy Signs**:
- Multiple requests to Clerk domains
- Status codes: 200 (OK) or 304 (Cached)

**Problem Signs**:
- No Clerk requests → Environment variables not loaded
- 401/403 errors → Invalid API keys
- 404 errors → Incorrect API endpoint

## Quick Fix Checklist

Try these in order:

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set and starts with `pk_`
- [ ] `CLERK_SECRET_KEY` is set and starts with `sk_`
- [ ] Keys are from the correct Clerk project
- [ ] Dev server was restarted after adding environment variables
- [ ] Browser was hard-refreshed (Ctrl+Shift+R or Cmd+Shift+R)
- [ ] No console errors in browser DevTools
- [ ] Clerk status page shows all systems operational

## Still Not Working?

### Full Reset Procedure

1. **Stop the dev server** (Ctrl+C)

2. **Clear Next.js cache**:
   ```bash
   rm -rf .next
   # On Windows PowerShell:
   # Remove-Item -Recurse -Force .next
   ```

3. **Verify environment file**:
   ```bash
   cat .env.local
   # On Windows:
   # Get-Content .env.local
   ```
   
   Should show your Clerk keys (not the example placeholders!)

4. **Re-install dependencies** (if needed):
   ```bash
   rm -rf node_modules package-lock.json
   npm install
   ```

5. **Start fresh**:
   ```bash
   npm run dev
   ```

6. **Test in incognito/private window**:
   - Eliminates cache issues
   - Visit: http://localhost:3000/login

## Advanced Debugging

### Check Clerk Component Rendering

Add this to `app/login/page.tsx` temporarily:

```tsx
export default function LoginPage() {
  console.log('Login page rendering')
  console.log('Clerk key:', process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.slice(0, 10))
  
  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-md">
        <SignIn 
          // ... existing props
        />
      </div>
    </div>
  )
}
```

Check the console output. If you see "undefined" for the Clerk key, environment variables aren't loading.

### Verify Clerk Provider

The app should be wrapped with `<ClerkProvider>` in `app/layout.tsx`.

Check that it looks like this:
```tsx
<ClerkProvider>
  <html>
    <body>
      {children}
    </body>
  </html>
</ClerkProvider>
```

## Getting Help

If none of the above works:

1. **Gather information**:
   - Run: `npm run test`
   - Screenshot any console errors
   - Note your Node.js version: `node --version`
   - Note your npm version: `npm --version`

2. **Check the logs**:
   - Terminal output from `npm run dev`
   - Browser console (F12)
   - Network tab showing failed requests

3. **Common info needed for support**:
   - Operating system
   - Node.js version
   - Browser and version
   - Error messages (full text)
   - Environment variable status (from `npm run test:env`)

## Prevention

To avoid this issue in the future:

1. **Always use `.env.local` for local development**
2. **Never commit `.env.local` to git** (already in `.gitignore`)
3. **Run tests before starting development**: `npm test`
4. **Keep Clerk and Supabase dashboards bookmarked** for quick access to keys
5. **Document your environment setup** in a private notes file

---

**TL;DR**: 99% of the time this is missing or incorrect environment variables. Run `npm run test:env` and follow the instructions.
