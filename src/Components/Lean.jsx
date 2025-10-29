import React, { useState } from "react";

// Make sure Lean SDK is loaded in your public/index.html, for example:
// <script src="https://cdn.leantech.me/link/loader/prod/ae/latest/lean-link-loader.min.js"></script>

const APP_TOKEN = "df1c6e35-87ac-42b6-9746-d0f000ec25b5";
const PERMISSIONS = ["identity", "accounts", "transactions", "balance"];
const SANDBOX = true;
const API_BASE = "http://localhost:8080"; // Replace with your actual API base URL

const Lean = () => {
  const [userId, setUserId] = useState("");
  const [result, setResult] = useState("");
  const [registerData, setRegisterData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    dateOfBirth: "",
    gender: "",
    phone: "",
  });
  const [userRegistered, setUserRegistered] = useState(null);
  const [leanTokens, setLeanTokens] = useState(null);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [userDetails, setUserDetails] = useState(null);
  const [accounts, setAccounts] = useState(null);
  const [selectedAccountBalance, setSelectedAccountBalance] = useState(null);
  const [connected, setConnected] = useState(false);

  const connectWithLean = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/lean/connect?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error("Lean connect token fetch failed");
      const data = await res.json();
      setLeanTokens(data);
      setInfo("Lean tokens received. Initializing Lean connect...");
      
      if (window.Lean && typeof window.Lean.connect === "function") {
        window.Lean.connect({
          app_token: APP_TOKEN,
          permissions: PERMISSIONS,
          customer_id: data?.leanUserId,
          sandbox: SANDBOX,
          access_token: data?.leanAccessToken,
        });
        setConnected(true);
        setUserId(userRegistered.id);
      } else {
        setError("Lean SDK not loaded. Please include the Lean script.");
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setInfo('');
    setUserRegistered(null);
    setLeanTokens(null);
    setUserDetails(null);
    setAccounts(null);
    setSelectedAccountBalance(null);

    // Basic validation
    if (!registerData.email || !registerData.password || !registerData.firstName) {
      setError('Please fill all required fields (email, password, first name).');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(registerData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || 'Registration failed');
      }
      const data = await res.json();
      setUserRegistered(data);
      setInfo('User registered successfully. Fetching Lean tokens...');
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/lean/UserDetails?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('User details fetch failed');
      const data = await res.json();
      setUserDetails(data.payload);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchUserAccounts = async (userId) => {
    try {
      const res = await fetch(`${API_BASE}/api/lean/userAccounts?userId=${encodeURIComponent(userId)}`);
      if (!res.ok) throw new Error('User accounts fetch failed');
      const data = await res.json();
      setAccounts(data.payload.accounts);
    } catch (err) {
      setError(err.message);
    }
  };

  const fetchAccountBalance = async (accountId) => {
    setSelectedAccountBalance(null);
    setInfo('Fetching account balance...');
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/lean/accountBalances?userId=${encodeURIComponent(userRegistered.id)}&accountId=${encodeURIComponent(accountId)}`);
      if (!res.ok) throw new Error('Account balance fetch failed');
      const data = await res.json();
      setSelectedAccountBalance(data.payload);
      setInfo('Account balance loaded.');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      {!userRegistered && (
        <div>
          <h2 className="text-center text-2xl font-semibold text-gray-800 mb-6">
            Register User to Start
          </h2>
          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            <input
              type="email"
              name="email"
              placeholder="Email"
              required
              className="w-full px-3 py-2 border rounded"
              onChange={handleRegisterChange}
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              required
              className="w-full px-3 py-2 border rounded"
              onChange={handleRegisterChange}
            />
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              required
              className="w-full px-3 py-2 border rounded"
              onChange={handleRegisterChange}
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              className="w-full px-3 py-2 border rounded"
              onChange={handleRegisterChange}
            />
            <input
              type="date"
              name="dateOfBirth"
              className="w-full px-3 py-2 border rounded"
              onChange={handleRegisterChange}
            />
            <select
              name="gender"
              className="w-full px-3 py-2 border rounded"
              onChange={handleRegisterChange}
              defaultValue=""
            >
              <option value="" disabled>
                Select Gender
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
            <input
              type="tel"
              name="phone"
              placeholder="Phone"
              className="w-full px-3 py-2 border rounded"
              onChange={handleRegisterChange}
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 font-semibold"
            >
              Register & Connect Lean
            </button>
          </form>
        </div>
      )}
      {userRegistered && (
        <div className="mt-6 p-4 border rounded bg-green-50 text-green-800">
          User "{userRegistered.email}" registered successfully!
          <pre>{JSON.stringify(userRegistered, null, 2)}</pre>
          <button onClick={() => connectWithLean(userRegistered?.id)}>
            Connect Lean
          </button>
        </div>
      )}
      {connected && (
        <>
          <h2 className="text-center text-2xl font-semibold text-gray-800 mb-4">
            User Registered: {userRegistered.firstName}{" "}
            {userRegistered.lastName}
          </h2>
          <div className="text-center mb-4">
            <button
              onClick={() => {
                // Reset all to go back to register mode
                setUserRegistered(null);
                setLeanTokens(null);
                setUserDetails(null);
                setAccounts(null);
                setSelectedAccountBalance(null);
                setInfo("");
                setError("");
              }}
              className="text-sm text-red-600 underline"
            >
              Register Another User
            </button>
          </div>

          {info && <p className="text-center text-green-700 mb-4">{info}</p>}
          {error && (
            <p className="text-center text-red-700 mb-4 break-words">{error}</p>
          )}

          {leanTokens && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">
                Lean User ID & Access Token:
              </h3>
              <pre className="bg-gray-100 p-2 rounded text-xs break-all whitespace-pre-wrap">
                leanUserId: {leanTokens.leanUserId}
                <br />
                accessToken: {leanTokens.leanAccessToken}
              </pre>
            </div>
          )}

          {userDetails && (
            <div className="mb-6 border p-3 rounded bg-gray-50">
              <h3 className="font-semibold mb-2">User Details</h3>
              <p>
                <strong>Full Name:</strong> {userDetails.full_name}
              </p>
              <p>
                <strong>Email:</strong> {userDetails.email_address}
              </p>
              <p>
                <strong>Address:</strong> {userDetails.address}
              </p>
              <p>
                <strong>Gender:</strong> {userDetails.gender}
              </p>
              <p>
                <strong>Birth Date:</strong> {userDetails.birth_date}
              </p>
              <p>
                <strong>Mobile Number:</strong> {userDetails.mobile_number}
              </p>
              <p>
                <strong>National ID:</strong>{" "}
                {userDetails.national_identity_number}
              </p>
            </div>
          )}

          <button
            onClick={() => fetchUserDetails(userId)}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
          >
            Load User Details
          </button>
          <button
            onClick={() => fetchUserAccounts(userId)}
            className="mb-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
          >
            Load User Accounts
          </button>

          {accounts && (
            <div className="mb-6">
              <h3 className="font-semibold mb-2">Accounts</h3>
              <ul className="space-y-2 max-h-48 overflow-y-auto border p-3 rounded bg-gray-50">
                {accounts.map((acc) => (
                  <li
                    key={acc.account_id}
                    className="cursor-pointer rounded p-2 hover:bg-blue-100"
                    onClick={() => fetchAccountBalance(acc.account_id)}
                  >
                    <p className="font-semibold">
                      {acc.name} ({acc.type})
                    </p>
                    <p className="text-xs">IBAN: {acc.iban}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {selectedAccountBalance && (
            <div className="border p-3 rounded bg-gray-100 text-center max-w-sm mx-auto">
              <h3 className="font-semibold mb-2">Account Balance</h3>
              <p>
                <strong>{selectedAccountBalance.account_name}</strong> (
                {selectedAccountBalance.account_type})
              </p>
              <p className="text-lg font-bold">
                {selectedAccountBalance.balance}{" "}
                {selectedAccountBalance.currency_code}
              </p>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Lean;
