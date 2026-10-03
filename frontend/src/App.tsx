import { useState } from "react";
import "./App.css";

import Register from "./components/auth/register";
import Login from "./components/auth/login";
import ComplaintForm from "./components/ComplaintForm";
import AdminDashboard from "./components/admin/AdminDashboard";
import GovernmentDashboard from "./components/government/GovernmentDashboard";
import NotificationBell from "./components/notifications/NotificationBell";
import "./components/layout/CivicHeader.css";

function App() {
  const [authMode, setAuthMode] = useState<"register" | "login">("register");
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem("token")
  );
  const [userRole, setUserRole] = useState<string | null>(
    localStorage.getItem("role")
  );

  const handleLoginSuccess = (token: string, role: string) => {
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);

    setIsAuthenticated(true);
    setUserRole(role);
  };

  const handleRegisterSuccess = () => {
    setAuthMode("login");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");

    setIsAuthenticated(false);
    setUserRole(null);
    setAuthMode("login");
  };

  if (isAuthenticated) {
    return (
      <div className="app">
        <div className="app-header">
          <h1>CivicFix AI</h1>

          <div className="civicfix-header-actions">
            <span className="civicfix-role-pill">
              {userRole || "citizen"}
            </span>

            <NotificationBell />

            <button
              type="button"
              className="logout-btn civicfix-logout-btn"
              onClick={handleLogout}
            >
              Logout
            </button>
          </div>
        </div>

        {userRole === "admin" ? (
          <AdminDashboard />
        ) : userRole === "government" ? (
          <GovernmentDashboard />
        ) : (
          <ComplaintForm />
        )}
      </div>
    );
  }

  if (authMode === "register") {
    return (
      <Register
        onRegisterSuccess={handleRegisterSuccess}
        onLoginClick={() => setAuthMode("login")}
      />
    );
  }

  return (
    <Login
      onLoginSuccess={handleLoginSuccess}
      onRegisterClick={() => setAuthMode("register")}
    />
  );
}

export default App;
