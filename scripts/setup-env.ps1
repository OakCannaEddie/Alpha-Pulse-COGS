# Add Supabase Environment Variables Helper Script
# This script helps you add the missing Supabase keys to .env.local

Write-Host "`n=== Supabase Environment Variables Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env.local exists
if (Test-Path .env.local) {
    Write-Host "✓ Found .env.local file" -ForegroundColor Green
} else {
    Write-Host "✗ .env.local file not found" -ForegroundColor Red
    exit 1
}

# Check current content
$envContent = Get-Content .env.local -Raw

# Check what's missing
$hasUrl = $envContent -match "NEXT_PUBLIC_SUPABASE_URL"
$hasAnonKey = $envContent -match "NEXT_PUBLIC_SUPABASE_ANON_KEY"
$hasServiceKey = $envContent -match "SUPABASE_SERVICE_ROLE_KEY"

Write-Host "`nCurrent Status:" -ForegroundColor Yellow
Write-Host "  NEXT_PUBLIC_SUPABASE_URL:     $($hasUrl ? '✓ Present' : '✗ Missing')" -ForegroundColor $($hasUrl ? 'Green' : 'Red')
Write-Host "  NEXT_PUBLIC_SUPABASE_ANON_KEY: $($hasAnonKey ? '✓ Present' : '✗ Missing')" -ForegroundColor $($hasAnonKey ? 'Green' : 'Red')
Write-Host "  SUPABASE_SERVICE_ROLE_KEY:    $($hasServiceKey ? '✓ Present' : '✗ Missing')" -ForegroundColor $($hasServiceKey ? 'Green' : 'Red')

if ($hasUrl -and $hasAnonKey -and $hasServiceKey) {
    Write-Host "`n✓ All Supabase environment variables are configured!" -ForegroundColor Green
    Write-Host "  You can now run: npm run dev" -ForegroundColor Cyan
    exit 0
}

Write-Host "`n" -NoNewline
Write-Host "⚠️  Missing environment variables detected!" -ForegroundColor Yellow
Write-Host ""
Write-Host "To fix this error, you need to:" -ForegroundColor White
Write-Host "  1. Go to: https://supabase.com/dashboard" -ForegroundColor Cyan
Write-Host "  2. Select your project: zebrmdpgpwfpedirokmv" -ForegroundColor Cyan
Write-Host "  3. Navigate to: Settings > API" -ForegroundColor Cyan
Write-Host "  4. Copy the following keys:" -ForegroundColor Cyan
Write-Host "     - anon / public key" -ForegroundColor Gray
Write-Host "     - service_role key" -ForegroundColor Gray
Write-Host ""

# Interactive mode
Write-Host "Would you like to add them now? (Y/N): " -NoNewline -ForegroundColor Yellow
$response = Read-Host

if ($response -eq 'Y' -or $response -eq 'y') {
    Write-Host ""
    
    # Get ANON key
    if (-not $hasAnonKey) {
        Write-Host "Enter your NEXT_PUBLIC_SUPABASE_ANON_KEY: " -NoNewline -ForegroundColor Cyan
        $anonKey = Read-Host
        
        if ($anonKey) {
            Add-Content -Path .env.local -Value "`nNEXT_PUBLIC_SUPABASE_ANON_KEY=$anonKey"
            Write-Host "✓ Added NEXT_PUBLIC_SUPABASE_ANON_KEY" -ForegroundColor Green
        }
    }
    
    # Get SERVICE_ROLE key
    if (-not $hasServiceKey) {
        Write-Host "Enter your SUPABASE_SERVICE_ROLE_KEY: " -NoNewline -ForegroundColor Cyan
        $serviceKey = Read-Host
        
        if ($serviceKey) {
            Add-Content -Path .env.local -Value "SUPABASE_SERVICE_ROLE_KEY=$serviceKey"
            Write-Host "✓ Added SUPABASE_SERVICE_ROLE_KEY" -ForegroundColor Green
        }
    }
    
    Write-Host "`n✓ Environment variables updated!" -ForegroundColor Green
    Write-Host "  Please restart your development server:" -ForegroundColor Yellow
    Write-Host "  npm run dev" -ForegroundColor Cyan
} else {
    Write-Host "`nManually add the following to your .env.local file:" -ForegroundColor Yellow
    Write-Host ""
    if (-not $hasAnonKey) {
        Write-Host "NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here" -ForegroundColor Gray
    }
    if (-not $hasServiceKey) {
        Write-Host "SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here" -ForegroundColor Gray
    }
    Write-Host ""
    Write-Host "See documentation/setup/environment-variables.md for detailed instructions" -ForegroundColor Cyan
}

Write-Host ""
