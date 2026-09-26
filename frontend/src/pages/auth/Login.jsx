import { Link } from "react-router-dom";
import { useState } from "react";

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
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    lock: <><rect x="5" y="10" width="14" height="10" rx="2" /><path d="M8 10V7a4 4 0 0 1 8 0v3" /></>,
    eye: <><path d="M2.5 12s3.3-5 9.5-5 9.5 5 9.5 5-3.3 5-9.5 5-9.5-5-9.5-5Z" /><circle cx="12" cy="12" r="2.2" /></>,
    leaf: <><path d="M20 4C11 4 5 8 5 14c0 3.3 2.4 6 6 6 6 0 9-7 9-16Z" /><path d="M4 20c3.5-4.2 7.1-7.1 11-9" /></>,
    shield: <><path d="M12 3 20 6v5c0 5-3.3 8.5-8 10-4.7-1.5-8-5-8-10V6l8-3Z" /><path d="m8.5 12 2.3 2.3 4.8-5" /></>,
    flower: <><circle cx="12" cy="12" r="2.5" /><path d="M12 9c-3-6-8-4-6 0 1 2 3 3 6 3M15 12c6-3 4-8 0-6-2 1-3 3-3 6M12 15c3 6 8 4 6 0-1-2-3-3-6-3M9 12c-6 3-4 8 0 6 2-1 3-3 3-6" /></>,
    truck: <><path d="M3 6h11v10H3zM14 10h4l3 3v3h-7z" /><circle cx="7" cy="18" r="2" /><circle cx="18" cy="18" r="2" /></>,
    arrow: <><path d="M5 12h14" /><path d="m13 6 6 6-6 6" /></>,
  };

  return <svg {...common}>{paths[type]}</svg>;
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="signup-page auth-split-page">
      <section className="signup-shell">
        <div className="signup-story">
          <div className="story-image" aria-hidden="true" />
          <div className="story-overlay" />

          <div className="story-content">
            <p className="story-eyebrow">Welcome back</p>
            <h1>Keep the Art<br />Close to Home</h1>
            <p className="story-description">
              Return to your Alfiya Mehendi account to shop natural mehendi
              supplies or manage your professional mehendi bookings.
            </p>

            <div className="story-features">
              <div className="story-feature"><Icon type="leaf" /><span>Natural<br />Quality</span></div>
              <div className="story-feature"><Icon type="shield" /><span>Trusted<br />Products</span></div>
              <div className="story-feature"><Icon type="flower" /><span>Professional<br />Services</span></div>
              <div className="story-feature"><Icon type="truck" /><span>Safe & Fast<br />Delivery</span></div>
            </div>
          </div>
        </div>

        <div className="signup-form-panel login-form-panel">
          <div className="floral-line-art floral-top" aria-hidden="true">
            <span>❧</span><span>⌁</span><span>❧</span>
          </div>

          <div className="signup-form-inner login-form-inner">
            <p className="form-eyebrow">Welcome back</p>
            <h2>Login</h2>
            <p className="form-intro">
              Sign in to continue shopping and managing your mehendi services.
            </p>

            <form className="signup-form login-form">
              <label className="input-group">
                <span>Email Address or Phone</span>
                <div className="input-shell">
                  <Icon type="mail" />
                  <input type="text" placeholder="Enter your email or phone" autoComplete="username" />
                </div>
              </label>

              <label className="input-group">
                <span>Password</span>
                <div className="input-shell">
                  <Icon type="lock" />
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                  />
                  <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)}>
                    <Icon type="eye" />
                  </button>
                </div>
              </label>

              <div className="login-options">
                <label className="remember-row">
                  <input type="checkbox" />
                  <span>Remember me</span>
                </label>
                <a href="#forgot">Forgot password?</a>
              </div>

              <button type="submit" className="signup-submit">
                <span>Login</span>
                <Icon type="arrow" />
              </button>
            </form>

            <div className="auth-divider"><span>OR</span></div>

            <div className="social-actions">
              <button type="button" className="social-button">
                <span className="google-mark">G</span>
                Continue with Google
              </button>
              <button type="button" className="social-button">
                <span>☎</span>
                Continue with Phone
              </button>
            </div>

            <p className="login-prompt">
              Don't have an account? <Link to="/signup">Sign Up</Link>
            </p>
          </div>

          <div className="floral-line-art floral-bottom" aria-hidden="true">
            <span>❧</span><span>⌁</span><span>❧</span>
          </div>
        </div>
      </section>
    </main>
  );
}
