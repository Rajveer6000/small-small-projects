import { useMemo, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { API_BASE } from "../utils/leanConfig";

const formatCurrency = (amount, currency = "AED") => {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(amount));
};

const formatAccountLabel = (account) => {
  if (!account) return "Account";
  const name = account.name || account.account_name || "Account";
  const lastFour = account.account_number
    ? account.account_number.slice(-4)
    : "";
  const parts = [
    name,
    account.type,
    account.currency_code || account.currency,
    lastFour ? `••${lastFour}` : null,
  ].filter(Boolean);
  return parts.join(" • ");
};

const Accounts = () => {
  const { userId, hasUser } = useUserContext();
  const [accounts, setAccounts] = useState([]);
  const [balance, setBalance] = useState(null);
  const [balancesCache, setBalancesCache] = useState({});
  const [selectedAccountId, setSelectedAccountId] = useState(null);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const summaryCards = useMemo(() => {
    if (!accounts.length) return [];
    const counts = accounts.reduce((acc, curr) => {
      const type = curr.type || "OTHER";
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {});
    const creditLimit = accounts.reduce(
      (sum, curr) => sum + Number(curr?.credit?.limit ?? 0),
      0
    );
    return [
      {
        title: "Linked Accounts",
        value: accounts.length,
        hint: "from Lean",
      }
    ];
  }, [accounts]);

  const selectedAccount = useMemo(
    () => accounts.find((acc) => acc.account_id === selectedAccountId) || null,
    [accounts, selectedAccountId]
  );

  const loadAccounts = async () => {
    if (!hasUser) {
      setError("Set a user id first.");
      return;
    }
    setLoading(true);
    setError("");
    setStatus("Fetching accounts...");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/userAccounts?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error("Unable to get accounts");
      const data = await res.json();
      const mapped = data?.payload?.accounts ?? [];
      setAccounts(mapped);
      setBalancesCache({});
      setStatus(`Loaded ${mapped.length} accounts`);
      if (mapped.length) {
        const firstId = mapped[0].account_id;
        setSelectedAccountId(firstId);
        setBalance(null);
        await fetchBalance(firstId, { silent: true, force: true });
      } else {
        setSelectedAccountId(null);
        setBalance(null);
      }
    } catch (err) {
      setError(err.message || "Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  const fetchBalance = async (accountId, options = {}) => {
    const { silent = false, force = false } = options;
    if (!accountId) return;
    if (!force && balancesCache[accountId]) {
      setBalance(balancesCache[accountId]);
      if (!silent) setStatus("Loaded cached balance");
      return;
    }
    if (!silent) {
      setLoading(true);
      setError("");
      setStatus("Fetching balance...");
    } else {
      setError("");
    }
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/accountBalances?userId=${encodeURIComponent(
          userId
        )}&accountId=${encodeURIComponent(accountId)}`
      );
      if (!res.ok) throw new Error("Unable to get balance");
      const data = await res.json();
      setBalance(data.payload);
      setBalancesCache((prev) => ({ ...prev, [accountId]: data.payload }));
      if (!silent) setStatus("Balance refreshed");
    } catch (err) {
      setError(err.message || "Failed to load balance");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  };

  const handleAccountClick = (accountId) => {
    setSelectedAccountId(accountId);
    fetchBalance(accountId);
  };

  const creditDetails = selectedAccount?.credit;

  return (
    <div className="space-y-6">
      {(status || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-emerald-50 border-emerald-200 text-emerald-700"
          }`}
        >
          {error || status}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Accounts Snapshot
            </h3>
            <p className="text-sm text-slate-500">
              Load the user accounts and inspect their balances.
            </p>
          </div>
          <button
            onClick={loadAccounts}
            disabled={!hasUser || loading}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-300"
          >
            {loading ? "Loading..." : "Fetch Accounts"}
          </button>
        </div>
        {!hasUser && (
          <p className="mt-4 text-sm text-rose-600">
            Provide a user id from the header first.
          </p>
        )}
        <div className="grid lg:grid-cols-[2fr_1fr] gap-6 mt-6">
          <div className="space-y-6">
            {summaryCards.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {summaryCards.map((card) => (
                  <div
                    key={card.title}
                    className="border border-slate-200 rounded-lg p-4 bg-slate-50"
                  >
                    <div className="text-xs uppercase text-slate-500 tracking-wide">
                      {card.title}
                    </div>
                    <div className="text-2xl font-semibold text-slate-900 mt-2">
                      {card.value}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {card.hint}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {accounts.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {accounts.map((account) => (
                  <button
                    key={account.account_id}
                    onClick={() => handleAccountClick(account.account_id)}
                    className={`text-left border rounded-xl p-4 transition-colors focus:outline-none ${
                      selectedAccountId === account.account_id
                        ? "border-blue-500 bg-blue-50"
                        : "border-slate-200 hover:border-blue-300 hover:bg-slate-50"
                    }`}
                  >
                    <div className="text-xs uppercase text-slate-500 mb-1">
                      {account.type} • {account.currency_code || "AED"}
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {account.name || account.account_name}
                    </div>
                    <div className="text-sm text-slate-500">
                      {account.account_number}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {account.iban || "IBAN unavailable"}
                    </div>
                    {account.credit && (
                      <div className="mt-3 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-100 rounded-md px-2 py-1 inline-flex">
                        Credit limit {formatCurrency(account.credit.limit)}
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
          <div className="border border-slate-200 rounded-xl p-5 bg-slate-50 h-fit">
            {selectedAccount ? (
              <div className="space-y-4">
                <div>
                  <div className="text-xs uppercase text-slate-500">Balance</div>
                  <div className="text-3xl font-semibold text-slate-900">
                    {balance
                      ? formatCurrency(
                          balance.balance,
                          balance.currency_code || selectedAccount.currency_code
                        )
                      : "…"}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatAccountLabel(selectedAccount)}
                  </p>
                </div>
                <dl className="grid grid-cols-2 gap-3 text-sm text-slate-700">
                  <div>
                    <dt className="text-xs uppercase text-slate-500">
                      Account ID
                    </dt>
                    <dd className="font-semibold break-all">
                      {selectedAccount.account_id}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">
                      Currency
                    </dt>
                    <dd className="font-semibold">
                      {balance?.currency_code || selectedAccount.currency_code}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">IBAN</dt>
                    <dd className="font-semibold break-all">
                      {selectedAccount.iban || "—"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase text-slate-500">
                      Account No.
                    </dt>
                    <dd className="font-semibold">
                      {selectedAccount.account_number}
                    </dd>
                  </div>
                </dl>
                {creditDetails && (
                  <div className="border border-amber-200 bg-white rounded-lg p-4 space-y-2">
                    <div className="text-xs uppercase text-amber-600">
                      Credit details
                    </div>
                    <div className="text-lg font-semibold text-slate-900">
                      {formatCurrency(creditDetails.limit)}
                    </div>
                    <p className="text-xs text-slate-500">
                      Card ending ••{creditDetails.card_number_last_four || "--"}
                    </p>
                    <div className="text-sm text-slate-700">
                      Next due {creditDetails.next_payment_due_date} ·{" "}
                      {formatCurrency(creditDetails.next_payment_due_amount)}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-slate-600">
                Fetch accounts, then choose one to see its live balance here.
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Accounts;
