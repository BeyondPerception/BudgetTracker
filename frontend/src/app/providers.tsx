'use client'

import { AccountsProvider } from '@/context/AccountsProvider'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AccountsProvider>
      {children}
    </AccountsProvider>
  )
}