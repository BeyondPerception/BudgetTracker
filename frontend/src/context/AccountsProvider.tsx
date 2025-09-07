'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import type { Account, Transaction, SyncStats } from '@/generated/models'
import { api, ApiError } from '@/lib/api'

interface AccountsContextType {
  accounts: Account[]
  transactions: Transaction[]
  loading: boolean
  error: string | null
  syncData: () => Promise<SyncStats | null>
  getAccountTransactions: (accountId: string) => Transaction[]
  reloadAccounts: () => Promise<void>
  syncStats: SyncStats | null
  syncing: boolean
}

const AccountsContext = createContext<AccountsContextType | undefined>(undefined)

export function AccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [loading, setLoading] = useState(true)
  const [syncing, setSyncing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null)

  // Load accounts from the API
  const loadAccounts = async () => {
    try {
      setError(null)
      const fetchedAccounts = await api.accounts.list()
      setAccounts(fetchedAccounts)
      
      // Load all transactions for all accounts
      const allTransactions: Transaction[] = []
      for (const account of fetchedAccounts) {
        try {
          const accountTransactions = await api.accounts.getTransactions(account.id)
          allTransactions.push(...accountTransactions)
        } catch (err) {
          // Continue loading other accounts even if one fails
          console.warn(`Failed to load transactions for account ${account.id}:`, err)
        }
      }
      setTransactions(allTransactions)
    } catch (err) {
      const apiError = err as ApiError
      setError(apiError.message)
      console.error('Failed to load accounts:', err)
    }
  }

  // Initial data load
  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      await loadAccounts()
      setLoading(false)
    }

    loadData()
  }, [])

  // Reload accounts (public method)
  const reloadAccounts = async () => {
    setLoading(true)
    await loadAccounts()
    setLoading(false)
  }

  // Sync data with SimpleFin
  const syncData = async (): Promise<SyncStats | null> => {
    setSyncing(true)
    setSyncStats(null)
    
    try {
      setError(null)
      const stats = await api.sync()
      setSyncStats(stats)
      
      // Reload data after successful sync
      await loadAccounts()
      
      return stats
    } catch (err) {
      const apiError = err as ApiError
      
      if (apiError.code === 'SERVICE_UNAVAILABLE') {
        setError('SimpleFin sync is currently unavailable. Please try again later.')
      } else if (apiError.code === 'NETWORK_ERROR') {
        setError('Unable to connect to the server. Please check your connection and try again.')
      } else {
        setError(apiError.message || 'Sync failed. Please try again.')
      }
      
      console.error('Sync failed:', err)
      return null
    } finally {
      setSyncing(false)
    }
  }

  // Get transactions for a specific account
  const getAccountTransactions = (accountId: string): Transaction[] => {
    return transactions.filter(transaction => transaction.account_id === accountId)
  }

  const value: AccountsContextType = {
    accounts,
    transactions,
    loading,
    error,
    syncData,
    getAccountTransactions,
    reloadAccounts,
    syncStats,
    syncing
  }

  return (
    <AccountsContext.Provider value={value}>
      {children}
    </AccountsContext.Provider>
  )
}

export function useAccounts() {
  const context = useContext(AccountsContext)
  if (context === undefined) {
    throw new Error('useAccounts must be used within an AccountsProvider')
  }
  return context
}