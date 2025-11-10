import React, { useState, useEffect } from "react";

// Make sure Lean SDK is loaded in your public/index.html, for example:
// <script src="https://cdn.leantech.me/link/loader/prod/ae/latest/lean-link-loader.min.js"></script>

const APP_TOKEN = "df1c6e35-87ac-42b6-9746-d0f000ec25b5";
const PERMISSIONS = ["identity", "accounts", "transactions", "balance", "payments"];
const SANDBOX = true;
const API_BASE = "http://localhost:8080";

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
  const [loading, setLoading] = useState(false);
  
  // Transaction states
  const [transactions, setTransactions] = useState(null);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [dateRange, setDateRange] = useState({
    fromDate: "",
    toDate: ""
  });
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  const connectWithLean = async (userId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/connect?userId=${encodeURIComponent(userId)}`
      );
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
        setInfo("Successfully connected with Lean!");
      } else {
        setError("Lean SDK not loaded. Please include the Lean script.");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterChange = (e) => {
    setRegisterData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setInfo("");
    setUserRegistered(null);
    setLeanTokens(null);
    setUserDetails(null);
    setAccounts(null);
    setSelectedAccountBalance(null);
    setTransactions(null);
    setSelectedAccount(null);
    setLoading(true);

    if (
      !registerData.email ||
      !registerData.password ||
      !registerData.firstName
    ) {
      setError(
        "Please fill all required fields (email, password, first name)."
      );
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(registerData),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.message || "Registration failed");
      }
      const data = await res.json();
      setUserRegistered(data);
      setInfo("User registered successfully. You can now connect with Lean.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/UserDetails?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error("User details fetch failed");
      const data = await res.json();
      setUserDetails(data.payload);
      setInfo("User details loaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserAccounts = async (userId) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/userAccounts?userId=${encodeURIComponent(userId)}`
      );
      if (!res.ok) throw new Error("User accounts fetch failed");
      const data = await res.json();
      setAccounts(data.payload.accounts);
      setInfo("Accounts loaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountBalance = async (accountId) => {
    setSelectedAccountBalance(null);
    setInfo("Fetching account balance...");
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `${API_BASE}/api/lean/accountBalances?userId=${encodeURIComponent(
          userRegistered.id
        )}&accountId=${encodeURIComponent(accountId)}`
      );
      if (!res.ok) throw new Error("Account balance fetch failed");
      const data = await res.json();
      setSelectedAccountBalance(data.payload);
      setInfo("Account balance loaded successfully.");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchAccountTransactions = async (accountId, fromDate = null, toDate = null) => {
    setLoadingTransactions(true);
    setError("");
    try {
      let url = `${API_BASE}/api/lean/account-transactions?userId=${encodeURIComponent(
        userRegistered.id
      )}&accountId=${encodeURIComponent(accountId)}`;
      
      if (fromDate) url += `&fromDate=${encodeURIComponent(fromDate)}`;
      if (toDate) url += `&toDate=${encodeURIComponent(toDate)}`;
      
      const res = await fetch(url);
      if (!res.ok) throw new Error("Transactions fetch failed");
      const data = await res.json();
      setTransactions(data.payload.transactions);
      setInfo(`Loaded ${data.payload.transactions?.length || 0} transactions`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleDateRangeChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAccountSelect = (account) => {
    setSelectedAccount(account);
    setTransactions(null);
    setDateRange({ fromDate: "", toDate: "" });
  };

  const handleFetchTransactions = () => {
    if (selectedAccount) {
      fetchAccountTransactions(selectedAccount.account_id, dateRange.fromDate, dateRange.toDate);
    }
  };

  const formatCurrency = (amount, currency = "AED") => {
    return new Intl.NumberFormat('en-AE', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2
    }).format(amount);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getCategoryColor = (category) => {
    const colors = {
      'RETAIL': 'bg-purple-100 text-purple-800',
      'TRANSFER': 'bg-blue-100 text-blue-800',
      'GROCERIES': 'bg-green-100 text-green-800',
      'RESTAURANTS_DINING': 'bg-red-100 text-red-800',
      'ENTERTAINMENT': 'bg-pink-100 text-pink-800',
      'GOVERNMENT': 'bg-gray-100 text-gray-800',
      'RENT_AND_SERVICES': 'bg-yellow-100 text-yellow-800',
      'HEALTH_AND_WELLBEING': 'bg-indigo-100 text-indigo-800',
      'LOANS_AND_INVESTMENTS': 'bg-orange-100 text-orange-800',
      'SALARY_AND_REVENUE': 'bg-emerald-100 text-emerald-800',
      'BANK_FEES_AND_CHARGES': 'bg-rose-100 text-rose-800',
      'EDUCATION': 'bg-cyan-100 text-cyan-800',
      'TRANSPORT': 'bg-teal-100 text-teal-800',
      'TRAVEL': 'bg-amber-100 text-amber-800'
    };
    return colors[category] || 'bg-gray-100 text-gray-800';
  };

  const resetAll = () => {
    setUserRegistered(null);
    setLeanTokens(null);
    setUserDetails(null);
    setAccounts(null);
    setSelectedAccountBalance(null);
    setTransactions(null);
    setSelectedAccount(null);
    setInfo("");
    setError("");
    setConnected(false);
    setDateRange({ fromDate: "", toDate: "" });
    setRegisterData({
      email: "",
      password: "",
      firstName: "",
      lastName: "",
      dateOfBirth: "",
      gender: "",
      phone: "",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <pre>
          {/* {JSON.stringify(PERMISSIONS, null, 2)} */}
        </pre>
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
            Financial Data Integration
          </h1>
          <p className="text-gray-600">
            Connect your bank accounts securely using Lean API
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Registration Form */}
          {!userRegistered && (
            <div className="p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  Get Started
                </h2>
                <p className="text-gray-600">
                  Register your account to connect with financial institutions
                </p>
              </div>

              <form onSubmit={handleRegisterSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      name="email"
                      placeholder="Enter your email"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={handleRegisterChange}
                      value={registerData.email}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password *
                    </label>
                    <input
                      type="password"
                      name="password"
                      placeholder="Create a password"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={handleRegisterChange}
                      value={registerData.password}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name *
                    </label>
                    <input
                      type="text"
                      name="firstName"
                      placeholder="Enter your first name"
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={handleRegisterChange}
                      value={registerData.firstName}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      name="lastName"
                      placeholder="Enter your last name"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={handleRegisterChange}
                      value={registerData.lastName}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={handleRegisterChange}
                      value={registerData.dateOfBirth}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={handleRegisterChange}
                      value={registerData.gender}
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      placeholder="Enter phone number"
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                      onChange={handleRegisterChange}
                      value={registerData.phone}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-4 rounded-lg hover:from-blue-700 hover:to-indigo-700 font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    "Register & Connect Financial Data"
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Success & Connected Section */}
          {userRegistered && (
            <div className="p-6 md:p-8">
              {/* Success Banner */}
              <div className="mb-6 p-4 rounded-lg bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M5 13l4 4L19 7"
                        ></path>
                      </svg>
                    </div>
                  </div>
                  <div className="ml-3">
                    <h3 className="text-green-800 font-semibold">
                      Registration Successful!
                    </h3>
                    <p className="text-green-700 text-sm">
                      User "{userRegistered.email}" has been registered
                      successfully.
                    </p>
                  </div>
                </div>
              </div>

              {/* User Info Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 p-4 bg-gray-50 rounded-lg">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">
                    Welcome, {userRegistered.firstName}{" "}
                    {userRegistered.lastName}
                  </h2>
                  <p className="text-gray-600">
                    Ready to connect your financial data
                  </p>
                </div>
                <button
                  onClick={resetAll}
                  className="mt-2 md:mt-0 px-4 py-2 text-sm text-red-600 hover:text-red-800 font-medium transition-colors duration-200"
                >
                  Register Another User
                </button>
              </div>

              {/* Status Messages */}
              {info && (
                <div className="mb-4 p-3 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                  {info}
                </div>
              )}
              {error && (
                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                  {error}
                </div>
              )}

              {/* Connect Button */}
              {!connected && (
                <div className="text-center mb-6">
                  <button
                    onClick={() => connectWithLean(userRegistered?.id)}
                    disabled={loading}
                    className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-3 rounded-lg hover:from-green-600 hover:to-emerald-600 font-semibold text-lg transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="w-5 h-5 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                        Connecting...
                      </div>
                    ) : (
                      "Connect with Lean"
                    )}
                  </button>
                </div>
              )}

              {/* Connected Content */}
              {connected && (
                <div className="space-y-6">
                  {/* Action Buttons */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                      onClick={() => fetchUserDetails(userId)}
                      disabled={loading}
                      className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Load User Details
                    </button>
                    <button
                      onClick={() => fetchUserAccounts(userId)}
                      disabled={loading}
                      className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Load Accounts
                    </button>
                    <button
                      onClick={() => {
                        setTransactions(null);
                        setSelectedAccount(null);
                      }}
                      className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 font-semibold transition-all duration-200"
                    >
                      Clear Transactions
                    </button>
                  </div>

                  {/* User Details */}
                  {userDetails && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="font-semibold text-gray-800">
                          User Profile
                        </h3>
                      </div>
                      <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Full Name
                            </label>
                            <p className="font-medium">
                              {userDetails.full_name}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Email
                            </label>
                            <p className="font-medium">
                              {userDetails.email_address}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Address
                            </label>
                            <p className="font-medium">
                              {userDetails.address || "Not provided"}
                            </p>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Gender
                            </label>
                            <p className="font-medium">
                              {userDetails.gender || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Birth Date
                            </label>
                            <p className="font-medium">
                              {userDetails.birth_date || "Not provided"}
                            </p>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-gray-500 uppercase">
                              Mobile
                            </label>
                            <p className="font-medium">
                              {userDetails.mobile_number || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Accounts List */}
                  {accounts && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <h3 className="font-semibold text-gray-800">
                          Bank Accounts ({accounts.length})
                        </h3>
                      </div>
                      <div className="max-h-96 overflow-y-auto">
                        {accounts.map((acc, index) => (
                          <div
                            key={acc.account_id}
                            className={`p-4 border-b cursor-pointer transition-all duration-200 hover:bg-blue-50 ${
                              selectedAccount?.account_id === acc.account_id
                                ? "bg-blue-50 border-l-4 border-l-blue-500"
                                : ""
                            }`}
                            onClick={() => handleAccountSelect(acc)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                    {acc.name?.charAt(0) || "A"}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-800">
                                      {acc.name}
                                      <span className="ml-2 text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                                        {acc.type}
                                      </span>
                                    </h4>
                                    <p className="text-sm text-gray-600 font-mono">
                                      {acc.iban}
                                    </p>
                                  </div>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-blue-600 font-semibold">
                                  View Transactions
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Account Balance */}
                  {selectedAccountBalance && (
                    <div className="bg-gradient-to-br from-green-500 to-emerald-500 rounded-2xl p-6 text-white text-center max-w-md mx-auto transform hover:scale-[1.02] transition-all duration-200">
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold mb-1">
                          Current Balance
                        </h3>
                        <p className="text-green-100 text-sm">
                          {selectedAccountBalance.account_name} (
                          {selectedAccountBalance.account_type})
                        </p>
                      </div>
                      <div className="text-3xl font-bold mb-2">
                        {selectedAccountBalance.balance}{" "}
                        {selectedAccountBalance.currency_code}
                      </div>
                      <p className="text-green-100 text-sm">
                        Available Balance
                      </p>
                    </div>
                  )}

                  {/* Transactions Section */}
                  {selectedAccount && (
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                      <div className="bg-gray-50 px-4 py-3 border-b">
                        <div className="flex flex-row md:items-center justify-between gap-8 ">
                          <h3 className="font-semibold text-gray-800">
                            Transactions for {selectedAccount.name}
                          </h3>
                          <button
                            onClick={() => fetchAccountBalance(selectedAccount.account_id)}
                            className="mt-2 md:mt-0 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors duration-200"
                          >
                            Check Balance
                          </button>
                          <button
                            onClick={handleFetchTransactions}
                            disabled={loadingTransactions}
                            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700 font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {loadingTransactions ? (
                              <div className="flex items-center">
                                <div className="w-4 h-4 border-t-2 border-white border-solid rounded-full animate-spin mr-2"></div>
                                Loading...
                              </div>
                            ) : (
                              "Fetch Transactions"
                            )}
                          </button>
                        </div>
                      </div>
                      
                      {/* Date Range Filter */}
                         {/*<div className="p-4 bg-white border-b">
                        <div className="flex flex-col md:flex-row gap-4 items-end">
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                From Date
                              </label>
                              <input
                                type="date"
                                name="fromDate"
                                value={dateRange.fromDate}
                                onChange={handleDateRangeChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                To Date
                              </label>
                              <input
                                type="date"
                                name="toDate"
                                value={dateRange.toDate}
                                onChange={handleDateRangeChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                              />
                            </div> 
                          </div>
                          
                        </div>
                      </div>*/}

                      {/* Transactions Table */}
                      {transactions && (
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead className="bg-gray-50">
                              <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Description
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Category
                                </th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {transactions.map((transaction, index) => (
                                <tr 
                                  key={transaction.id} 
                                  className="hover:bg-gray-50 transition-colors duration-150"
                                >
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                    {formatDate(transaction.timestamp)}
                                  </td>
                                  <td className="px-4 py-3">
                                    <div className="text-sm font-medium text-gray-900">
                                      {transaction.insights?.description_cleansed || transaction.description}
                                    </div>
                                    <div className="text-xs text-gray-500 truncate max-w-xs">
                                      {transaction.description}
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(transaction.insights?.category)}`}>
                                      {transaction.insights?.category || 'Unknown'}
                                    </span>
                                    {transaction.insights?.category_confidence && (
                                      <div className="text-xs text-gray-500 mt-1">
                                        Confidence: {Math.round(transaction.insights.category_confidence * 100)}%
                                      </div>
                                    )}
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap text-sm text-right">
                                    <span className={`font-semibold ${
                                      transaction.amount >= 0 ? 'text-green-600' : 'text-red-600'
                                    }`}>
                                      {formatCurrency(transaction.amount, transaction.currency_code)}
                                    </span>
                                  </td>
                                  <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                      transaction.pending 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-green-100 text-green-800'
                                    }`}>
                                      {transaction.pending ? 'Pending' : 'Completed'}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                          
                          {transactions.length === 0 && (
                            <div className="text-center py-8 text-gray-500">
                              No transactions found for the selected date range.
                            </div>
                          )}
                        </div>
                      )}

                      {loadingTransactions && (
                        <div className="flex justify-center items-center py-8">
                          <div className="flex items-center space-x-2">
                            <div className="w-6 h-6 border-t-2 border-blue-500 border-solid rounded-full animate-spin"></div>
                            <span className="text-gray-600">Loading transactions...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-6 text-gray-500 text-sm">
          <p>Secured with Lean API • All data is encrypted and protected</p>
        </div>
      </div>
    </div>
  );
};

export default Lean;