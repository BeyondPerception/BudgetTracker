import { Transaction } from "./AccountService";

interface TransactionListProps {
  transactions: Transaction[];
}
export function TransactionList({
  transactions
}: TransactionListProps) {
  // Format date to be more readable
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric'
    }).format(date);
  };

  return <div className="overflow-x-auto">
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
        {transactions.map(transaction => <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
          <td className="px-4 py-3 text-sm text-gray-600">
            {formatDate(transaction.transacted_at ?? transaction.posted)}
          </td>
          <td className="px-4 py-3 text-sm font-medium text-gray-800">
            {transaction.description} {transaction.pending && <span className="text-gray-500">(Pending)</span>}
          </td>
          <td className="px-4 py-3 text-sm text-gray-600">
            {"Category not available"}
          </td>
          <td className={`px-4 py-3 text-sm font-medium text-right ${Number(transaction.amount) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {Number(transaction.amount) >= 0 ? '+' : ''}$
            {Math.abs(Number(transaction.amount)).toFixed(2)}
          </td>
        </tr>)}
      </tbody>
    </table>
  </div>;
}