import axios from "axios";

// ── Type Defs ────────────────────────────────────────────────────────────────
export interface Transaction {
    id: string;
    posted: number;
    amount: string;
    description: string;
    payee?: string;
    memo?: string;
    transacted_at?: number;
    pending?: boolean;
}

export interface Account {
    id: string;
    name: string;
    org?: { name?: string; domain?: string };
    balance: string;
    "available-balance"?: string;
    available_balance: number;
    is_credit_card: boolean;
    transactions?: Transaction[];
}

export interface AccountSet {
    accounts: Account[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────
function getAccessUrl(): string {
    const accessUrl = import.meta.env.VITE_SIMPLEFIN_ACCESS_URL as string | undefined;
    if (!accessUrl) {
        throw new Error("VITE_SIMPLEFIN_ACCESS_URL must be set (see .env.local)");
    }
    return accessUrl;
}

const DAYS_BACK = 30;
const MS_PER_DAY = 86_400_000;
const toEpochSecs = (d: Date) => Math.floor(d.getTime() / 1000);
const daysDelta = (n: number): Date => new Date(Date.now() + n * MS_PER_DAY);
const fmtAmount = (str: string | number) => {
    const num = typeof str === "string" ? parseFloat(str) : str;
    return num.toFixed(2).padStart(10);
};

// ── Fetch & Post‑process ─────────────────────────────────────────────────────
async function _fetchAccounts(accessUrl: string, params: Record<string, number | string>): Promise<AccountSet> {
    const parsed = new URL(accessUrl);
    const { username, password } = parsed;

    const qs = new URLSearchParams(params as Record<string, string>).toString();
    const url = `${parsed.origin}${parsed.pathname.replace(/\/$/, "")}/accounts?${qs}`;

    try {
        const resp = await axios.get<AccountSet>(url, {
            auth: { username: username, password: password },
            timeout: 30_000,
        });

        // Normalise field names and flag credit‑card accounts
        for (const acct of resp.data.accounts) {
            const availRaw = (acct as any)["available-balance"];
            acct.available_balance = Number(availRaw);
            if (acct.available_balance === 0) {
                acct.is_credit_card = true;
            }
        }

        return resp.data;
    } catch (error: any) {
        if (error.response) {
            console.error("Error response data:", error.response.data);
        }
        throw error;
    }
}

// ── Printing ─────────────────────────────────────────────────────────────────
function printGrouped(acctSet: AccountSet): void {
    const sortedAccounts = [...acctSet.accounts].sort((a, b) => a.name.localeCompare(b.name));

    for (const acct of sortedAccounts) {
        const txns = (acct.transactions ?? []).sort((a, b) => (b.posted ?? b.transacted_at ?? 0) - (a.posted ?? a.transacted_at ?? 0));
        if (!txns.length) continue;

        const typeTag = acct.is_credit_card ? " [CC]" : "";
        const header = `${acct.name}${typeTag}  (id ${acct.id})`;
        console.log(header);
        console.log("-".repeat(header.length));

        for (const t of txns) {
            const epoch = t.posted ?? t.transacted_at ?? 0;
            const dt = new Date(epoch * 1000).toISOString().slice(0, 10);
            const desc = (t.payee?.trim() || t.description).slice(0, 40).padEnd(40);
            console.log(`${dt}  ${desc}  ${fmtAmount(t.amount)}`);
        }

        if (acct.balance !== undefined) {
            console.log(`Current balance: ${fmtAmount(acct.balance)}`);
        }

        console.log();
    }
}

// ── Main ─────────────────────────────────────────────────────────────────────
export async function fetchAccounts(): Promise<AccountSet> {
    const accessUrl = getAccessUrl();

    const params: Record<string, string | number> = {
        "start-date": toEpochSecs(daysDelta(-DAYS_BACK)),
        "pending": 1
    };

    const acctSet = await _fetchAccounts(accessUrl, params);
    // printGrouped(acctSet);
    return acctSet
}
