'use client'

import { Transaction } from '@/generated/models'

interface TransactionListProps {
  transactions: Transaction[]
}

export function TransactionList({ transactions }: TransactionListProps) {
  // Format date to be more readable
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date)
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              Date
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              Description
            </th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">
              Category
            </th>
            <th className="px-4 py-3 text-right text-sm font-medium text-gray-500">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {transactions.map(transaction => (
            <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-4 py-3 text-sm text-gray-600">
                {formatDate(transaction.posted_date || transaction.transaction_date)}
              </td>
              <td className="px-4 py-3 text-sm font-medium text-gray-800">
                <div>
                  {transaction.payee || transaction.description}
                  {transaction.pending && <span className="text-gray-500 ml-1">(Pending)</span>}
                </div>
                {transaction.memo && (
                  <div className="text-xs text-gray-500 mt-1">{transaction.memo}</div>
                )}
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">
                {transaction.category || "Category not available"}
              </td>
              <td className={`px-4 py-3 text-sm font-medium text-right ${transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {transaction.amount >= 0 ? '+' : ''}$
                {Math.abs(transaction.amount).toFixed(2)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}