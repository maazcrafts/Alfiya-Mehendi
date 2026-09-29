import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import GoogleButton from "./GoogleButton.jsx";
import AuthSuccessOverlay from "./AuthSuccessOverlay.jsx";
import PasswordStrength from "./PasswordStrength.jsx";

const Icon = ({ type }) => {
  const common = {
    width: 23,
    height: 23,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6",
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
  };

  const paths = {
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.3 3-5 7-5s6.3 1.7 7 5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    leaf: <><path d="M20 4C11 4 5 8 5 14c0 3.3 2.4 6 6 6 6 0 9-7 9-16Z" /><path d="M4 20c3.5-4.2 7.1-7.1 11-9" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.3 2.3 4.8-5" /></>,
    flower: <><circle cx="12" cy="12" r="2.5" /><path d="M12 9c-3-6-8-4-6 0 1 2 3 3 6 3M15 12c6-3 4-8 0-6-2 1-3 3-3 6M12 15c3 6 8 4 6 0-1-2-3-3-6-3M9 12c-6 3-4 8 0 6 2-1 3-3 3-6" /></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    eye: <><path d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.2" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  };

  return <svg {...common}>{paths[type]}</svg>;
};

const getApiBase = () => {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return "http://localhost:5000";
  }

  return "https://alfiya-mehendi-api.onrender.com";
};

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", accepted: false });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const navigate = useNavigate();

  const updateField = (field) => (event) => {
    const value = field === "accepted" ? event.target.checked : event.target.value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    if (!form.accepted) {
      setError("Please accept the Terms & Conditions and Privacy Policy.");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);
    try {
      const apiBase = getApiBase();
      const response = await fetch(apiBase + "/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to create your account.");

      sessionStorage.setItem("alfiya_auth_token", data.token);
      sessionStorage.setItem("alfiya_user", JSON.stringify(data.user));
      localStorage.setItem("alfiya_new_user_tour", "pending");
      localStorage.removeItem("alfiya_new_user_tour_step");
      setShowSuccess(true);
    } catch (err) {
      setError(err.message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {showSuccess && <AuthSuccessOverlay mode="signup" onDone={() => navigate("/services")} />}
      <main className="signup-page">
      <section className="signup-shell">
        <div className="signup-story">
          <div className="story-image" aria-hidden="true" />
          <div className="story-overlay" />

          <div className="story-content">
            <p className="story-eyebrow">Join our community</p>
            <h1>Bring the Art<br />of Mehendi Home</h1>
            <p className="story-description">
              Shop premium mehendi powders, tools, oils and more — or book
              professional mehendi services for your special occasions.
            </p>

            <div className="story-features">
              <div className="story-feature">
                <Icon type="leaf" />
                <span>Premium<br />Quality</span>
              </div>
              <div className="story-feature">
                <Icon type="shield" />
                <span>Trusted<br />Products</span>
              </div>
              <div className="story-feature">
                <Icon type="flower" />
                <span>Professional<br />Services</span>
              </div>
              <div className="story-feature">
                <Icon type="truck" />
                <span>Safe & Fast<br />Delivery</span>
              </div>
            </div>
          </div>
        </div>

        <div className="signup-form-panel">
          <div className="floral-line-art floral-top" aria-hidden="true">
            <span>❧</span><span>⌁</span><span>❧</span>
          </div>

          <div className="signup-form-inner">
            <p className="form-eyebrow">Create account</p>
            <h2>Sign Up</h2>
            <p className="form-intro">
              Create your account to start shopping and booking mehendi services.
            </p>

            <form className="signup-form" onSubmit={handleSubmit}>
              <label className="input-group">
                <span>Full Name</span>
                <div className="input-shell">
                  <Icon type="user" />
                  <input type="text" placeholder="Enter your full name" autoComplete="name" value={form.name} onChange={updateField("name")} required />
                </div>
              </label>

              <label className="input-group">
                <span>Email Address</span>
                <div className="input-shell">
                  <Icon type="mail" />
                  <input type="email" placeholder="Enter your email address" autoComplete="email" value={form.email} onChange={updateField("email")} required />
                </div>
              </label>


              <label className="input-group">
                <span>Password</span>
                <div className="input-shell">
                  <Icon type="lock" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    autoComplete="new-password"
                    value={form.password}
                    onChange={updateField("password")}
                    required
                  />
                  <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)}>
                    <Icon type="eye" />
                  </button>
                </div>
                <PasswordStrength password={form.password} />
              </label>

              <label className="input-group">
                <span>Confirm Password</span>
                <div className="input-shell">
                  <Icon type="lock" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                    value={form.confirmPassword}
                    onChange={updateField("confirmPassword")}
                    required
                  />
                  <button type="button" className="eye-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon type="eye" />
                  </button>
                </div>
              </label>

              <label className="terms-row">
                <input type="checkbox" checked={form.accepted} onChange={updateField("accepted")} />
                <span>
                  I agree to the <Link to="/terms">Terms & Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>

              <button type="submit" className="signup-submit" disabled={loading}>
                <span>{loading ? "Creating..." : "Create Account"}</span>
                <Icon type="arrow" />
              </button>
            </form>
            {error && <p className="auth-form-error" role="alert">{error}</p>}

            <div className="auth-divider"><span>OR</span></div>

            <div className="social-actions">
              <GoogleButton mode="signup" />
            </div>

            <p className="login-prompt">
              Already have an account? <Link to="/login">Login</Link>
            </p>
          </div>

          <div className="floral-line-art floral-bottom" aria-hidden="true">
            <span>❧</span><span>⌁</span><span>❧</span>
          </div>
        </div>
      </section>
      </main>
    </>
  );
}
