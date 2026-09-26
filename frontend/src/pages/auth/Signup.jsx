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
    user: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20c.7-3.3 3-5 7-5s6.3 1.7 7 5" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m3 7 9 6 9-6" /></>,
    phone: <><path d="M7 3.8 9.5 6 8 9c1.1 2.3 2.8 4.1 5 5.1l3-1.5 2.2 2.5-1.7 2.5c-.6.8-1.6 1.1-2.6.8C8.2 16.3 5 13.1 2.9 7.4c-.3-1 0-2 .8-2.6L7 3.8Z" /></>,
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

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
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

            <form className="signup-form">
              <label className="input-group">
                <span>Full Name</span>
                <div className="input-shell">
                  <Icon type="user" />
                  <input type="text" placeholder="Enter your full name" autoComplete="name" />
                </div>
              </label>

              <label className="input-group">
                <span>Email Address</span>
                <div className="input-shell">
                  <Icon type="mail" />
                  <input type="email" placeholder="Enter your email address" autoComplete="email" />
                </div>
              </label>

              <label className="input-group">
                <span>Phone Number</span>
                <div className="input-shell">
                  <Icon type="phone" />
                  <input type="tel" placeholder="Enter your phone number" autoComplete="tel" />
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
                  />
                  <button type="button" className="eye-button" onClick={() => setShowPassword(!showPassword)}>
                    <Icon type="eye" />
                  </button>
                </div>
              </label>

              <label className="input-group">
                <span>Confirm Password</span>
                <div className="input-shell">
                  <Icon type="lock" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    autoComplete="new-password"
                  />
                  <button type="button" className="eye-button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Icon type="eye" />
                  </button>
                </div>
              </label>

              <label className="terms-row">
                <input type="checkbox" />
                <span>
                  I agree to the <Link to="/terms">Terms & Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>
                </span>
              </label>

              <button type="submit" className="signup-submit">
                <span>Create Account</span>
                <Icon type="arrow" />
              </button>
            </form>

            <div className="auth-divider"><span>OR</span></div>

            <div className="social-actions">
              <button type="button" className="social-button">
                <span className="google-mark">G</span>
                Sign up with Google
              </button>
              <button type="button" className="social-button">
                <Icon type="phone" />
                Sign up with Phone
              </button>
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
  );
}
