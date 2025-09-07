'use client'

import { CreditCardIcon, WalletIcon, RefreshCwIcon } from "lucide-react"
import { AccountCard } from "@/components/AccountCard"
import { SpendingChart } from "@/components/SpendingChart"
import { useAccounts } from "@/context/AccountsProvider"
import { api, utils } from "@/lib/api"
import { useState } from "react"

export default function Dashboard() {
  const { accounts, loading, error, syncData } = useAccounts()
  const [syncing, setSyncing] = useState(false)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        Loading accounts…
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        {error}
      </div>
    )
  }

  const creditCards = accounts.filter((a) => utils.isCreditCard(a))
  const bankAccounts = accounts.filter((a) => !utils.isCreditCard(a))

  const handleSync = async () => {
    setSyncing(true)
    try {
      await syncData()
    } catch (err) {
      console.error('Sync failed:', err)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Financial Dashboard</h1>
            <p className="text-gray-600">View your accounts and spending</p>
          </div>
          <button
            onClick={handleSync}
            disabled={syncing || loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCwIcon size={18} className={syncing ? "animate-spin" : ""} />
            {syncing ? "Syncing..." : "Sync Data"}
          </button>
        </div>
      </header>

      {/* Credit Cards */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Credit Cards</h2>
        {creditCards.length === 0 ? (
          <p className="text-gray-500">No credit card accounts found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card) => (
              <AccountCard
                key={card.id}
                id={card.id}
                icon={<CreditCardIcon size={24} />}
                name={card.name}
                balance={utils.getDisplayBalance(card).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                subtitle={utils.getInstitutionName(card)}
                type="credit"
              />
            ))}
          </div>
        )}
      </section>

      {/* Bank Accounts */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Bank Accounts</h2>
        {bankAccounts.length === 0 ? (
          <p className="text-gray-500">No bank accounts found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((acct) => (
              <AccountCard
                key={acct.id}
                id={acct.id}
                icon={<WalletIcon size={24} />}
                name={acct.name}
                balance={utils.getDisplayBalance(acct).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
                subtitle={utils.getInstitutionName(acct)}
                type="bank"
              />
            ))}
          </div>
        )}
      </section>

      {/* Spending Chart */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Monthly Spending</h2>
        <div className="bg-white p-4 rounded-lg shadow-sm">
          <p className="text-gray-500">Spending chart will be implemented with real transaction data.</p>
        </div>
      </section>
    </div>
  )
}
