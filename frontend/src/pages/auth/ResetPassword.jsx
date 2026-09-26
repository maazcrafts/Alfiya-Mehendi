import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useState } from "react";

export default function ResetPassword() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get("token") || "";
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    if (password.length < 8) {
      setMessage("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(apiBase + "/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Reset link is invalid or expired.");
      setMessage(data.message);
      setTimeout(() => navigate("/login"), 1000);
    } catch (error) {
      setMessage(error.message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="signup-page auth-split-page">
      <section className="signup-shell">
        <div className="signup-story">
          <div className="story-image" aria-hidden="true" />
          <div className="story-overlay" />
          <div className="story-content">
            <p className="story-eyebrow">Secure recovery</p>
            <h1>Create a<br />New Password</h1>
            <p className="story-description">Choose a new password for your Alfiya Mehendi account.</p>
          </div>
        </div>
        <div className="signup-form-panel login-form-panel">
          <div className="signup-form-inner login-form-inner">
            <p className="form-eyebrow">New password</p>
            <h2>Set Password</h2>
            <p className="form-intro">Your reset link is valid for 30 minutes.</p>
            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="input-group"><span>New Password</span><div className="input-shell"><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" required /></div></label>
              <label className="input-group"><span>Confirm Password</span><div className="input-shell"><input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} autoComplete="new-password" required /></div></label>
              <button type="submit" className="signup-submit" disabled={loading || !token}><span>{loading ? "Saving..." : "Save New Password"}</span></button>
            </form>
            {message && <p className="auth-form-error" role="status">{message}</p>}
            <p className="login-prompt"><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
