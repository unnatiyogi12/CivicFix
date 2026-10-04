import { useState } from "react";
import "./register.css";

interface RegisterProps {
  onRegisterSuccess: () => void;
  onLoginClick: () => void;
}

function Register({
  onRegisterSuccess,
  onLoginClick
}: RegisterProps) {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");


  const handleRegister = async (
    e: React.FormEvent
  ) => {

    e.preventDefault();

    setError("");
    setSuccess("");


    if (!name || !email || !password) {
      setError("Please fill all fields.");
      return;
    }


    if (password.length < 6) {
      setError(
        "Password must be at least 6 characters."
      );
      return;
    }


    try {

      setLoading(true);


      const response = await fetch(
        "https://civicfix-backend-ce2z.onrender.com/api/auth/register",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json"
          },

          body: JSON.stringify({
            name,
            email,
            password
          })
        }
      );


      const data = await response.json();


      if (!response.ok) {
        throw new Error(
          data.message || "Registration failed"
        );
      }


      setSuccess(
        "Registration successful! Please login."
      );


      setName("");
      setEmail("");
      setPassword("");


      // Parent ko batao registration complete ho gaya
      setTimeout(() => {
        onRegisterSuccess();
      }, 1000);


    } catch (error) {

      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError(
          "Something went wrong. Please try again."
        );
      }

    } finally {

      setLoading(false);

    }
  };


  return (
    <div className="auth-page">

      <div className="auth-card">

        <h1>Create Account</h1>

        <p className="auth-subtitle">
          Join CivicFix and help improve your community
        </p>


        <form onSubmit={handleRegister}>

          {/* Name */}

          <label htmlFor="name">
            Full Name
          </label>

          <input
            id="name"
            type="text"
            placeholder="Enter your full name"
            value={name}
            onChange={(e) =>
              setName(e.target.value)
            }
          />


          {/* Email */}

          <label htmlFor="register-email">
            Email
          </label>

          <input
            id="register-email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
          />


          {/* Password */}

          <label htmlFor="register-password">
            Password
          </label>

          <input
            id="register-password"
            type="password"
            placeholder="Minimum 6 characters"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
          />


          {/* Error */}

          {error && (
            <p className="auth-error">
              {error}
            </p>
          )}


          {/* Success */}

          {success && (
            <p className="auth-success">
              {success}
            </p>
          )}


          {/* Submit */}

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
          >
            {loading
              ? "Creating Account..."
              : "Create Account"
            }
          </button>

        </form>


        {/* Login */}

        <p className="auth-switch">

          Already have an account?

          <button
            type="button"
            onClick={onLoginClick}
          >
            Login
          </button>

        </p>

      </div>

    </div>
  );
}

export default Register;