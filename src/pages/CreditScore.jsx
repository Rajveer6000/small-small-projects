import { useEffect, useMemo, useRef, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { useUIContext } from "../context/UIContext";
import { API_BASE } from "../utils/leanConfig";
const FUN_GIF_URLS = [
  "https://media4.giphy.com/media/v1.Y2lkPTc5MGI3NjExcW5pY3RlcnlicWRic3k4Y2JkYmk1Y2ZoM2VzeTRmeG05ZmJxenpqaSZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/wCp3QhCzcJ6AU/giphy.gif",
];

const FUNNY_LOADING_MESSAGES = [
  "Bribing the bank manager...",
  "Consulting the financial oracles...",
  "Doing complex math (counting on fingers)...",
  "Judging your spending habits...",
  "Asking your mom if you're good for it...",
  "Checking if you returned those library books...",
  "Spinning the Wheel of Fortune...",
  "Analysing your avocado toast consumption...",
  "Searching for loose change in the server...",
  "Pretending to work...",
  "Calculating your net worth (it won't take long)...",
];

const defaultForm = {
  userId: "3",
  historyMonths: "6",
  declaredMonthlyIncome: "12000",
  declaredMonthlyExpense: "5000",
  employmentTenureInMonths: "24",
  numberOfDependents: "2",
  aecbScore: "710",
};

const toNumber = (value) => {
  const num = Number(value);
  return Number.isFinite(num) ? num : 0;
};

const formatScore = (value) =>
  value === undefined || value === null
    ? "-"
    : Number(value).toFixed(2).replace(/\.00$/, "");

const pickFunnyLine = () => {
  const idx = Math.floor(Math.random() * FUNNY_LOADING_MESSAGES.length);
  return FUNNY_LOADING_MESSAGES[idx];
};

const pickFunGifs = (count = 2) => {
  const shuffled = [...FUN_GIF_URLS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
};

const CreditScore = () => {
  const { userId } = useUserContext();
  const { setStatus, setError } = useUIContext();
  const [form, setForm] = useState(defaultForm);
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showGif, setShowGif] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(pickFunnyLine());
  const [rawOpen, setRawOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const overlayVisible = loading || showGif;
  const summaryRef = useRef(null);
  const [funGifs, setFunGifs] = useState(() => pickFunGifs(2));

  useEffect(() => {
    if (userId) {
      setForm((prev) => ({ ...prev, userId }));
    }
  }, [userId]);

  useEffect(() => {
    if (!overlayVisible) return undefined;
    const id = setInterval(() => {
      setLoadingMessage(pickFunnyLine());
    }, 2200);
    return () => clearInterval(id);
  }, [overlayVisible]);

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    setForm(userId ? { ...defaultForm, userId } : defaultForm);
  };

  const submit = async (e) => {
    e?.preventDefault();
    setLoading(true);
    setResult(null);
    setShowGif(false);
    setRawOpen(false);
    setErrorMessage("");
    setLoadingMessage(pickFunnyLine());
    setFunGifs(pickFunGifs(3));
    setStatus("Crunching credit score...", { tone: "info" });

    const patienceTimer = setTimeout(() => {
      setShowGif(true);
      setLoadingMessage((msg) => msg || pickFunnyLine());
    }, 3500);

    try {
      const payload = {
        userId: toNumber(form.userId),
        historyMonths: toNumber(form.historyMonths),
        declaredMonthlyIncome: toNumber(form.declaredMonthlyIncome),
        declaredMonthlyExpense: toNumber(form.declaredMonthlyExpense),
        employmentTenureInMonths: toNumber(form.employmentTenureInMonths),
        numberOfDependents: toNumber(form.numberOfDependents),
        aecbScore: toNumber(form.aecbScore),
      };

      const res = await fetch(`${API_BASE}/api/v1/credit-score/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Failed to calculate credit score");
      }

      const data = await res.json();
      setResult(data);
      setShowGif(false);
      setStatus("Credit score calculated.", { tone: "success", toast: true });
    } catch (err) {
      const message = err.message || "Could not reach credit score service";
      setErrorMessage(message);
      setShowGif(true);
      setLoadingMessage(pickFunnyLine());
      setError(message, { toast: true });
      setTimeout(() => setShowGif(false), 3500);
    } finally {
      clearTimeout(patienceTimer);
      setLoading(false);
    }
  };

  const calculation = result?.calculation || result;

  const mainCategoryCards = useMemo(() => {
    if (!calculation?.mainCategoryScores) return [];
    return calculation.mainCategoryScores.map((category) => ({
      id: category.mainCategoryId,
      name: category.mainCategoryName,
      weight: category.mainCategoryWeightage,
      score: category.finalMainCategoryScore,
      details: category.calculationDetails,
    }));
  }, [calculation]);

  const adjustmentChips = useMemo(() => {
    if (!calculation?.adjustments) return [];
    return calculation.adjustments.map((adj) => ({
      id: adj.adjustmentRuleId,
      name: adj.displayName,
      reason: adj.reason,
      points: adj.points,
      applied: adj.applied,
    }));
  }, [calculation]);

  useEffect(() => {
    if (calculation && summaryRef.current) {
      summaryRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [calculation]);

  return (
    <div className="space-y-5">
      <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 p-6 shadow-lg">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,0.12),transparent_25%),radial-gradient(circle_at_80%_0%,rgba(59,130,246,0.2),transparent_25%)]" />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="text-xs uppercase tracking-[0.25em] text-blue-200">
              Credit Intelligence
            </div>
            <h1 className="text-2xl font-semibold text-white">
              Credit Score Workbench
            </h1>
            <p className="text-sm text-blue-100 max-w-2xl">
              Run the calculation, monitor the live call, and visualize how each
              financial pillar impacts the final risk tier.
            </p>
          </div>
          <div className="grid w-full max-w-lg grid-cols-1 gap-3 text-sm text-blue-100 md:grid-cols-2">
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-emerald-300 animate-pulse" />
              <div>
                <div className="text-xs uppercase tracking-wide text-blue-200">
                  Endpoint
                </div>
                <div className="font-semibold">POST /credit-score/calculate</div>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-white/10 px-4 py-3 border border-white/20">
              <span className="h-2 w-2 rounded-full bg-blue-300" />
              <div>
                <div className="text-xs uppercase tracking-wide text-blue-200">
                  Target
                </div>
                <div className="font-semibold">localhost:8080</div>
              </div>
            </div>
            <div className="col-span-1 md:col-span-2 rounded-xl bg-gradient-to-r from-emerald-500/30 to-blue-400/30 border border-white/20 p-4 shadow-lg">
              <div className="flex items-center justify-between text-blue-50">
                <div className="text-xs uppercase tracking-wide text-blue-100">
                  Latest score
                </div>
                <div className="text-[11px] uppercase tracking-wide text-blue-100">
                  Scrolls to details on update
                </div>
              </div>
              <div className="mt-2 flex items-end gap-3 text-white">
                <div className="text-4xl font-bold">
                  {calculation?.finalScore ? formatScore(calculation.finalScore) : "-"}
                </div>
                <div className="mb-1 text-sm text-blue-100">/ 10</div>
                <div className="ml-auto rounded-full bg-white/15 px-3 py-1 text-xs font-semibold">
                  Tier {calculation?.riskTier ?? "-"}
                </div>
              </div>
              <div className="mt-3 h-2 rounded-full bg-white/20 overflow-hidden">
                <div
                  className="h-full bg-emerald-300"
                  style={{
                    width: `${
                      Math.min(
                        100,
                        Math.max(0, (Number(calculation?.finalScore || 0) / 10) * 100)
                      ) || 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <form className="space-y-4" onSubmit={submit}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm font-medium text-slate-700 flex flex-col gap-1">
              User ID
              <input
                type="number"
                value={form.userId}
                onChange={(e) => handleChange("userId", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 3"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 flex flex-col gap-1">
              History months
              <input
                type="number"
                value={form.historyMonths}
                onChange={(e) => handleChange("historyMonths", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 6"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 flex flex-col gap-1">
              AECB score
              <input
                type="number"
                value={form.aecbScore}
                onChange={(e) => handleChange("aecbScore", e.target.value)}
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 710"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm font-medium text-slate-700 flex flex-col gap-1">
              Declared monthly income (AED)
              <input
                type="number"
                value={form.declaredMonthlyIncome}
                onChange={(e) =>
                  handleChange("declaredMonthlyIncome", e.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 12000"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 flex flex-col gap-1">
              Declared monthly expense (AED)
              <input
                type="number"
                value={form.declaredMonthlyExpense}
                onChange={(e) =>
                  handleChange("declaredMonthlyExpense", e.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 5000"
              />
            </label>
            <label className="text-sm font-medium text-slate-700 flex flex-col gap-1">
              Employment tenure (months)
              <input
                type="number"
                value={form.employmentTenureInMonths}
                onChange={(e) =>
                  handleChange("employmentTenureInMonths", e.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 24"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label className="text-sm font-medium text-slate-700 flex flex-col gap-1">
              Number of dependents
              <input
                type="number"
                value={form.numberOfDependents}
                onChange={(e) =>
                  handleChange("numberOfDependents", e.target.value)
                }
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2"
              />
            </label>
            <div className="md:col-span-2 flex flex-wrap items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 disabled:bg-slate-300"
              >
                {loading ? "Calculating..." : "Calculate score"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                disabled={loading}
                className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Reset defaults
              </button>
            </div>
          </div>

          {errorMessage && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {errorMessage}
            </div>
          )}

        </form>
      </section>

      {calculation && (
        <div ref={summaryRef} className="space-y-4">
          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="rounded-lg bg-blue-50 border border-blue-100 p-3">
                <div className="text-xs uppercase text-blue-700">Score</div>
                <div className="text-3xl font-bold text-blue-900">
                  {formatScore(calculation.finalScore)}
                </div>
                <div className="text-xs text-blue-800">Out of 10</div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <div className="text-xs uppercase text-slate-600">Risk tier</div>
                <div className="text-2xl font-bold text-slate-900">
                  {calculation.riskTier ?? "-"}
                </div>
                <div className="text-xs text-slate-600">
                  Calculation ID {calculation.calculationId ?? "-"}
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 border border-slate-100 p-3">
                <div className="text-xs uppercase text-slate-600">User</div>
                <div className="text-lg font-semibold text-slate-900">
                  {calculation.userId ?? form.userId}
                </div>
                <div className="text-xs text-slate-600">
                  History {calculation.historyMonths ?? form.historyMonths} months
                </div>
              </div>
              
            </div>
          </section>

          {mainCategoryCards.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Main categories
                </h3>
                <p className="text-xs text-slate-500">
                  Weighted contribution to the final score
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 p-4">
                {mainCategoryCards.map((card) => (
                  <div
                    key={card.id}
                    className="rounded-lg border border-slate-200 bg-white p-3 shadow-sm"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-sm font-semibold text-slate-900">
                        {card.name}
                      </div>
                      <div className="rounded-full bg-slate-900 text-white px-3 py-1 text-xs font-semibold">
                        {formatScore(card.score)}
                      </div>
                    </div>
                    <div className="mt-1 text-xs text-slate-600">
                      Weight {formatScore(card.weight)}%
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-slate-200 overflow-hidden">
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${
                            Math.min(
                              100,
                              Math.max(0, (Number(card.score || 0) / 10) * 100)
                            ) || 0
                          }%`,
                        }}
                      />
                    </div>
                    <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                      {card.details}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {adjustmentChips.length > 0 && (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Adjustments
                </h3>
                <p className="text-xs text-slate-500">
                  Bonuses and penalties
                </p>
              </div>
              <div className="p-4 flex flex-wrap gap-3">
                {adjustmentChips.map((adj) => (
                  <div
                    key={adj.id}
                    className={`flex items-start gap-3 rounded-lg border px-3 py-2 text-sm shadow-sm ${
                      adj.applied
                        ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                        : "border-slate-200 bg-slate-50 text-slate-700"
                    }`}
                  >
                    <div className="rounded-full bg-white/80 px-2 py-0.5 text-xs font-semibold">
                      {adj.points > 0 ? `+${adj.points}` : adj.points}
                    </div>
                    <div className="space-y-1">
                      <div className="font-semibold">{adj.name}</div>
                      <div className="text-xs opacity-80">{adj.reason}</div>
                      <div className="text-[11px] uppercase tracking-wide opacity-70">
                        {adj.applied ? "Applied" : "Not applied"}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {calculation?.categoryScores?.length ? (
            <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  Category breakdown
                </h3>
                <p className="text-xs text-slate-500">
                  Raw values and weighted impact
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Type
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Raw
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Score
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Weight %
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-slate-600">
                        Weighted
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-slate-600">
                        Details
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {calculation.categoryScores.map((row) => (
                      <tr key={row.categoryConfigId}>
                        <td className="px-4 py-3 text-slate-800">
                          {row.mainCategoryName}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.categoryTypeName}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatScore(row.rawValue)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {formatScore(row.rawScore)}
                        </td>
                        <td className="px-4 py-3 text-right text-slate-600">
                          {formatScore(row.weightage)}
                        </td>
                        <td className="px-4 py-3 text-right font-semibold text-blue-700">
                          {formatScore(row.weightedScore)}
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {row.calculationDetails}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          ) : null}

          <section className="rounded-xl bg-slate-900 text-slate-100">
            <button
              type="button"
              onClick={() => setRawOpen((prev) => !prev)}
              className="w-full px-4 py-3 text-left text-sm font-semibold flex items-center justify-between"
            >
              Raw response
              <span>{rawOpen ? "-" : "+"}</span>
            </button>
            {rawOpen && (
              <pre className="px-4 pb-4 text-xs overflow-x-auto">
                {JSON.stringify(result, null, 2)}
              </pre>
            )}
          </section>
        </div>
      )}

      {overlayVisible && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/70 backdrop-blur">
          <div className="w-full max-w-4xl rounded-3xl border border-slate-200 bg-white shadow-[0_30px_120px_rgba(0,0,0,0.25)] overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 via-white to-slate-50">
              <div className="text-[11px] uppercase text-slate-500 tracking-wide">
                Scoring in progress
              </div>
              <div className="text-lg font-semibold text-slate-900">
                {loading ? "Running calculation..." : "Waiting on the API"}
              </div>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-4">
                <div className="relative h-14 w-14">
                  <div className="absolute inset-0 rounded-full border-4 border-blue-100 border-t-blue-500 animate-spin" />
                  <div className="absolute inset-3 rounded-full bg-blue-50" />
                </div>
                <div className="space-y-1">
                  <div className="text-base font-semibold text-slate-900">
                    {loadingMessage}
                  </div>
                  <div className="text-sm text-slate-500">
                    Our finance gremlins are crunching numbers and brewing tea.
                  </div>
                </div>
              </div>
              <div className="grid">
                {funGifs.map((gif, idx) => (
                  <div
                    key={gif + idx}
                    className="rounded-2xl border border-slate-200 bg-slate-50 p-3 flex gap-3"
                  >
                    <img
                      src={gif}
                      alt="Waiting for the API"
                      className="h-24 w-28 rounded-xl object-cover shadow"
                    />
                    <div className="space-y-1 text-xs text-slate-600 flex-1">
                      <div className="font-semibold text-slate-800 text-sm">
                        Chief Cat Officer is on it...
                      </div>
                      <div className="text-sm">{loadingMessage}</div>
                      <div className="text-[11px] text-slate-500 leading-relaxed">
                        Bribing servers with laser pointers.
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CreditScore;
