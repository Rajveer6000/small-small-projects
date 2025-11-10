import { useState } from "react";
import { useUserContext } from "../context/UserContext";
import { API_BASE, APP_TOKEN, PERMISSIONS, SANDBOX } from "../utils/leanConfig";

const initialForm = {
  email: "",
  password: "",
  firstName: "",
  lastName: "",
  dateOfBirth: "",
  gender: "",
  phone: "",
};

const UserRegistration = () => {
  const { userId, setUserId } = useUserContext();
  const [form, setForm] = useState(initialForm);
  const [status, setStatus] = useState({ tone: "info", message: "" });
  const [registeredUser, setRegisteredUser] = useState(null);
  const [loading, setLoading] = useState(false);

  const setInfo = (message) => setStatus({ tone: "info", message });
  const setError = (message) => setStatus({ tone: "error", message });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setStatus({ tone: "info", message: "Registering new user..." });
    try {
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || "Registration failed");
      }
      const data = await res.json();
      setRegisteredUser(data);
      setUserId(String(data.id));
      setInfo(`User registered! Assigned id ${data.id}.`);
    } catch (err) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!userId) {
      setError("Enter or register a user first.");
      return;
    }
    setLoading(true);
    setInfo("Fetching Lean connect tokens...");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/connect?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error("Failed to fetch connect tokens");
      const data = await res.json();
      if (window.Lean?.connect) {
        window.Lean.connect({
          app_token: APP_TOKEN,
          permissions: PERMISSIONS,
          customer_id: data.leanUserId,
          sandbox: SANDBOX,
          access_token: data.leanAccessToken,
        });
        setInfo("Lean Connect launched. Complete the flow in the modal.");
      } else {
        setError("Lean SDK not loaded on window.");
      }
    } catch (err) {
      setError(err.message || "Unable to start Lean Connect");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {status.message && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            status.tone === "error"
              ? "bg-rose-50 border-rose-200 text-rose-700"
              : "bg-blue-50 border-blue-200 text-blue-700"
          }`}
        >
          {status.message}
        </div>
      )}

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              User Regstoration
            </h3>
            <p className="text-sm text-slate-500">
              Capture customer details required before connecting with Lean.
            </p>
          </div>
          <button
            onClick={() => {
              setForm(initialForm);
              setRegisteredUser(null);
              setStatus({ tone: "info", message: "" });
            }}
            className="text-xs text-slate-500 hover:text-slate-700"
          >
            Reset form
          </button>
        </div>
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Email *
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              required
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Password *
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              required
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            First name *
            <input
              type="text"
              name="firstName"
              value={form.firstName}
              onChange={handleChange}
              required
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Last name
            <input
              type="text"
              name="lastName"
              value={form.lastName}
              onChange={handleChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Date of birth
            <input
              type="date"
              name="dateOfBirth"
              value={form.dateOfBirth}
              onChange={handleChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1">
            Gender
            <select
              name="gender"
              value={form.gender}
              onChange={handleChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select</option>
              <option value="MALE">Male</option>
              <option value="FEMALE">Female</option>
              <option value="OTHER">Other</option>
            </select>
          </label>
          <label className="text-sm font-medium text-slate-600 flex flex-col gap-1 md:col-span-2">
            Phone
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={handleChange}
              className="border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500"
            />
          </label>
          <div className="md:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 rounded-md bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 disabled:bg-slate-300"
            >
              {loading ? "Submitting..." : "Register User"}
            </button>
          </div>
        </form>
      </section>

      <section className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">
              Connect with Lean
            </h3>
            <p className="text-sm text-slate-500">
              Launch Lean Link to give the customer access to their accounts.
            </p>
          </div>
          <button
            onClick={handleConnect}
            disabled={loading}
            className="px-4 py-2 rounded-md bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 disabled:bg-slate-300"
          >
            Connect
          </button>
        </div>
        {registeredUser && (
          <div className="text-sm text-slate-600">
            Latest registered user:{" "}
            <span className="font-semibold text-slate-900">
              {registeredUser.firstName} {registeredUser.lastName} (id{" "}
              {registeredUser.id})
            </span>
          </div>
        )}
        {!userId && (
          <p className="text-sm text-rose-600 mt-2">
            User id is empty. Register or paste an id, then hit Set in the
            header to proceed.
          </p>
        )}
      </section>
    </div>
  );
};

export default UserRegistration;
