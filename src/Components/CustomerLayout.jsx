import { NavLink, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserContext } from "../context/UserContext";

const navItems = [
  { to: "/register", label: "User Regstoration" },
  { to: "/accounts", label: "Get Accounts" },
  { to: "/transactions", label: "Transactions" },
  { to: "/income", label: "Get Income" },
  { to: "/expenses", label: "Get Expense" },
  { to: "/payments", label: "Payments" },
  { to: "/profile", label: "Profile" }
];

const CustomerLayout = () => {
  const { userId, setUserId } = useUserContext();
  const [draftUserId, setDraftUserId] = useState(userId);

  useEffect(() => {
    setDraftUserId(userId);
  }, [userId]);

  const handleApplyUser = () => {
    setUserId(draftUserId?.trim() ?? "");
  };

  return (
    <div className="h-screen flex bg-slate-50 text-gray-900 overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col h-full">
        <div className="px-6 py-6 border-b border-slate-200">
          <h1 className="text-xl font-semibold text-blue-600">
            Customer Console
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage registrations, accounts, and payments.
          </p>
        </div>
        <nav className="flex-1 py-4 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `block px-6 py-3 text-sm font-medium transition-colors ${
                  isActive
                    ? "text-white bg-blue-600"
                    : "text-slate-600 hover:text-blue-600 hover:bg-blue-50"
                }`
              }
              end
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-6 py-4 border-t border-slate-200 text-xs text-slate-500">
          Powered by Lean Sandbox
        </div>
      </aside>
      <main className="flex-1 flex flex-col min-h-0">
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Active User Context
            </h2>
            <p className="text-sm text-slate-500">
              The selected user id is used across every flow below.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <input
              type="text"
              value={draftUserId}
              onChange={(e) => setDraftUserId(e.target.value)}
              placeholder="Enter user id"
              className="flex-1 border border-slate-300 rounded-md px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
            />
            <button
              onClick={handleApplyUser}
              className="px-4 py-2 text-sm font-semibold rounded-md bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-600"
            >
              Set
            </button>
          </div>
        </header>
        <div className="flex-1 p-6 overflow-y-auto min-h-0">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default CustomerLayout;
