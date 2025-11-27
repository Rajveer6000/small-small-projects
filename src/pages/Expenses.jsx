import { useMemo, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useUIContext } from "../context/UIContext";
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

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "—";

const formatPercentage = (value) =>
  value === undefined || value === null
    ? "-"
    : `${(Number(value) * 100).toFixed(1)}%`;

// Format category name for display
const formatCategoryName = (category) => {
  if (!category) return "-";
  return category
    .split("_")
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(" ");
};

const Expenses = () => {
  const { userId, hasUser } = useUserContext();
  const { setStatus, setError } = useUIContext();
  const [startDate, setStartDate] = useState(defaultStart());
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [rawOpen, setRawOpen] = useState(false);

  const categories = useMemo(() => {
    const breakdown =
      data?.insights?.total?.breakdown?.find((b) => b.by === "category")
        ?.breakdowns || [];
    return breakdown.sort((a, b) => (b.amount || 0) - (a.amount || 0));
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

  const defaultCurrency = data?.insights?.currency || "AED";
  const totalData = data?.insights?.total;

  const summaryCards = useMemo(() => {
    if (!totalData) return [];
    return [
      {
        title: "Total Expenses",
        value: formatCurrency(totalData.amount ?? 0, defaultCurrency),
        hint: `${totalData.count || 0} transactions`,
      },
      {
        title: "Avg Monthly",
        value: formatCurrency(
          totalData.average_monthly_amount ?? 0,
          defaultCurrency
        ),
        hint: `${totalData.average_monthly_count?.toFixed(1) || 0} tx/month`,
      },
      {
        title: "Peak Month",
        value: formatCurrency(
          totalData.maximum_monthly_amount?.amount ?? 0,
          defaultCurrency
        ),
        hint: `${totalData.maximum_monthly_amount?.month || "-"}/${
          totalData.maximum_monthly_amount?.year || "-"
        }`,
      },
    ];
  }, [totalData, defaultCurrency]);

  const renderCategoryTable = () => {
    if (!categories.length) return null;
    return (
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <div>
            <h4 className="text-sm font-semibold text-slate-900">
              Category Breakdown
            </h4>
            <p className="text-xs text-slate-500">
              Showing {categories.length} categories
            </p>
          </div>
        </div>
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
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Avg Monthly
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  % of Total
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Max Monthly
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Min Monthly
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Avg Days Between
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  First / Last Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {categories.map((category, idx) => {
                const categoryCurrency =
                  category.currency ||
                  category.amount?.currency ||
                  defaultCurrency;

                return (
                  <tr key={category.category || idx}>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {formatCategoryName(category.category)}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-900">
                      {formatCurrency(
                        category.amount?.amount ?? category.amount ?? 0,
                        categoryCurrency
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {category.count ?? 0}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatCurrency(
                        category.average_monthly_amount,
                        categoryCurrency
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {formatPercentage(category.fraction_of_total_expenses)}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatCurrency(
                        category.maximum_monthly_amount?.amount ??
                          category.maximum_monthly_amount,
                        categoryCurrency
                      )}
                      {category.maximum_monthly_amount?.month && (
                        <span className="text-xs text-slate-500 ml-1">
                          ({category.maximum_monthly_amount.month}/
                          {category.maximum_monthly_amount.year})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {formatCurrency(
                        category.minimum_monthly_amount?.amount ??
                          category.minimum_monthly_amount,
                        categoryCurrency
                      )}
                      {category.minimum_monthly_amount?.month && (
                        <span className="text-xs text-slate-500 ml-1">
                          ({category.minimum_monthly_amount.month}/
                          {category.minimum_monthly_amount.year})
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-slate-600">
                      {category.average_days_between_transactions?.toFixed(2) ??
                        "-"}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs">
                      <div className="text-slate-700">
                        {formatDate(category.first_date_time)}
                      </div>
                      <div className="text-slate-500">
                        {formatDate(category.last_date_time)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  const renderMonthlyBreakdown = () => {
    const monthlyTotals = data?.insights?.monthly_totals ?? [];
    if (!monthlyTotals.length) return null;

    return (
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h4 className="text-sm font-semibold text-slate-900">
            Monthly Breakdown by Category
          </h4>
        </div>
        <div className="p-4 space-y-4">
          {monthlyTotals.map((month) => {
            const categoryBreakdowns =
              month.breakdown?.find((b) => b.by === "category")?.breakdowns ||
              [];
            
            if (!categoryBreakdowns.length && month.amount === 0) return null;

            return (
              <div
                key={`${month.year}-${month.month}`}
                className="border border-slate-200 rounded-lg overflow-hidden"
              >
                <div className="bg-slate-50 px-4 py-3 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-slate-900">
                      {new Date(
                        month.year,
                        month.month - 1
                      ).toLocaleDateString("en-US", {
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-slate-600 mt-1">
                      Total: {formatCurrency(month.amount, defaultCurrency)} •{" "}
                      {month.count} transactions
                      {!month.is_month_complete && (
                        <span className="ml-2 text-amber-600">
                          (Incomplete)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                {categoryBreakdowns.length > 0 && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200 text-sm">
                      <thead className="bg-slate-50">
                        <tr>
                          <th className="px-4 py-2 text-left text-xs font-semibold text-slate-600">
                            Category
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">
                            Amount
                          </th>
                          <th className="px-4 py-2 text-center text-xs font-semibold text-slate-600">
                            Count
                          </th>
                          <th className="px-4 py-2 text-right text-xs font-semibold text-slate-600">
                            % of Month
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 bg-white">
                        {categoryBreakdowns
                          .sort((a, b) => (b.amount || 0) - (a.amount || 0))
                          .map((cat, idx) => (
                            <tr key={cat.category || idx}>
                              <td className="px-4 py-2 text-slate-800">
                                {formatCategoryName(cat.category)}
                              </td>
                              <td className="px-4 py-2 text-right font-semibold text-slate-900">
                                {formatCurrency(cat.amount, defaultCurrency)}
                              </td>
                              <td className="px-4 py-2 text-center text-slate-600">
                                {cat.count}
                              </td>
                              <td className="px-4 py-2 text-right text-slate-600">
                                {formatPercentage(
                                  cat.fraction_of_total_expenses
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  const renderMonthlyTotals = () => {
    const monthlyTotals = data?.insights?.monthly_totals ?? [];
    if (!monthlyTotals.length) return null;

    return (
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
          <h4 className="text-sm font-semibold text-slate-900">
            Monthly Totals
          </h4>
        </div>
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
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyTotals.map((month) => (
                <tr key={`${month.year}-${month.month}`}>
                  <td className="px-4 py-3 text-slate-800">
                    {new Date(month.year, month.month - 1).toLocaleDateString(
                      "en-US",
                      {
                        month: "long",
                        year: "numeric",
                      }
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">
                    {formatCurrency(month.amount, defaultCurrency)}
                  </td>
                  <td className="px-4 py-3 text-slate-600">{month.count}</td>
                  <td className="px-4 py-3">
                    {month.is_month_complete ? (
                      <span className="text-xs text-emerald-600">Complete</span>
                    ) : (
                      <span className="text-xs text-amber-600">Incomplete</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    );
  };

  return (
    <div className="space-y-6">
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Expenses</h3>
            <p className="text-sm text-slate-500">
              Query Lean&apos;s expense insights for the selected customer.
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

      {data?.insights && (
        <>
          {summaryCards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {summaryCards.map((card) => (
                <div
                  key={card.title}
                  className="border border-blue-100 bg-blue-50 rounded-xl p-4"
                >
                  <div className="text-xs uppercase text-blue-600">
                    {card.title}
                  </div>
                  <div className="text-2xl font-semibold text-blue-900">
                    {card.value}
                  </div>
                  <div className="text-xs text-blue-700 mt-1">{card.hint}</div>
                </div>
              ))}
            </div>
          )}

          {renderCategoryTable()}
          {renderMonthlyBreakdown()}
          {renderMonthlyTotals()}
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
