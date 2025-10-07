import type { Metadata } from 'next'
import localFont from 'next/font/local'
import './globals.css'
import TanstackClientProvider from '@/components/providers/tanstack-client-provider'
import ClerkClientProvider from '@/components/providers/clerk-client-provider'
import { OrganizationProvider } from '@/hooks/use-organization'
import { SupabaseProvider } from '@/utils/supabase/context'

const geistSans = localFont({
  src: './fonts/GeistVF.woff',
  variable: '--font-geist-sans',
  weight: '100 900',
})
const geistMono = localFont({
  src: './fonts/GeistMonoVF.woff',
  variable: '--font-geist-mono',
  weight: '100 900',
})

export const metadata: Metadata = {
  title: 'Alpha Pulse COGS',
  description: 'Manufacturing Cost of Goods Sold Calculator',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ClerkClientProvider>
          <SupabaseProvider>
            <OrganizationProvider>
              <TanstackClientProvider>{children}</TanstackClientProvider>
            </OrganizationProvider>
          </SupabaseProvider>
        </ClerkClientProvider>
      </body>
    </html>
  )
}
