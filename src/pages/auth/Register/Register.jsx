import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../../context/AuthContext";
import "../Auth.css";

function Register() {
  const { register, loading } = useAuth();
  const navigate = useNavigate();
  const [role, setRole] = useState("customer");
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    rePassword: "",
    phone: "",
  });

  function handleChange(e) {
    setForm((current) => ({
      ...current,
      [e.target.name]: e.target.value,
    }));
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (form.password !== form.rePassword) {
      return alert("Passwords do not match.");
    }

    try {
      await register(form, role);
      navigate(role === "seller" ? "/dashboard" : "/", { replace: true });
    } catch (error) {
      // apiRequest now includes validation errors returned by Route API,
      // so the actual reason for a 400 is visible instead of only "fail".
      alert(error.message);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p>JOIN ELECTROSTORE</p>
          <h1>Create Account</h1>
          <span>Choose the account type you want to create.</span>
        </div>

        <div className="role-picker two-roles">
          {[
            ["customer", "🛍️", "Customer"],
            ["seller", "🏪", "Seller"],
          ].map(([value, icon, label]) => (
            <button
              type="button"
              key={value}
              className={
                role === value ? "role-option active" : "role-option"
              }
              onClick={() => setRole(value)}
            >
              <span>{icon}</span>
              <strong>{label}</strong>
            </button>
          ))}
        </div>

        <div className="selected-role-banner">
          Creating a <strong>{role}</strong> account.
        </div>

        <form onSubmit={handleSubmit}>
          <label>Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder="Full name"
            required
            minLength={3}
          />

          <label>Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            required
          />

          <label>Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            required
            minLength={6}
          />

          <label>Confirm Password</label>
          <input
            name="rePassword"
            type="password"
            value={form.rePassword}
            onChange={handleChange}
            placeholder="Confirm password"
            required
            minLength={6}
          />

          <label>Phone</label>
          <input
            name="phone"
            value={form.phone}
            onChange={handleChange}
            placeholder="01XXXXXXXXX"
            required
            inputMode="tel"
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Creating..."
              : `Create ${role[0].toUpperCase() + role.slice(1)} Account`}
          </button>
        </form>

        <p className="auth-footer">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </main>
  );
}

export default Register;
