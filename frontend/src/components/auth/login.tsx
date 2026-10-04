import { useState } from "react";
import "./login.css";

interface LoginProps {
  onLoginSuccess: (token: string, role: string) => void;
  onRegisterClick: () => void;
}

function Login({
  onLoginSuccess,
  onRegisterClick
}: LoginProps) {

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");


  const handleLogin = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setError("");


    if (!email || !password) {
      setError("Please enter email and password.");
      return;
    }


    try {

      setLoading(true);

      const response = await fetch(
        "https://civicfix-backend-ce2z.onrender.com/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            email,
            password
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.message || "Login failed"
        );
      }


      // Save JWT token
      localStorage.setItem(
        "token",
        data.token
      );


      // Tell parent login successful
      onLoginSuccess(data.token, data.user.role);

    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("Something went wrong.");
      }

    } finally {

      setLoading(false);


    }
  };


  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Welcome Back</h1>

        <p className="auth-subtitle">
          Login to report and track civic issues
        </p>


        <form onSubmit={handleLogin}>

          <label htmlFor="email">
            Email
          </label>

          <input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />


          <label htmlFor="password">
            Password
          </label>

          <input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />


          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}


          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading
              ? "Logging in..."
              : "Login"
            }
          </button>

        </form>


        <p className="auth-switch">

          Don't have an account?

          <button
            type="button"
            onClick={onRegisterClick}
          >
            Register
          </button>

        </p>

      </div>

    </div>
  );
}

export default Login;