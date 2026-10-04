import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "../Auth.css";

function Login() {
  const { login, loading } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();

  const params = new URLSearchParams(location.search);

  const [role, setRole] = useState(
    params.get("role") === "admin"
      ? "admin"
      : "customer"
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  function chooseRole(value) {
    setRole(value);
    setEmail("");
    setPassword("");
  }

  async function handleSubmit(e) {
    e.preventDefault();

    try {
      const result = await login(email, password, role);

      const actualRole = result.user?.role || role;

      const fallback =
        actualRole === "admin" ? "/admin" : "/dashboard";

      navigate(
        location.state?.from || fallback,
        { replace: true }
      );
    } catch (error) {
      alert(error.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">

        <div className="auth-header">
          <p>WELCOME BACK</p>

          <h1>Login</h1>

          <span>
            Sign in to your account to
            complete your order.
          </span>
        </div>

        <div className="role-picker">
          {[
            ["customer", "🛍️", "Customer"],
            ["admin", "🛡️", "Admin"],
          ].map(([value, icon, label]) => (
            <button
              type="button"
              key={value}
              className={
                role === value
                  ? "role-option active"
                  : "role-option"
              }
              onClick={() => chooseRole(value)}
            >
              <span>{icon}</span>

              <strong>{label}</strong>
            </button>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          <label>Email</label>

          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
          />

          <label>Password</label>

          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Logging in..."
              : `Login as ${
                  role[0].toUpperCase() + role.slice(1)
                }`}
          </button>
        </form>

        {role !== "admin" && (
          <>
            <Link
              className="forgot-button"
              to="/forgot-password"
            >
              Forgot password?
            </Link>

            <p className="auth-footer">
              Don't have an account?{" "}
              <Link to="/register">
                Create Account
              </Link>
            </p>
          </>
        )}
        

      </div>
    </main>
  );
}

export default Login;