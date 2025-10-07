'use client'

import { ClerkProvider } from '@clerk/nextjs'
// Theme import reserved for future dark mode implementation
// import { dark } from '@clerk/themes'

export default function ClerkClientProvider({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider
      appearance={{
        baseTheme: undefined, // We'll add theme support later
      }}
    >
      {children}
    </ClerkProvider>
  )
}
