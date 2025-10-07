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

export default clerkMiddleware(async (auth, req) => {
  const { userId } = await auth()
  const { pathname } = req.nextUrl

  // If user is trying to access a protected route
  if (isProtectedRoute(req)) {
    // Require authentication
    await auth.protect()
    
    // If authenticated but no userId (edge case), redirect to sign-in
    if (!userId) {
      return NextResponse.redirect(new URL('/sign-in', req.url))
    }
  }

  // If user is authenticated and on root or auth pages, redirect to dashboard
  if (userId && (pathname === '/' || pathname === '/sign-in' || pathname === '/sign-up')) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)|api/webhooks).*)",
  ],
}
