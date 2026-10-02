import { useState } from "react";
import "./App.css";

import Register from "./components/auth/register";
import Login from "./components/auth/login";
import ComplaintForm from "./components/ComplaintForm";
import AdminDashboard from "./components/admin/AdminDashboard";
import GovernmentDashboard from "./components/government/governmentDashboard"

function App() {
  const [authMode, setAuthMode] = useState<"register" | "login">(
    "register"
  );

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

          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
          >
            Logout
          </button>

        </div>

        {/* ADMIN */}

        {userRole === "admin" ? (
          <AdminDashboard />

        ) : userRole === "government" ? (

          /* GOVERNMENT */

          <GovernmentDashboard />

        ) : (

          /* CITIZEN */

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