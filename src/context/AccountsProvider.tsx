import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { fetchAccounts, Account } from "../components/AccountService";


// ─────────────────────────────────────────────────────────────────────────────
// AccountsContext & Provider
// Fetch once on mount, then refresh silently every REFRESH_MS.
// ─────────────────────────────────────────────────────────────────────────────
interface AccountsState {
    accounts: Account[];
    loading: boolean;
    error: string | null;
}

const AccountsContext = createContext<AccountsState | null>(null);
const REFRESH_MS = 5 * 60 * 1000; // 5 minutes

export function AccountsProvider({ children }: { children: React.ReactNode }) {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch wrapper so we can reuse in interval
    const loadAccounts = useCallback(async () => {
        try {
            const { accounts } = await fetchAccounts();
            setAccounts(accounts);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        // First load
        loadAccounts();
        // Background refresh
        const id = setInterval(loadAccounts, REFRESH_MS);
        return () => clearInterval(id);
    }, [loadAccounts]);

    return (
        <AccountsContext.Provider value={{ accounts, loading, error }}>
            {children}
        </AccountsContext.Provider>
    );
}

// Helper hook
export function useAccounts() {
    const ctx = useContext(AccountsContext);
    if (!ctx) {
        throw new Error("useAccounts must be used within <AccountsProvider>");
    }
    return ctx;
}
