import { useEffect, useState } from "react";
const APP_TOKEN = "df1c6e35-87ac-42b6-9746-d0f000ec25b5";
const ACCESS_TOKEN = "eyJraWQiOiJkNDQyYWI0ZS04MzRhLTRlMDEtODE3NS1hNjU1NTY0YmQ5ZTEiLCJhbGciOiJSUzI1NiJ9.eyJzdWIiOiJkZjFjNmUzNS04N2FjLTQyYjYtOTc0Ni1kMGYwMDBlYzI1YjUiLCJhdWQiOiJodHRwczovL2xpbmsuc2FuZGJveC5sZWFudGVjaC5tZSIsIm5iZiI6MTc2MjE1MDU1NSwic2NvcGUiOlsiY3VzdG9tZXIucmVhZCIsImJlbmVmaWNpYXJ5LndyaXRlIiwicGF5bWVudC53cml0ZSIsInBheW1lbnQucmVhZCIsImRlc3RpbmF0aW9uLnJlYWQiLCJjb25uZWN0LndyaXRlIiwiY29ubmVjdC5yZWFkIiwiYXBwbGljYXRpb24ucmVhZCIsImJhbmsucmVhZCIsImtleS5yZWFkIl0sImlzcyI6Imh0dHBzOi8vYXV0aC5zYW5kYm94LmxlYW50ZWNoLm1lIiwiY3VzdG9tZXJzIjpbeyJpZCI6IjU5MjM4ZTI4LTlmM2YtNGE4NS1hNTJkLTQxYjYwMzhhNDc4NSJ9XSwiZXhwIjoxNzYyMTU0MTU1LCJpYXQiOjE3NjIxNTA1NTUsImp0aSI6Ijg4MGYwYTFlLTE5OTQtNGE4YS05NjRlLTdkZTE4ZmEwYjY2NCIsImFwcGxpY2F0aW9ucyI6W3siaWQiOiJkZjFjNmUzNS04N2FjLTQyYjYtOTc0Ni1kMGYwMDBlYzI1YjUifV19.ko7o2cUPHEbGwZUyOeNNL0zrvIC8IymkiDpkaevgaKFp4fM99EFuOXfQK6ttuRo4yAV5J7p8IG0hUBnI_s5j_bnsOP6BFuq7oNaPNz9kynKT9IopHV1OsW874nlvoLpDbG91hBJk6hHxODHxreqIpOFS9r6WJepVvLjE0XI_gROacmwHYuK_ypDa8riuTDSCwBsLnqNkhKgn7a2iS7tEIurwlm900OLYTTIDu99udpDLLGs3VuRyJAPLCqnKOKEECF5xpzYaXcU3kuLiVbhDfEECSfz3sDfaPhDO3VJfrCVH8udGX0j0M_IRfObr72_BXzN7RCrG6s1DVM1hZV82-Q";

const API_BASE = "http://localhost:8080";

const SetupPage = () => {
  // Step inputs
  const [userId, setUserId] = useState("48");
  const [connectDestinationId, setConnectDestinationId] = useState(
    "6cd9db95-1d06-4b95-b8bd-a9a4e879ec35"
  );
  const [paymentDestinationId, setPaymentDestinationId] = useState(
    "6cd9db95-1d06-4b95-b8bd-a9a4e879ec35"
  );
  const [amount, setAmount] = useState("1000.50");
  const [currency, setCurrency] = useState("AED");
  const [description, setDescription] = useState("YOUR_TRANSACTION_REFERENCE");
  const [paymentSourceId, setPaymentSourceId] = useState("");

  // Connect tokens
  const [tokens, setTokens] = useState(null); // { leanUserId, leanAccessToken }

  // UI state
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (window.Lean) {
      console.log("Lean SDK loaded");
    } else {
      console.error("Lean SDK not loaded");
    }
  }, []);

  const fetchConnectTokens = async () => {
    setBusy(true);
    setMessage("Fetching Lean connect tokens...");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/connect?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
      const data = await res.json();
      setTokens(data);
      setMessage("Tokens received. Proceed to Connect (create payment source).");
    } catch (e) {
      setMessage(e.message || "Failed to fetch Lean tokens");
    } finally {
      setBusy(false);
    }
  };

  const connectPayments = async () => {
    try {
      if (!window.Lean || typeof window.Lean.connect !== "function") {
        throw new Error("Lean SDK not loaded or connect() unavailable");
      }
      if (!tokens?.leanUserId) {
        throw new Error("Missing leanUserId. Fetch tokens first.");
      }

      setMessage("Opening Lean Connect for payments...");

      window.Lean.connect({
        app_token: APP_TOKEN,
        permissions: ["payments"],
        customer_id: tokens.leanUserId,
        payment_destination_id: connectDestinationId || undefined, // optional
        sandbox: "true",
        // Include access_token to be safe with Lean Link requirements
        access_token: tokens?.leanAccessToken || ACCESS_TOKEN,
    
      });
    } catch (e) {
      setMessage(e.message || "Failed to start Lean Connect");
    }
  };

  const createPaymentIntent = async () => {
    const body = {
      amount: parseFloat(amount),
      currency,
      payment_destination_id: paymentDestinationId,
      user_id: Number(userId),
      description,
    };
    if (paymentSourceId?.trim()) {
      body.payment_source_id = paymentSourceId.trim();
    }

    const res = await fetch(`${API_BASE}/payment/create-payment-intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Create intent failed: ${res.status} ${text}`);
    }
    const data = await res.json();
    if (!data?.payment_intent_id) {
      throw new Error("No payment_intent_id returned from backend");
    }
    return data;
  };

  const createIntentAndPay = async () => {
    try {
      if (!window.Lean || typeof window.Lean.pay !== "function") {
        throw new Error("Lean SDK not loaded or pay() unavailable");
      }

      setBusy(true);
      setMessage("Creating payment intent...");

      const intent = await createPaymentIntent();
      setMessage(
        `Intent created. Launching Lean.pay for ${intent.currency} ${intent.amount}`
      );

      window.Lean.pay({
        // Prefer freshly issued token from connect call; fallback to constant
        access_token: tokens?.leanAccessToken || ACCESS_TOKEN,
        app_token: APP_TOKEN,
        payment_intent_id: intent.payment_intent_id,
        show_balances: false,
        sandbox: true,
        destination_avatar: "",
        destination_alias: "",
      
      });
    } catch (error) {
      console.error("Error starting Lean Pay:", error);
      setMessage(error.message || "Failed to start payment");
      setBusy(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="text-sm text-gray-700">
        {message ||
          "1) Get tokens 2) Connect 3) Enter source id 4) Intent & Pay"}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-600">User ID</span>
          <input
            className="border rounded px-3 py-2"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className={`px-4 py-2 rounded text-white ${
              busy ? "bg-gray-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700"
            }`}
            onClick={fetchConnectTokens}
            disabled={busy}
          >
            1) Get Lean Tokens
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-600">
            Connect Destination ID (optional)
          </span>
          <input
            className="border rounded px-3 py-2"
            value={connectDestinationId}
            onChange={(e) => setConnectDestinationId(e.target.value)}
          />
        </label>
        <div className="flex items-end gap-2">
          <button
            className="px-4 py-2 rounded text-white bg-indigo-600 hover:bg-indigo-700"
            onClick={connectPayments}
            disabled={!tokens}
          >
            2) Connect (create source)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-600">
            Payment Source ID (enter after connect)
          </span>
          <input
            className="border rounded px-3 py-2"
            value={paymentSourceId}
            onChange={(e) => setPaymentSourceId(e.target.value)}
            placeholder="e.g. 33744ae2-48ed-4224-b6c9-23d2d94a7ad2"
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-600">Payment Destination ID</span>
          <input
            className="border rounded px-3 py-2"
            value={paymentDestinationId}
            onChange={(e) => setPaymentDestinationId(e.target.value)}
          />
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-600">Amount</span>
          <input
            className="border rounded px-3 py-2"
            type="number"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-600">Currency</span>
          <input
            className="border rounded px-3 py-2"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          />
        </label>
        <label className="flex flex-col text-sm">
          <span className="mb-1 text-gray-600">Description</span>
          <input
            className="border rounded px-3 py-2"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </label>
      </div>

      <div>
        <button
          className={`px-4 py-2 rounded text-white ${
            busy ? "bg-gray-400 cursor-not-allowed" : "bg-green-600 hover:bg-green-700"
          }`}
          disabled={busy}
          onClick={createIntentAndPay}
        >
          3) Create Intent & Pay
        </button>
      </div>
    </div>
  );
};

export default SetupPage;

