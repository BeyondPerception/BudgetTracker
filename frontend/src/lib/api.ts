import { OpenAPI } from '@/generated/core/OpenAPI'
import { HandlersService } from '@/generated/services/HandlersService'
import type { Account, Transaction, SyncStats, CreateAccountRequest, CreateTransactionRequest } from '@/generated/models'

// Configure API client
OpenAPI.BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'

// API Error types
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public code?: string
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

// Helper function to handle API errors
function handleApiError(error: any): never {
  if (error?.status === 503) {
    throw new ApiError('SimpleFin sync service is currently unavailable', 503, 'SERVICE_UNAVAILABLE')
  }
  
  if (error?.status === 500) {
    throw new ApiError('An internal server error occurred. Please try again later.', 500, 'INTERNAL_ERROR')
  }
  
  if (error?.status === 404) {
    throw new ApiError('The requested resource was not found', 404, 'NOT_FOUND')
  }
  
  if (error?.name === 'TypeError' || error?.message?.includes('fetch')) {
    throw new ApiError('Unable to connect to the server. Please check your connection.', 0, 'NETWORK_ERROR')
  }
  
  throw new ApiError(error?.message || 'An unexpected error occurred', error?.status, 'UNKNOWN_ERROR')
}

// API service with error handling and data unwrapping
export const api = {
  accounts: {
    /**
     * Get all accounts from the server
     */
    list: async (): Promise<Account[]> => {
      try {
        const response = await HandlersService.getAccounts()
        return (response as any).data as Account[] // Extract data from wrapped response
      } catch (error) {
        handleApiError(error)
      }
    },

    /**
     * Get a specific account by ID
     */
    get: async (id: string): Promise<Account> => {
      try {
        const response = await HandlersService.getAccount(id)
        return (response as any).data as Account
      } catch (error) {
        handleApiError(error)
      }
    },

    /**
     * Create a new account
     */
    create: async (account: CreateAccountRequest): Promise<Account> => {
      try {
        const response = await HandlersService.createAccount(account)
        return (response as any).data as Account
      } catch (error) {
        handleApiError(error)
      }
    },

    /**
     * Get all transactions for a specific account
     */
    getTransactions: async (accountId: string): Promise<Transaction[]> => {
      try {
        const response = await HandlersService.getAccountTransactions(accountId)
        return (response as any).data as Transaction[]
      } catch (error) {
        handleApiError(error)
      }
    }
  },

  transactions: {
    /**
     * Create a new transaction
     */
    create: async (transaction: CreateTransactionRequest): Promise<Transaction> => {
      try {
        const response = await HandlersService.createTransaction(transaction)
        return (response as any).data as Transaction
      } catch (error) {
        handleApiError(error)
      }
    }
  },

  /**
   * Trigger SimpleFin sync
   */
  sync: async (): Promise<SyncStats> => {
    try {
      const response = await HandlersService.triggerSync()
      return (response as any).data as SyncStats
    } catch (error) {
      handleApiError(error)
    }
  }
}

// Utility functions for working with the data
export const utils = {
  /**
   * Check if an account is a credit card
   */
  isCreditCard: (account: Account): boolean => {
    // Use SimpleFin detection if available, otherwise fallback to available_balance check
    if (account.is_credit_card !== null && account.is_credit_card !== undefined) {
      return account.is_credit_card
    }
    // Fallback: credit cards typically have available_balance of 0
    return account.available_balance === 0
  },

  /**
   * Get display balance for an account (show available_balance for credit cards)
   */
  getDisplayBalance: (account: Account): number => {
    if (utils.isCreditCard(account) && account.available_balance !== null) {
      return Math.abs(account.balance) // Show positive balance for credit cards
    }
    return account.balance
  },

  /**
   * Format account type for display
   */
  formatAccountType: (account: Account): string => {
    if (utils.isCreditCard(account)) {
      return 'credit'
    }
    return 'bank'
  },

  /**
   * Get institution name, fallback to account_type if not available
   */
  getInstitutionName: (account: Account): string => {
    return account.institution || account.account_type
  }
}