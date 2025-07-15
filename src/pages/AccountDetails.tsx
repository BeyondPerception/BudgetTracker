import {
    ArrowLeftIcon,
    CreditCardIcon,
    WalletIcon,
} from "lucide-react";
import { Link, useParams } from "react-router-dom";
import { TransactionList } from "../components/TransactionList";
import { useAccounts } from "../context/AccountsProvider";


// ─────────────────────────────────────────────────────────────────────────────
// AccountDetails – still consumes context, shows loading if first visit direct
// ─────────────────────────────────────────────────────────────────────────────
export function AccountDetails() {
    const { accounts, loading } = useAccounts();
    const { id } = useParams<{ id: string }>();

    const account = accounts.find((a) => a.id === id);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-600">
                Loading account…
            </div>
        );
    }

    if (!account) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold text-gray-800">Account not found</h1>
                <Link to="/" className="text-blue-500 hover:underline mt-4 inline-block">
                    Return to Dashboard
                </Link>
            </div>
        );
    }

    const isCredit = account.is_credit_card;
    const Icon = isCredit ? CreditCardIcon : WalletIcon;
    const iconColorClass = isCredit ? "bg-blue-50 text-blue-500" : "bg-green-50 text-green-500";

    return (
        <div className="container mx-auto px-4 py-8">
            <Link to="/" className="inline-flex items-center text-blue-500 hover:underline mb-6">
                <ArrowLeftIcon size={16} className="mr-1" /> Back to Dashboard
            </Link>

            {/* Account Header */}
            <div className="flex items-center mb-6">
                <div className={`p-3 rounded-full mr-4 ${iconColorClass}`}>
                    <Icon size={24} />
                </div>
                <div>
                    <h1 className="text-2xl font-bold text-gray-800">{account.name}</h1>
                </div>
                <div className="ml-auto text-right">
                    <p className="text-sm text-gray-500">Current Balance</p>
                    <p className="text-2xl font-bold">
                        {Number(account.balance).toLocaleString(undefined, {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                        })}
                    </p>
                </div>
            </div>

            {/* Transactions */}
            <div className="bg-white rounded-lg shadow-sm p-4 mb-8">
                <h2 className="text-lg font-medium text-gray-800 mb-4">Recent Transactions</h2>
                {account.transactions && account.transactions.length > 0 ? (
                    <TransactionList transactions={account.transactions} />
                ) : (
                    <p className="text-gray-500">No transactions found for this account.</p>
                )}
            </div>
        </div>
    );
}
