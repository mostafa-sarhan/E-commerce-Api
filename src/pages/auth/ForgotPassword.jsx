import { useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  forgotPassword,
  verifyResetCode,
  resetPassword,
} from "../../services/api/authApi";

import "./Auth.css";

export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const nav = useNavigate();

  async function send(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await forgotPassword(email);

      setStep(2);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function verify(e) {
    e.preventDefault();
    setLoading(true);

    try {
      await verifyResetCode(code);

      setStep(3);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function change(e) {
    e.preventDefault();

    if (password !== confirm) {
      return alert(
        "Passwords do not match."
      );
    }

    setLoading(true);

    try {
      await resetPassword({
        email,
        newPassword: password,
      });

      alert(
        "Password changed successfully. Please login."
      );

      nav("/login");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <p>ACCOUNT RECOVERY</p>

          <h1>Forgot Password</h1>

          <span>
            {step === 1
              ? "Enter your email to receive a verification code."
              : step === 2
                ? "Enter the code we sent to your email."
                : "Create your new password."}
          </span>
        </div>

        {step === 1 && (
          <form onSubmit={send}>
            <label>Email</label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              required
            />

            <button disabled={loading}>
              {loading
                ? "Sending..."
                : "Send Verification Code"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={verify}>
            <label>
              Verification Code
            </label>

            <input
              inputMode="numeric"
              value={code}
              onChange={(e) =>
                setCode(e.target.value)
              }
              placeholder="6-digit code"
              required
            />

            <button disabled={loading}>
              {loading
                ? "Checking..."
                : "Verify Code"}
            </button>

            <button
              type="button"
              className="forgot-button"
              onClick={() => setStep(1)}
            >
              Use another email
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={change}>
            <label>New Password</label>

            <input
              type="password"
              value={password}
              onChange={(e) =>
                setPassword(e.target.value)
              }
              minLength="6"
              required
            />

            <label>
              Confirm New Password
            </label>

            <input
              type="password"
              value={confirm}
              onChange={(e) =>
                setConfirm(e.target.value)
              }
              minLength="6"
              required
            />

            <button disabled={loading}>
              {loading
                ? "Saving..."
                : "Change Password"}
            </button>
          </form>
        )}

        <p className="auth-footer">
          <Link to="/login">
            Back to Login
          </Link>
        </p>
      </div>
    </main>
  );
}