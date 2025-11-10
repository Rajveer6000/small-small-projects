import { useMemo, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useUIContext } from "../context/UIContext";
import { API_BASE } from "../utils/leanConfig";

const defaultStart = () => {
  const today = new Date();
  today.setMonth(today.getMonth() - 3);
  return today.toISOString().slice(0, 10);
};

const formatCurrency = (amount, currency = "AED") => {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
  }).format(Number(amount));
};

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

const Income = () => {
  const { userId, hasUser } = useUserContext();
  const { setStatus, setError } = useUIContext();
  const [startDate, setStartDate] = useState(defaultStart());
  const [incomeType, setIncomeType] = useState("ALL");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  const fetchIncome = async () => {
    if (!hasUser) {
      setError("Select a user id first.");
      return;
    }
    setLoading(true);
    setStatus("Fetching income insights...");
    setError("");
    try {
      const url = `${API_BASE}/api/lean/income?userId=${encodeURIComponent(
        userId
      )}&startDate=${encodeURIComponent(
        startDate
      )}&incomeType=${encodeURIComponent(incomeType)}`;
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Unable to fetch income insights");
      const payload = await res.json();
      setData(payload);
      setStatus("Income insights loaded.");
    } catch (err) {
      setError(err.message || "Failed to fetch income");
    } finally {
      setLoading(false);
    }
  };

  const salary = data?.insights?.salary;
  const nonSalary = data?.insights?.non_salary;

  const summaryCards = useMemo(() => {
    if (!salary && !nonSalary) return [];
    return [
      {
        title: "Salary Total",
        value: formatCurrency(
          salary?.total?.amount ?? 0,
          salary?.currency || "AED"
        ),
        hint: `Avg monthly ${formatCurrency(
          salary?.total?.average_monthly_amount ?? 0,
          salary?.currency || "AED"
        )}`,
      },
      {
        title: "Non-salary Total",
        value: formatCurrency(
          nonSalary?.total?.amount ?? 0,
          nonSalary?.currency || "AED"
        ),
        hint: `Avg monthly ${formatCurrency(
          nonSalary?.total?.average_monthly_amount ?? 0,
          nonSalary?.currency || "AED"
        )}`,
      },
      {
        title: "Latest Salary Count",
        value: salary?.total?.count ?? 0,
        hint: `${salary?.monthly_totals?.length || 0} months tracked`,
      },
    ];
  }, [salary, nonSalary]);

  const renderTransactionsTable = (items = [], title, currency = "AED") => {
    if (!items.length) return null;
    return (
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">{title}</h4>
            <p className="text-xs text-slate-500">
              Showing {items.length} transactions
            </p>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Date
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Information
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Account
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Source
                </th>
                <th className="px-4 py-3 text-right font-semibold text-slate-600">
                  Amount
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {items.map((tx) => (
                <tr key={tx.transaction_id}>
                  <td className="px-4 py-3 text-slate-600">
                    {formatDate(tx.booking_date_time)}
                  </td>
                  <td className="px-4 py-3 text-slate-800">
                    {tx.transaction_information || "—"}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {tx.account_id}
                  </td>
                  <td className="px-4 py-3 text-slate-500">
                    {tx.income_source?.type || "UNKNOWN"}
                  </td>
                  <td className="px-4 py-3 text-right font-semibold text-emerald-600">
                    {formatCurrency(tx.amount, currency)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderIncomeFactors = (factors) => {
    if (!factors?.periods?.length) return null;
    return (
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-4 space-y-3">
        <h4 className="text-sm font-semibold text-slate-900">Income factors</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-slate-600">
          {factors.periods.map((period) => (
            <div
              key={period.period}
              className="border border-slate-100 rounded-lg p-3 bg-slate-50"
            >
              <div className="text-xs uppercase text-slate-500">
                {period.period}
              </div>
              <div className="font-semibold text-slate-900">
                Avg {formatCurrency(period.average_income?.amount || 0)}
              </div>
              <div className="text-xs text-slate-500">
                Variation {period.income_variation?.toFixed(2) ?? "0.00"}
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Income</h3>
            <p className="text-sm text-slate-500">
              Query Lean&apos;s income insights for the selected customer.
            </p>
          </div>
          {data?.report_download_url && (
            <a
              href={data.report_download_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md border border-purple-200 text-purple-700 hover:bg-purple-50"
            >
              Download XLSX
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1 md:col-span-2">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Income type
            <select
              value={incomeType}
              onChange={(e) => setIncomeType(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-purple-500"
            >
              <option value="ALL">ALL</option>
              <option value="SALARY">SALARY</option>
              <option value="NON_SALARY">NON_SALARY</option>
            </select>
          </label>
          <div className="flex items-end">
            <button
              onClick={fetchIncome}
              disabled={loading}
              className="w-full px-4 py-2 rounded-md bg-purple-600 text-white text-sm font-semibold hover:bg-purple-700 disabled:bg-slate-300"
            >
              {loading ? "Loading..." : "Get Income"}
            </button>
          </div>
        </div>
      </section>
      {data?.insights && (
        <>
          {summaryCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summaryCards.map((card) => (
                <div
                  key={card.title}
                  className="border border-purple-100 bg-purple-50 rounded-xl p-4"
                >
                  <div className="text-xs uppercase text-purple-600">
                    {card.title}
                  </div>
                  <div className="text-2xl font-semibold text-purple-900">
                    {card.value}
                  </div>
                  <div className="text-xs text-purple-700 mt-1">
                    {card.hint}
                  </div>
                </div>
              ))}
            </div>
          )}

          {renderTransactionsTable(
            salary?.transactions,
            "Salary transactions",
            salary?.currency || "AED"
          )}
          {renderTransactionsTable(
            nonSalary?.transactions,
            "Non-salary transactions",
            nonSalary?.currency || "AED"
          )}
          {renderIncomeFactors(salary?.income_factors)}
        </>
      )}

      {data && (
        <div className="rounded-2xl bg-slate-900 text-slate-100">
          <button
            type="button"
            onClick={() => setRawOpen((prev) => !prev)}
            className="w-full px-4 py-3 text-left flex items-center justify-between text-sm font-semibold"
          >
            Raw payload
            <span>{rawOpen ? "−" : "+"}</span>
          </button>
          {rawOpen && (
            <pre className="px-4 pb-4 text-xs overflow-x-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          )}
        </div>
      )}
    </div>
  );
};

export default Income;
