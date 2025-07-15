import { createContext, useContext, useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  ArrowLeftIcon,
  CreditCardIcon,
  WalletIcon,
} from "lucide-react";
import { AccountCard } from "./AccountCard";
import { SpendingChart } from "./SpendingChart";
import { TransactionList } from './TransactionList';
import { fetchAccounts, Account } from "./AccountService";

// ─────────────────────────────────────────────────────────────────────────────
// Shared context so we fetch *once* in the Dashboard and re‑use in details
// ─────────────────────────────────────────────────────────────────────────────
const AccountsContext = createContext<Account[] | null>(null);

// Helper hook (with user‑friendly fallback)
function useAccounts() {
  const ctx = useContext(AccountsContext);
  if (!ctx) {
    // If someone visits /account/… directly, we have no cached data.
    // In that edge‑case the page will just say “Account data not loaded.”
    return [] as Account[];
  }
  return ctx;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard – fetches accounts, provides context, and renders cards
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const { accounts } = await fetchAccounts();
        setAccounts(accounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-600">
        Loading accounts…
      </div>
    );
  }
  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        {error}
      </div>
    );
  }

  const creditCards = accounts.filter((a) => a.is_credit_card);
  const bankAccounts = accounts.filter((a) => !a.is_credit_card);

  return (
    <AccountsContext.Provider value={accounts}>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Financial Dashboard</h1>
          <p className="text-gray-600">View your accounts and spending</p>
        </header>

        {/* Credit Cards */}
        <section className="mb-8">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Credit Cards</h2>
          {creditCards.length === 0 ? (
            <p className="text-gray-500">No credit‑card accounts found.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creditCards.map((card) => (
                <AccountCard
                  key={card.id}
                  id={card.id}
                  icon={<CreditCardIcon size={24} />}
                  name={card.name}
                  balance={card.balance ?? "0"}
                  subtitle={`**** ${card.id.slice(-4)}`}
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
                  balance={acct.balance ?? "0"}
                  subtitle={`Acct # ${acct.id.slice(-4)}`}
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
            <SpendingChart />
          </div>
        </section>
      </div>
    </AccountsContext.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AccountDetails – consumes the context instead of re‑fetching
// ─────────────────────────────────────────────────────────────────────────────
export function AccountDetails() {
  const allAccounts = useAccounts();
  const { type, id } = useParams<{ type: string; id: string }>();

  // Lookup by id *first*, then fall back to the type param if provided
  const account = allAccounts.find((a) => a.id === id);

  // Graceful handling when navigated directly without prior dashboard visit
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
          <p className="text-sm text-gray-500">
            {isCredit ? `**** ${account.id.slice(-4)}` : `Acct # ${account.id.slice(-4)}`}
          </p>
        </div>
        <div className="ml-auto text-right">
          <p className="text-sm text-gray-500">Current Balance</p>
          <p className="text-2xl font-bold">
            {Number(account.balance ?? 0).toLocaleString(undefined, {
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
