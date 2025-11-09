import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { API_BASE, APP_TOKEN, SANDBOX } from "../utils/leanConfig";

const PAYMENT_INTENT_STATUSES = [
  "ALL",
  "CREDENTIALS_UPDATE_REQUIRED",
  "AWAITING_END_USER_AUTHORIZATION",
  "AWAITING_LOGIN_MFA_TOKEN",
  "AWAITING_APP_AUTH",
  "AWAITING_PAYMENT_MFA_TOKEN",
  "AWAITING_PAYMENT_SECURITY_QUESTIONS",
  "INVALID_CREDENTIALS",
  "INVALID_LOGIN_MFA",
  "INVALID_PAYMENT_MFA",
  "BENEFICIARY_NOT_FOUND",
  "MFA_ATTEMPTS_EXHAUSTED",
  "SECURITY_QUESTION_ANSWER_ATTEMPTS_EXHAUSTED",
  "PENDING_WITH_BANK",
  "AWAITING_AUTHORIZATION",
  "FAILED",
  "AWAITING_AUTHORIZATION_LOGIN_MFA",
  "INVALID_AUTHORIZATION_LOGIN_MFA",
  "AWAITING_AUTHORIZATION_LOGIN_SECURITY_QUESTION",
  "AWAITING_AUTHORIZATION_LOGIN_SECURITY_QUESTION_ANSWER",
  "INVALID_AUTHORIZATION_LOGIN_SECURITY_QUESTION_ANSWER",
  "AUTHORIZATION_LOGIN_SECURITY_QUESTION_ANSWER_ATTEMPTS_EXHAUSTED",
  "AUTHORIZATION_FAILED",
  "AWAITING_AUTHORIZATION_PAYMENT_MFA",
  "INVALID_AUTHORIZATION_PAYMENT_MFA",
  "PARTIAL_ACCEPTED_BY_BANK",
  "AUTHORIZATION_MFA_ATTEMPTS_EXHAUSTED",
];

const formatCurrency = (value, currency = "AED") => {
  if (value === undefined || value === null || Number.isNaN(Number(value))) {
    return "-";
  }
  return new Intl.NumberFormat("en-AE", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
  }).format(Number(value));
};

const formatDateTime = (value) =>
  value ? new Date(value).toLocaleString() : "-";

const startOfMonth = () => {
  const date = new Date();
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = "01";
  return `${date.getFullYear()}-${month}-${day}`;
};

const Payments = () => {
  const {
    userId,
    hasUser,
    leanTokens,
    refreshLeanTokens,
    tokensRefreshing,
  } = useUserContext();
  const [destinations, setDestinations] = useState([]);
  const [selectedDestination, setSelectedDestination] = useState("");
  const [paymentSources, setPaymentSources] = useState([]);
  const [selectedSource, setSelectedSource] = useState("");
  const [amount, setAmount] = useState("100");
  const [currency, setCurrency] = useState("AED");
  const [description, setDescription] = useState("Customer payment");
  const [intent, setIntent] = useState(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [paymentIntents, setPaymentIntents] = useState([]);
  const [intentFilters, setIntentFilters] = useState({
    from: startOfMonth(),
    to: "",
    status: "ALL",
    page: 0,
    size: 10,
  });
  const [intentsPage, setIntentsPage] = useState(null);
  const [intentsLoading, setIntentsLoading] = useState(false);
  const [intentDetailsId, setIntentDetailsId] = useState("");
  const [intentDetails, setIntentDetails] = useState(null);
  const [intentDetailsLoading, setIntentDetailsLoading] = useState(false);
  const [paymentDetailsId, setPaymentDetailsId] = useState("");
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [paymentDetailsLoading, setPaymentDetailsLoading] = useState(false);

  const setInfo = (message) => {
    setError("");
    setStatus(message);
  };

  const loadDestinations = async () => {
    setLoading(true);
    setInfo("Loading payment destinations...");
    try {
      const res = await fetch(`${API_BASE}/api/beneficiaries/getAll`);
      if (!res.ok) throw new Error("Unable to load destinations");
      const data = await res.json();
      setDestinations(data);
      if (data.length && !selectedDestination) {
        setSelectedDestination(data[0].id || data[0].payment_destination_id);
      }
      setInfo(`Loaded ${data.length} destinations`);
    } catch (err) {
      setError(err.message || "Failed to load destinations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDestinations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (hasUser) {
      checkPaymentSources();
    } else {
      setPaymentSources([]);
      setSelectedSource("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser, userId]);

  const checkPaymentSources = async () => {
    if (!hasUser) {
      setError("Provide a user id first.");
      return;
    }
    setLoading(true);
    setInfo("Checking payment sources...");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/get-payment-sources?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error("Unable to load payment sources");
      const data = await res.json();
      const sources =
        data?.payload?.payment_sources ||
        data?.payment_sources ||
        data?.payload ||
        (Array.isArray(data) ? data : data ? [data] : []) ||
        [];
      setPaymentSources(sources);
      if (sources.length) {
        setSelectedSource(sources[0].payment_source_id || sources[0].id);
      }
      setInfo(
        sources.length
          ? `Found ${sources.length} payment source(s).`
          : "No payment sources found. Run Lean Connect first."
      );
    } catch (err) {
      setError(err.message || "Failed to load payment sources");
    } finally {
      setLoading(false);
    }
  };

  const deletePaymentSource = async (sourceId) => {
    if (!hasUser) {
      setError("Provide a user id first.");
      return;
    }
    if (!sourceId) {
      setError("Select a payment source first.");
      return;
    }
    if (
      !window.confirm(
        "Delete this payment source? The customer will need to reconnect to use it again."
      )
    ) {
      return;
    }
    setLoading(true);
    setError("");
    setInfo("Deleting payment source...");
    try {
      const url = `${API_BASE}/api/lean/payment-sources/${encodeURIComponent(
        sourceId
      )}?userId=${encodeURIComponent(userId)}&reason=USER_REQUESTED`;
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete payment source");
      setInfo("Payment source deleted.");
      await checkPaymentSources();
    } catch (err) {
      setError(err.message || "Delete payment source failed");
    } finally {
      setLoading(false);
    }
  };

  const startConnect = async () => {
    if (!hasUser) {
      setError("Provide a user id first.");
      return;
    }
    setLoading(true);
    setInfo("Fetching Lean tokens for payments...");
    try {
      const data = await refreshLeanTokens();
      if (!data) throw new Error("Unable to fetch Lean tokens");

      if (window.Lean?.connect) {
        window.Lean.connect({
          app_token: APP_TOKEN,
          permissions: ["payments"],
          customer_id: data.leanUserId,
          sandbox: SANDBOX,
          payment_destination_id: selectedDestination || undefined,
          access_token: data.leanAccessToken,
        });
        setInfo("Lean Connect launched. Complete the flow to add a source.");
      } else {
        setError("Lean SDK not loaded on this page.");
      }
    } catch (err) {
      setError(err.message || "Failed to start Lean Connect");
    } finally {
      setLoading(false);
    }
  };

  const createPaymentIntent = async () => {
    if (!hasUser) {
      setError("Provide a user id first.");
      return;
    }
    if (!selectedDestination) {
      setError("Select a destination first.");
      return;
    }
    setLoading(true);
    setInfo("Creating payment intent...");
    try {
      const payload = {
        amount: parseFloat(amount),
        currency,
        payment_destination_id: selectedDestination,
        user_id: Number(userId),
        description,
      };
      if (selectedSource) {
        payload.payment_source_id = selectedSource;
      }
      const res = await fetch(`${API_BASE}/payment/create-payment-intent`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(
          `Intent creation failed: ${res.status} ${text || ""}`.trim()
        );
      }
      const data = await res.json();
      if (!data?.payment_intent_id) {
        throw new Error("Backend returned no payment_intent_id");
      }
      setIntent(data);
      setInfo("Payment intent ready. Launch Lean Pay to finish.");
    } catch (err) {
      setError(err.message || "Failed to create payment intent");
    } finally {
      setLoading(false);
    }
  };

  const executePayment = async () => {
    if (!intent) {
      setError("Create an intent first.");
      return;
    }
    let tokens = leanTokens;
    if (!tokens?.leanAccessToken) {
      try {
        tokens = await refreshLeanTokens();
      } catch (err) {
        setError(err.message || "Unable to refresh Lean tokens");
        return;
      }
    }
    if (!tokens?.leanAccessToken) {
      setError("Start Connect to refresh Lean tokens before paying.");
      return;
    }
    if (!window.Lean?.pay) {
      setError("Lean SDK pay() is unavailable.");
      return;
    }
    try {
      window.Lean.pay({
        access_token: tokens?.leanAccessToken,
        app_token: APP_TOKEN,
        payment_intent_id: intent.payment_intent_id,
        show_balances: false,
        sandbox: true,
      });
      setInfo("Lean Pay opened. Approve the transfer in the modal.");
    } catch (err) {
      setError(err.message || "Failed to start Lean Pay");
    }
  };

  const handleIntentFilterChange = (e) => {
    const { name, value } = e.target;
    setIntentFilters((prev) => ({
      ...prev,
      [name]:
        name === "size" || name === "page"
          ? Number(value)
          : value,
    }));
  };

  const fetchPaymentIntents = async (pageOverride = null) => {
    if (!hasUser) {
      setError("Provide a user id first.");
      return;
    }
    const targetPage =
      typeof pageOverride === "number"
        ? Math.max(0, pageOverride)
        : intentFilters.page;

    setIntentsLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      const size = intentFilters.size || 10;
      params.set("userId", userId);
      params.set("page", targetPage);
      params.set("size", size);
      if (intentFilters.from) params.set("from", intentFilters.from);
      if (intentFilters.to) params.set("to", intentFilters.to);
      if (intentFilters.status && intentFilters.status !== "ALL") {
        params.set("status", intentFilters.status);
      }
      const res = await fetch(
        `${API_BASE}/api/lean/payment-intents?${params.toString()}`
      );
      if (!res.ok) throw new Error("Unable to load payment intents");
      const data = await res.json();
      setPaymentIntents(data?.data || []);
      setIntentsPage(data?.page || null);
      setIntentFilters((prev) => ({ ...prev, page: targetPage, size }));
      setInfo(
        `Loaded ${data?.data?.length ?? 0} payment intents (page ${
          targetPage + 1
        }).`
      );
    } catch (err) {
      setError(err.message || "Failed to load payment intents");
    } finally {
      setIntentsLoading(false);
    }
  };

  const handleIntentPageChange = (direction) => {
    const currentPage = intentsPage?.number ?? intentFilters.page;
    const totalPages = intentsPage?.total_pages ?? null;
    const nextPage = Math.max(0, currentPage + direction);
    if (direction > 0 && totalPages !== null && nextPage >= totalPages) {
      return;
    }
    if (direction < 0 && currentPage === 0) {
      return;
    }
    fetchPaymentIntents(nextPage);
  };

  const fetchIntentDetails = async (providedId) => {
    if (!hasUser) {
      setError("Provide a user id first.");
      return;
    }
    const targetId = (providedId ?? intentDetailsId)?.trim();
    if (!targetId) {
      setError("Enter a payment intent id.");
      return;
    }
    setIntentDetailsLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/payment-intents/${targetId}?userId=${encodeURIComponent(
          userId
        )}`
      );
      if (!res.ok) throw new Error("Unable to load payment intent details");
      const data = await res.json();
      setIntentDetails(data);
      setIntentDetailsId(targetId);
      if (data?.payments?.length && !paymentDetailsId) {
        setPaymentDetailsId(data.payments[0].id);
      }
      setInfo("Payment intent details loaded.");
    } catch (err) {
      setError(err.message || "Failed to load payment intent details");
    } finally {
      setIntentDetailsLoading(false);
    }
  };

  const fetchPaymentDetails = async (providedId) => {
    if (!hasUser) {
      setError("Provide a user id first.");
      return;
    }
    const targetId = (providedId ?? paymentDetailsId)?.trim();
    if (!targetId) {
      setError("Enter a payment id.");
      return;
    }
    setPaymentDetailsLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/payments/${targetId}?userId=${encodeURIComponent(
          userId
        )}`
      );
      if (!res.ok) throw new Error("Unable to load payment details");
      const data = await res.json();
      setPaymentDetails(data);
      setPaymentDetailsId(targetId);
      setInfo("Payment details loaded.");
    } catch (err) {
      setError(err.message || "Failed to load payment details");
    } finally {
      setPaymentDetailsLoading(false);
    }
  };

  const handleSelectIntent = (record) => {
    if (!record?.payment_intent_id) return;
    setIntentDetailsId(record.payment_intent_id);
    fetchIntentDetails(record.payment_intent_id);
    const paymentId = record.payments?.[0]?.id;
    if (paymentId) {
      setPaymentDetailsId(paymentId);
    }
  };

  const handleSelectPayment = (payment) => {
    if (!payment?.id) return;
    setPaymentDetailsId(payment.id);
    fetchPaymentDetails(payment.id);
  };

  useEffect(() => {
    if (hasUser) {
      fetchPaymentIntents(0);
    } else {
      setPaymentIntents([]);
      setIntentsPage(null);
      setIntentDetails(null);
      setPaymentDetails(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasUser, userId]);

  const currentIntentPage = intentsPage?.number ?? intentFilters.page ?? 0;
  const totalIntentPages = intentsPage?.total_pages ?? null;
  const hasPrevIntentPage = currentIntentPage > 0;
  const hasNextIntentPage =
    totalIntentPages !== null
      ? currentIntentPage + 1 < totalIntentPages
      : paymentIntents.length === intentFilters.size;

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
      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">Destinations</h3>
            <p className="text-sm text-slate-500">
              Fetch available destination banks and select where to send funds.
            </p>
          </div>
          <button
            onClick={loadDestinations}
            className="px-4 py-2 rounded-md bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Load Destinations
          </button>
        </div>
        {destinations.length > 0 && (
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-2">
            Destination
            <select
              value={selectedDestination}
              onChange={(e) => setSelectedDestination(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              {destinations.map((dest) => (
                <option
                  key={dest.id || dest.payment_destination_id}
                  value={dest.id || dest.payment_destination_id}
                >
                  {dest.bank_name || dest.name} ·{" "}
                  {dest.account_number || dest.iban || dest.country}
                </option>
              ))}
            </select>
          </label>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Payment Sources
            </h3>
            <p className="text-sm text-slate-500">
              Ensure the customer has at least one payment source via Lean
              Connect.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={startConnect}
              disabled={
                !hasUser ||
                loading ||
                tokensRefreshing ||
                paymentSources.length > 0
              }
              className={`px-4 py-2 rounded-md text-sm font-semibold ${
                !hasUser ||
                loading ||
                tokensRefreshing ||
                paymentSources.length > 0
                  ? "bg-slate-300 text-slate-600 cursor-not-allowed"
                  : "bg-indigo-600 text-white hover:bg-indigo-700"
              }`}
            >
              Start Connect
            </button>
            <button
              onClick={checkPaymentSources}
              className="px-4 py-2 rounded-md border border-slate-200 text-sm font-semibold hover:bg-slate-50"
            >
              Check Sources
            </button>
            <button
              onClick={() => deletePaymentSource(selectedSource)}
              disabled={!selectedSource || loading}
              className="px-4 py-2 rounded-md border border-rose-200 text-sm font-semibold text-rose-600 hover:bg-rose-50 disabled:opacity-50"
            >
              Delete Selected
            </button>
          </div>
        </div>
        {paymentSources.length > 0 ? (
          <>
            <label className="text-sm font-medium text-slate-600 flex flex-col gap-2">
              Payment Source
              <select
                value={selectedSource}
                onChange={(e) => setSelectedSource(e.target.value)}
                className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
              >
                {paymentSources.map((source) => (
                  <option
                    key={source.payment_source_id || source.id}
                    value={source.payment_source_id || source.id}
                  >
                    {source.bank_identifier || source.bank_name || "Source"} ·{" "}
                    {source.status || "UNKNOWN"}
                  </option>
                ))}
              </select>
            </label>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {paymentSources.map((source) => {
                const sourceId = source.payment_source_id || source.id;
                return (
                  <div
                    key={`${sourceId}-card`}
                    className={`border rounded-xl p-4 space-y-4 ${
                      selectedSource === sourceId
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-slate-200 bg-white"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase text-slate-500">
                          Source ID
                        </div>
                        <div className="text-sm font-mono text-slate-900 break-all">
                          {sourceId}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                          Bank identifier:{" "}
                          {source.bank_identifier || "Unspecified"}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          source.status === "ACTIVE"
                            ? "bg-emerald-50 text-emerald-700"
                            : "bg-amber-50 text-amber-700"
                        }`}
                      >
                        {source.status || "UNKNOWN"}
                      </span>
                    </div>

                    <div>
                      <div className="text-xs uppercase text-slate-500 mb-2">
                        Accounts
                      </div>
                      {source.accounts?.length ? (
                        <div className="space-y-2">
                          {source.accounts.map((account) => (
                            <div
                              key={account.id || account.account_id}
                              className="border border-slate-200 rounded-lg p-3 bg-white"
                            >
                              <div className="flex items-center justify-between text-sm text-slate-900">
                                <span className="font-semibold">
                                  {account.account_name}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {account.currency}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                {account.account_number} · {account.iban}
                              </p>
                              <p className="text-xs text-slate-500">
                                Account ID: {account.account_id}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500">
                          No accounts received for this source.
                        </p>
                      )}
                    </div>

                    {source.beneficiaries?.length > 0 && (
                      <div>
                        <div className="text-xs uppercase text-slate-500 mb-2">
                          Beneficiaries
                        </div>
                        <div className="space-y-2">
                          {source.beneficiaries.map((beneficiary) => (
                            <div
                              key={beneficiary.id}
                              className="border border-slate-200 rounded-lg p-3 bg-white"
                            >
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-semibold text-slate-900">
                                  {beneficiary.bank_identifier}
                                </span>
                                <span className="text-xs text-slate-500">
                                  {beneficiary.status}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500 mt-1">
                                Destination ID: {beneficiary.payment_destination_id}
                              </p>
                              {beneficiary.beneficiary_cool_off_expiry && (
                                <p className="text-xs text-slate-500">
                                  Cool-off till{" "}
                                  {new Date(
                                    beneficiary.beneficiary_cool_off_expiry
                                  ).toLocaleString()}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">
            No sources yet. Ask the user to finish Lean Connect, then refresh.
          </p>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">
            Create Intent & Pay
          </h3>
          <p className="text-sm text-slate-500">
            Build the payment intent, then hand off to Lean Pay for execution.
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Amount
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Currency
            <input
              type="text"
              value={currency}
              onChange={(e) => setCurrency(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1 md:col-span-2">
            Description
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-emerald-500"
            />
          </label>
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={createPaymentIntent}
            className="px-4 py-2 rounded-md bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
          >
            Create Intent
          </button>
          <button
            onClick={executePayment}
            disabled={!intent}
            className="px-4 py-2 rounded-md border border-emerald-200 text-sm font-semibold hover:bg-emerald-50 disabled:opacity-50"
          >
            Pay with Lean
          </button>
        </div>
        {intent && (
          <div className="text-sm text-slate-600">
            Intent <span className="font-mono">{intent.payment_intent_id}</span>{" "}
            for {intent.amount} {intent.currency}
          </div>
        )}
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Payment Intents
            </h3>
            <p className="text-sm text-slate-500">
              Review historical intents and drill into their payment attempts.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => fetchPaymentIntents(0)}
              disabled={!hasUser || intentsLoading}
              className="px-4 py-2 rounded-md border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              {intentsLoading ? "Loading..." : "Apply Filters"}
            </button>
            <button
              onClick={() => handleIntentPageChange(-1)}
              disabled={!hasPrevIntentPage || intentsLoading}
              className="px-3 py-2 rounded-md border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Prev
            </button>
            <button
              onClick={() => handleIntentPageChange(1)}
              disabled={!hasNextIntentPage || intentsLoading}
              className="px-3 py-2 rounded-md border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            From
            <input
              type="date"
              name="from"
              value={intentFilters.from}
              onChange={handleIntentFilterChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            To
            <input
              type="date"
              name="to"
              value={intentFilters.to}
              onChange={handleIntentFilterChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Status
            <select
              name="status"
              value={intentFilters.status}
              onChange={handleIntentFilterChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            >
              {PAYMENT_INTENT_STATUSES.map((statusOption) => (
                <option key={statusOption} value={statusOption}>
                  {statusOption === "ALL" ? "All statuses" : statusOption}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Page size
            <input
              type="number"
              min="1"
              max="50"
              name="size"
              value={intentFilters.size}
              onChange={handleIntentFilterChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </label>
          <div className="text-xs text-slate-500 flex items-end">
            Page {currentIntentPage + 1}
            {totalIntentPages !== null && ` / ${totalIntentPages}`}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Intent ID
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Destination
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Amount
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Status
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Updated
                </th>
                <th className="px-4 py-3 text-left font-semibold text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paymentIntents.map((record) => {
                const recordStatus =
                  record.payments?.[0]?.status || record.status || "PENDING";
                return (
                  <tr key={record.payment_intent_id}>
                    <td className="px-4 py-3 font-mono text-xs text-slate-700">
                      {record.payment_intent_id}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {record.payment_destination?.display_name ||
                        record.payment_destination?.name ||
                        "—"}
                    </td>
                    <td className="px-4 py-3 text-slate-900 font-semibold">
                      {formatCurrency(record.amount, record.currency)}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold text-indigo-700">
                      {recordStatus}
                    </td>
                    <td className="px-4 py-3 text-slate-500">
                      {formatDateTime(record.updated_at)}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleSelectIntent(record)}
                        className="text-indigo-600 text-sm font-semibold hover:underline"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                );
              })}
              {!paymentIntents.length && (
                <tr>
                  <td
                    colSpan="6"
                    className="px-4 py-6 text-center text-slate-500"
                  >
                    {intentsLoading
                      ? "Loading payment intents..."
                      : "No payment intents found for the selected filters."}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Payment Intent Detail
                </h3>
                <p className="text-sm text-slate-500">
                  Enter an intent ID to inspect its status and payments.
                </p>
              </div>
              <button
                onClick={() => fetchIntentDetails()}
                disabled={!intentDetailsId || intentDetailsLoading}
                className="px-4 py-2 rounded-md border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                {intentDetailsLoading ? "Loading..." : "Fetch"}
              </button>
            </div>
            <input
              type="text"
              value={intentDetailsId}
              onChange={(e) => setIntentDetailsId(e.target.value)}
              placeholder="e.g. b4006368-3388-46d5-b7d4-9210313c4d45"
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {intentDetails ? (
            <div className="space-y-4 text-sm text-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Intent ID
                  </div>
                  <div className="font-mono text-xs">
                    {intentDetails.payment_intent_id}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Amount
                  </div>
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(intentDetails.amount, intentDetails.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Created
                  </div>
                  <div>{formatDateTime(intentDetails.created_at)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Updated
                  </div>
                  <div>{formatDateTime(intentDetails.updated_at)}</div>
                </div>
              </div>
              <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                <div className="text-xs uppercase text-slate-500 mb-1">
                  Destination
                </div>
                <div className="text-sm text-slate-900 font-semibold">
                  {intentDetails.payment_destination?.display_name ||
                    intentDetails.payment_destination?.name ||
                    "—"}
                </div>
                <div className="text-xs text-slate-500">
                  {intentDetails.payment_destination?.iban} ·{" "}
                  {intentDetails.payment_destination?.bank_identifier}
                </div>
              </div>
              {intentDetails.payments?.length > 0 && (
                <div>
                  <div className="text-xs uppercase text-slate-500 mb-2">
                    Payments ({intentDetails.payments.length})
                  </div>
                  <div className="space-y-2">
                    {intentDetails.payments.map((payment) => (
                      <div
                        key={payment.id}
                        className="border border-slate-200 rounded-lg p-3 bg-white"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-sm font-semibold text-slate-900">
                              {formatCurrency(payment.amount, payment.currency)}
                            </div>
                            <div className="text-xs text-slate-500">
                              {payment.status}
                            </div>
                          </div>
                          <button
                            onClick={() => handleSelectPayment(payment)}
                            className="text-indigo-600 text-sm font-semibold hover:underline"
                          >
                            View payment
                          </button>
                        </div>
                        <div className="text-xs text-slate-500 mt-1">
                          Source: {payment.payment_source_id || "—"}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              No intent selected. Choose one from the table above or paste an ID.
            </p>
          )}
        </div>

        <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6 space-y-4">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Payment Detail
                </h3>
                <p className="text-sm text-slate-500">
                  Inspect a specific Lean payment and its sender/recipient data.
                </p>
              </div>
              <button
                onClick={() => fetchPaymentDetails()}
                disabled={!paymentDetailsId || paymentDetailsLoading}
                className="px-4 py-2 rounded-md border border-slate-200 text-sm font-semibold hover:bg-slate-50 disabled:opacity-50"
              >
                {paymentDetailsLoading ? "Loading..." : "Fetch"}
              </button>
            </div>
            <input
              type="text"
              value={paymentDetailsId}
              onChange={(e) => setPaymentDetailsId(e.target.value)}
              placeholder="e.g. 0700ff7f-199f-4a0a-bc77-31c29d5eb806"
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          {paymentDetails ? (
            <div className="space-y-4 text-sm text-slate-600">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Payment ID
                  </div>
                  <div className="font-mono text-xs">{paymentDetails.id}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Intent
                  </div>
                  <div className="font-mono text-xs">
                    {paymentDetails.payment_intent_id}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Amount</div>
                  <div className="font-semibold text-slate-900">
                    {formatCurrency(paymentDetails.amount, paymentDetails.currency)}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">Status</div>
                  <div className="font-semibold text-indigo-700">
                    {paymentDetails.status}
                  </div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Submitted
                  </div>
                  <div>{formatDateTime(paymentDetails.submission_timestamp)}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-slate-500">
                    Updated
                  </div>
                  <div>{formatDateTime(paymentDetails.updated_at)}</div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="text-xs uppercase text-slate-500 mb-1">
                    Sender
                  </div>
                  <div className="font-semibold text-slate-900">
                    {paymentDetails.sender_details?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {paymentDetails.sender_details?.iban} ·{" "}
                    {paymentDetails.sender_details?.bank_identifier}
                  </div>
                </div>
                <div className="border border-slate-200 rounded-lg p-3 bg-slate-50">
                  <div className="text-xs uppercase text-slate-500 mb-1">
                    Recipient
                  </div>
                  <div className="font-semibold text-slate-900">
                    {paymentDetails.recipient_details?.name}
                  </div>
                  <div className="text-xs text-slate-500">
                    {paymentDetails.recipient_details?.iban}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-sm text-slate-500">
              Select a payment from the list above or paste a payment ID to
              inspect it here.
            </p>
          )}
        </div>
      </section>
    </div>
  );
};

export default Payments;
