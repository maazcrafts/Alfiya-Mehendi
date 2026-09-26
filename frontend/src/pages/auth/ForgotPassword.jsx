import { Link } from "react-router-dom";
import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [resetLink, setResetLink] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");
    setResetLink("");
    setLoading(true);
    try {
      const apiBase = import.meta.env.VITE_API_URL || "http://localhost:5000";
      const response = await fetch(apiBase + "/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to process the request.");
      setMessage(data.message);
      if (data.resetUrl) setResetLink(data.resetUrl);
    } catch (error) {
      setMessage(error.message || "Unable to process the request.");
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
            <p className="story-eyebrow">Account recovery</p>
            <h1>Return to Your<br />Alfiya Account</h1>
            <p className="story-description">
              Request a secure password reset link for your account.
            </p>
          </div>
        </div>
        <div className="signup-form-panel login-form-panel">
          <div className="signup-form-inner login-form-inner">
            <p className="form-eyebrow">Forgot password</p>
            <h2>Reset Password</h2>
            <p className="form-intro">Enter your account email and we'll generate a secure reset link.</p>
            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="input-group">
                <span>Email Address</span>
                <div className="input-shell">
                  <input type="email" placeholder="Enter your email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
              </label>
              <button type="submit" className="signup-submit" disabled={loading}>
                <span>{loading ? "Generating..." : "Generate Reset Link"}</span>
              </button>
            </form>
            {message && <p className="auth-form-error" role="status">{message}</p>}
            {resetLink && (
              <p className="login-prompt">
                <a href={resetLink}>Open secure reset page</a>
              </p>
            )}
            <p className="login-prompt"><Link to="/login">Back to Login</Link></p>
          </div>
        </div>
      </section>
    </main>
  );
}
