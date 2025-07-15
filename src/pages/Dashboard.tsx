import {
  CreditCardIcon,
  WalletIcon,
} from "lucide-react";
import { AccountCard } from "../components/AccountCard";
import { SpendingChart } from "../components/SpendingChart";
import { useAccounts } from "../context/AccountsProvider";

export interface SpendingData {
  dayOfMonth: number;
  amount: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Dashboard – consumes context, no direct fetching here
// ─────────────────────────────────────────────────────────────────────────────
export function Dashboard() {
  const { accounts, loading, error } = useAccounts();

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

  // Gather every transaction into a single stream
  const currentMonth = new Date().getMonth();
  const perDay: Record<number, number> = creditCards
    .flatMap((a) => a.transactions ?? [])
    .filter((txn) => {
      const txnDate = new Date((txn.transacted_at ?? txn.posted) * 1000);
      return txnDate.getMonth() === currentMonth;
    })
    .reduce((acc, txn) => {
      const day = new Date((txn.transacted_at ?? txn.posted) * 1000).getDate();
      const amt = Number(txn.amount);
      acc[day] = (acc[day] ?? 0) + -amt;
      return acc;
    }, {} as Record<number, number>);

  // Re‑shape into the array your chart component expects
  const spendingData = Object.entries(perDay)
    .map(([day, amount]) => ({ dayOfMonth: Number(day), amount }))
  spendingData.push({ dayOfMonth: 0, amount: 0 });
  spendingData.sort((a, b) => a.dayOfMonth - b.dayOfMonth);

  return (
    <div className="container mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Financial Dashboard</h1>
        <p className="text-gray-600">View your accounts and spending</p>
      </header>

      {/* Credit Cards */}
      <section className="mb-8">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Credit Cards</h2>
        {creditCards.length === 0 ? (
          <p className="text-gray-500">No credit-card accounts found.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {creditCards.map((card) => (
              <AccountCard
                key={card.id}
                id={card.id}
                icon={<CreditCardIcon size={24} />}
                name={card.name}
                balance={card.balance ?? "0"}
                subtitle=""
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
                subtitle=""
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
          <SpendingChart
            month={new Date().toLocaleString("default", { month: "long" })}
            spendingData={spendingData}
          />
        </div>
      </section>
    </div>
  );
}

