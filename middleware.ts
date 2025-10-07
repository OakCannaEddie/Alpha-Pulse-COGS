import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

// Define protected routes that require authentication
const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)', 
  '/inventory(.*)',
  '/production(.*)',
  '/suppliers(.*)',
  '/purchase-orders(.*)',
  '/reports(.*)',
  '/settings(.*)',
  '/protected(.*)'
])

// Define public routes that should be accessible without auth
const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks(.*)'
])

// Routes that don't require organization (onboarding page)
const isOnboardingRoute = createRouteMatcher(['/onboarding(.*)'])

export default clerkMiddleware(async (auth, req) => {
  const { userId, sessionClaims } = await auth()
  const { pathname } = req.nextUrl

  // If user is trying to access a protected route
  if (isProtectedRoute(req)) {
    // Require authentication
    await auth.protect()
    
    // If authenticated but no userId (edge case), redirect to sign-in
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }

    // Check if user has an active organization (except for onboarding route)
    if (!isOnboardingRoute(req)) {
      const publicMetadata = sessionClaims?.publicMetadata as { activeOrgId?: string } | undefined
      const activeOrgId = publicMetadata?.activeOrgId
      
      // If no active organization, redirect to onboarding
      if (!activeOrgId) {
        return NextResponse.redirect(new URL('/onboarding', req.url))
      }
    }
  }

  // If user is authenticated and on root or auth pages, redirect to dashboard
  if (userId && (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up')) {
    // Check if user has active organization
    const publicMetadata = sessionClaims?.publicMetadata as { activeOrgId?: string } | undefined
    const activeOrgId = publicMetadata?.activeOrgId
    
    if (activeOrgId) {
      return NextResponse.redirect(new URL('/dashboard', req.url))
    } else {
      // No org, send to onboarding
      return NextResponse.redirect(new URL('/onboarding', req.url))
    }
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/webhooks).*)",
  ],
}
