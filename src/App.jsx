import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import CustomerLayout from "./Components/CustomerLayout";
import { UserProvider } from "./context/UserContext";
import { UIProvider } from "./context/UIContext";
import UserRegistration from "./pages/UserRegistration";
import Accounts from "./pages/Accounts";
import Transactions from "./pages/Transactions";
import Income from "./pages/Income";
import Expenses from "./pages/Expenses";
import Payments from "./pages/Payments";
import Profile from "./pages/Profile";
import SetupPage from "./Components/SetupPage";

const App = () => (
  <UserProvider>
    <UIProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CustomerLayout />}>
            <Route index element={<Navigate to="/register" replace />} />
            <Route path="register" element={<UserRegistration />} />
            <Route path="profile" element={<Profile />} />
            <Route path="accounts" element={<Accounts />} />
            <Route path="transactions" element={<Transactions />} />
            <Route path="income" element={<Income />} />
            <Route path="expenses" element={<Expenses />} />
            <Route path="payments" element={<Payments />} />
            <Route path="a" element={<SetupPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/register" replace />} />
        </Routes>
      </BrowserRouter>
    </UIProvider>
  </UserProvider>
);

export default App;
