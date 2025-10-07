# Environment Setup Guide

## Required Environment Variables

Your `.env.local` file is missing required Supabase environment variables. Follow these steps to fix the error.

## Step 1: Get Your Supabase Keys

1. Go to your Supabase project dashboard: https://supabase.com/dashboard
2. Select your project: `zebrmdpgpwfpedirokmv`
3. Navigate to **Settings** > **API**
4. You'll find two keys:
   - **anon / public** key (starts with `eyJ...`)
   - **service_role** key (starts with `eyJ...`)

## Step 2: Update Your .env.local File

Add the following lines to your `.env.local` file:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://zebrmdpgpwfpedirokmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here
```

Replace:
- `your_anon_key_here` with the **anon / public** key from Supabase
- `your_service_role_key_here` with the **service_role** key from Supabase

## Step 3: Restart Development Server

After adding the environment variables:

```powershell
# Stop the current dev server (Ctrl+C)
# Then restart it
npm run dev
```

## Security Note

⚠️ **IMPORTANT**: The `SUPABASE_SERVICE_ROLE_KEY` is a secret key that bypasses Row Level Security. 

- **NEVER** expose it to the client side
- **NEVER** commit it to version control
- Only use it in API routes (server-side code)
- The `.env.local` file is already in `.gitignore` to protect it

## Verification

To verify your setup is correct:

1. Check that both keys are added to `.env.local`
2. Both keys should start with `eyJ`
3. The anon key is safe to expose on the client
4. The service role key must remain server-side only

## Troubleshooting

### Still getting "supabaseKey is required" error?

1. Double-check that you saved the `.env.local` file
2. Ensure there are no extra spaces or quotes around the keys
3. Restart your development server completely
4. Check that the file is in the root directory of your project

### Can't find the keys in Supabase?

1. Make sure you're logged into the correct Supabase account
2. Check that you're viewing the correct project
3. If you can't see the API settings, you may not have admin access

### Keys not working?

1. Verify you copied the complete key (they're very long)
2. Check for any accidental line breaks in the key
3. Make sure you're using the keys from the correct project

## Example .env.local File

Your complete `.env.local` should look something like:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://zebrmdpgpwfpedirokmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Other services...
```

---

**Need more help?** Check the [Supabase documentation](https://supabase.com/docs/guides/api/api-keys) for detailed information about API keys.
