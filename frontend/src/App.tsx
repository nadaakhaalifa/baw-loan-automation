import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ManagerPage from "./pages/ManagerPage";
import FinancePage from "./pages/FinancePage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/login" />} />

        <Route path="/login" element={<LoginPage />} />

        <Route path="/dashboard" element={<DashboardPage />} />

        <Route path="/manager" element={<ManagerPage />} />

        <Route path="/finance" element={<FinancePage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;