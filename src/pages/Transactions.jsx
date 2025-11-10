import { useEffect, useMemo, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useUIContext } from "../context/UIContext";
import { API_BASE } from "../utils/leanConfig";

const formatAmount = (amount, currency = "AED") =>
  amount === undefined || amount === null
    ? "-"
    : new Intl.NumberFormat("en-AE", {
        style: "currency",
        currency,
      }).format(Number(amount));

const firstDayOfMonth = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-01`;
};

const today = () => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(now.getDate()).padStart(2, "0")}`;
};

const formatAccountLabel = (account) => {
  const name = account?.name || account?.account_name || "Account";
  const type = account?.type || "TYPE";
  const currency = account?.currency_code || account?.currency || "AED";
  const lastFour = account?.account_number
    ? account.account_number.slice(-4)
    : "";
  const pieces = [name, type, currency];
  if (lastFour) pieces.push(`••${lastFour}`);
  return pieces.join(" - ");
};

const normalizeCategory = (tx) =>
  (tx?.category ||
    tx?.insights?.category ||
    tx?.insights?.type ||
    "UNCATEGORISED"
  ).toUpperCase();

const Transactions = () => {
  const { userId, hasUser } = useUserContext();
  const { setStatus, setError } = useUIContext();
  const [accounts, setAccounts] = useState([]);
  const [selectedAccountId, setSelectedAccountId] = useState("");
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [categoryOptions, setCategoryOptions] = useState(["ALL"]);
  const [range, setRange] = useState({
    fromDate: firstDayOfMonth(),
    toDate: today(),
  });

  useEffect(() => {
    if (!hasUser) {
      setAccounts([]);
      setSelectedAccountId("");
      setTransactions([]);
      return;
    }
    const loadAccounts = async () => {
      setLoading(true);
      setStatus("Loading accounts...");
      setError("");
      try {
        const res = await fetch(
          `${API_BASE}/api/lean/userAccounts?userId=${encodeURIComponent(
            userId
          )}`
        );
        if (!res.ok) throw new Error("Unable to fetch accounts");
        const data = await res.json();
        const payloadAccounts = data?.payload?.accounts ?? [];
        setAccounts(payloadAccounts);
        if (payloadAccounts.length) {
          const first = payloadAccounts[0].account_id;
          setSelectedAccountId(first);
          await loadTransactions(first, range.fromDate, range.toDate);
        } else {
          setTransactions([]);
          setStatus("No accounts found");
        }
      } catch (err) {
        setError(err.message || "Unable to load accounts");
      } finally {
        setLoading(false);
      }
    };
    loadAccounts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, hasUser]);

  const loadTransactions = async (
    accountId = selectedAccountId,
    fromDate = range.fromDate,
    toDate = range.toDate
  ) => {
    if (!accountId) return;
    setLoading(true);
    setStatus("Fetching transactions...");
    setError("");
    try {
      let url = `${API_BASE}/api/lean/account-transactions?userId=${encodeURIComponent(
        userId
      )}&accountId=${encodeURIComponent(accountId)}&fromDate=${encodeURIComponent(
        fromDate
      )}&toDate=${encodeURIComponent(toDate)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Unable to fetch transactions");
      const data = await res.json();
      const payload = data?.payload?.transactions ?? [];
      setTransactions(payload);
      const uniqueCategories = Array.from(
        new Set(
          payload
            .map((tx) => normalizeCategory(tx))
            .filter((value) => value && value !== "UNCATEGORISED")
        )
      );
      setCategoryOptions(["ALL", ...uniqueCategories]);
      setCategoryFilter("ALL");
      setStatus(`Showing ${payload.length} transactions`);
    } catch (err) {
      setError(err.message || "Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  const filteredTransactions = useMemo(() => {
    if (categoryFilter === "ALL") return transactions;
    return transactions.filter(
      (tx) => normalizeCategory(tx) === categoryFilter
    );
  }, [transactions, categoryFilter]);

  const totals = useMemo(() => {
    if (!filteredTransactions.length) return null;
    return filteredTransactions.reduce(
      (acc, tx) => {
        const amount = Number(tx.amount);
        if (amount >= 0) acc.inflow += amount;
        else acc.outflow += Math.abs(amount);
        return acc;
      },
      { inflow: 0, outflow: 0 }
    );
  }, [filteredTransactions]);

  const handleRangeChange = (e) => {
    const { name, value } = e.target;
    setRange((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Transactions</h3>
          <p className="text-sm text-slate-500">
            Automatically loads from the start of this month. Update the range
            as needed.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Account
            <select
              value={selectedAccountId}
              onChange={(e) => {
                setSelectedAccountId(e.target.value);
                loadTransactions(e.target.value);
              }}
              disabled={!accounts.length}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {accounts.map((account) => (
                <option key={account.account_id} value={account.account_id}>
                  {formatAccountLabel(account)}
                </option>
              ))}
            </select>
          </label>
          {transactions.length > 0 && (
            <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
              Category
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
              >
                {categoryOptions.map((value) => (
                  <option key={value} value={value}>
                    {value === "ALL" ? "All categories" : value}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            From
            <input
              type="date"
              name="fromDate"
              value={range.fromDate}
              onChange={handleRangeChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            To
            <input
              type="date"
              name="toDate"
              value={range.toDate}
              onChange={handleRangeChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
        </div>
        <div className="flex justify-end">
          <button
            onClick={() => loadTransactions()}
            disabled={loading || !selectedAccountId}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-300"
          >
            Apply Filter
          </button>
        </div>
      </section>
      {totals && (
        <div className="flex flex-wrap items-center gap-6 text-sm font-semibold text-slate-700">
          <span className="flex items-center gap-2">
            <span className="text-xs uppercase text-slate-500">Inflow</span>
            <span className="text-emerald-600">
              {formatAmount(totals.inflow)}
            </span>
          </span>
          <span className="flex items-center gap-2">
            <span className="text-xs uppercase text-slate-500">Outflow</span>
            <span className="text-rose-600">
              {formatAmount(totals.outflow)}
            </span>
          </span>
        </div>
      )}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Description
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Category
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransactions.map((tx) => (
                <tr key={tx.transaction_id}>
                  <td className="px-4 py-3 text-slate-700">
                    {tx.date || tx.timestamp}
                  </td>
                  <td className="px-4 py-3 text-slate-800 font-medium">
                    {tx.description || tx.counterparty_name}
                  </td>
                  <td className="px-4 py-3 text-slate-500 uppercase tracking-wide text-xs">
                    {normalizeCategory(tx)}
                  </td>
                  <td
                    className={`px-4 py-3 text-right font-semibold ${
                      tx.amount < 0 ? "text-rose-600" : "text-emerald-600"
                    }`}
                  >
                    {formatAmount(tx.amount, tx.currency)}
                  </td>
                </tr>
              ))}
              {!filteredTransactions.length && (
                <tr>
                  <td
                    colSpan="4"
                    className="px-4 py-8 text-center text-slate-500"
                  >
                    {loading
                      ? "Loading transactions..."
                      : "No transactions for the selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default Transactions;
