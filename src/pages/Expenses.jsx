import { useMemo, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { API_BASE } from "../utils/leanConfig";

const defaultStart = () => {
  const today = new Date();
  today.setMonth(today.getMonth() - 1);
  return today.toISOString().slice(0, 10);
};

const formatCurrency = (amount, currency = "AED") => {
  if (amount === undefined || amount === null) return "-";
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
  }).format(Number(amount));
};

const Expenses = () => {
  const { userId, hasUser } = useUserContext();
  const [startDate, setStartDate] = useState(defaultStart());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [rawOpen, setRawOpen] = useState(false);

  const categories = useMemo(() => {
    const breakdown =
      data?.insights?.total?.breakdown?.find((b) => b.by === "category")
        ?.breakdowns || [];
    return breakdown;
  }, [data]);

  const fetchExpenses = async () => {
    if (!hasUser) {
      setError("Set a user id to continue.");
      return;
    }
    setLoading(true);
    setStatus("Fetching expenses insights...");
    setError("");
    try {
      const url = `${API_BASE}/api/lean/expenses?userId=${encodeURIComponent(
        userId
      )}&startDate=${encodeURIComponent(startDate)}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error("Unable to fetch expenses");
      const payload = await res.json();
      setData(payload);
      setStatus("Expenses insights loaded.");
    } catch (err) {
      setError(err.message || "Failed to fetch expenses");
    } finally {
      setLoading(false);
    }
  };

  const monthlyTotals = data?.insights?.monthly_totals ?? [];

  return (
    <div className="space-y-6">
      {(status || error) && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            error
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {error || status}
        </div>
      )}
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Expenses</h3>
            <p className="text-sm text-slate-500">
              Pull spending insights over a configurable date range.
            </p>
          </div>
          {data?.report_download_url && (
            <a
              href={data.report_download_url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-semibold rounded-md border border-blue-200 text-blue-700 hover:bg-blue-50"
            >
              Download XLSX
            </a>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1 md:col-span-2">
            Start date
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="flex items-end">
            <button
              onClick={fetchExpenses}
              disabled={loading}
              className="w-full px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-slate-300"
            >
              {loading ? "Loading..." : "Get Expenses"}
            </button>
          </div>
        </div>
      </section>
      {data?.insights?.total && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
              <div className="text-xs uppercase text-blue-600">
                Total Expenses
              </div>
              <div className="text-2xl font-semibold text-blue-900">
                {formatCurrency(
                  data.insights.total.amount,
                  data.insights.currency || "AED"
                )}
              </div>
            </div>
            <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
              <div className="text-xs uppercase text-blue-600">
                Avg Monthly
              </div>
              <div className="text-2xl font-semibold text-blue-900">
                {formatCurrency(
                  data.insights.total.average_monthly_amount,
                  data.insights.currency || "AED"
                )}
              </div>
            </div>
            <div className="border border-blue-100 bg-blue-50 rounded-xl p-4">
              <div className="text-xs uppercase text-blue-600">Tx Count</div>
              <div className="text-2xl font-semibold text-blue-900">
                {data.insights.total.count}
              </div>
            </div>
          </div>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Month
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left font-semibold text-slate-600">
                      Count
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {monthlyTotals.map((month) => (
                    <tr key={`${month.year}-${month.month}`}>
                      <td className="px-4 py-3">
                        {month.month}/{month.year}
                      </td>
                      <td className="px-4 py-3">
                        {formatCurrency(
                          month.amount,
                          data.insights.currency || "AED"
                        )}
                      </td>
                      <td className="px-4 py-3">{month.count}</td>
                    </tr>
                  ))}
                  {!monthlyTotals.length && (
                    <tr>
                      <td
                        colSpan="3"
                        className="px-4 py-6 text-center text-slate-500"
                      >
                        No monthly totals available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </section>

          <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
              <h4 className="text-sm font-semibold text-slate-900">
                Category breakdown
              </h4>
            </div>
            {categories.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Amount
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Count
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {categories.map((category, idx) => (
                      <tr key={category.name || idx}>
                        <td className="px-4 py-3">
                          {category.name || category.category || "—"}
                        </td>
                        <td className="px-4 py-3">
                          {formatCurrency(
                            category.amount?.amount ?? category.amount ?? 0,
                            category.currency ||
                              category.amount?.currency ||
                              data.insights.currency ||
                              "AED"
                          )}
                        </td>
                        <td className="px-4 py-3">{category.count ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="px-4 py-6 text-sm text-slate-500">
                No category level data available for this period.
              </p>
            )}
          </section>
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

export default Expenses;
