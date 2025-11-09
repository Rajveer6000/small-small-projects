import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";
import { API_BASE, APP_TOKEN, SANDBOX } from "../utils/leanConfig";

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
        access_token: tokens?.leanAccessToken || ACCESS_TOKEN,
        app_token: APP_TOKEN,
        payment_intent_id: intent.payment_intent_id,
        show_balances: false,
        sandbox: true,
        destination_avatar: "",
        destination_alias: "",
      });
      setInfo("Lean Pay opened. Approve the transfer in the modal.");
    } catch (err) {
      setError(err.message || "Failed to start Lean Pay");
    }
  };

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
              className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700"
            >
              Start Connect
            </button>
            <button
              onClick={checkPaymentSources}
              className="px-4 py-2 rounded-md border border-slate-200 text-sm font-semibold hover:bg-slate-50"
            >
              Check Sources
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
    </div>
  );
};

export default Payments;
