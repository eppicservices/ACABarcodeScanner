'use client'

import { SessionProvider } from 'next-auth/react'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { ErrorBoundary } from '@/components/ErrorBoundary'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <TooltipProvider delayDuration={300}>
        <ErrorBoundary>
          {children}
        </ErrorBoundary>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              fontFamily: 'var(--font-body)',
            },
          }}
        />
      </TooltipProvider>
    </SessionProvider>
  )
}
