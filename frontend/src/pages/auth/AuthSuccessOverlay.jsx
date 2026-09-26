import { useEffect, useState } from "react";

export default function AuthSuccessOverlay({ mode = "login", onDone }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      onDone?.();
    }, 1900);
    return () => window.clearTimeout(timer);
  }, [onDone]);

  if (!visible) return null;

  const title = mode === "signup" ? "Welcome to Alfiya" : "Welcome back";
  const subtitle = mode === "signup"
    ? "Your account has been created securely."
    : "You’re securely signed in.";

  return (
    <div className="auth-success-overlay" role="status" aria-live="polite">
      <div className="success-orbit success-orbit-one" />
      <div className="success-orbit success-orbit-two" />
      <div className="auth-success-card">
        <div className="success-flower">✦</div>
        <div className="success-check">
          <svg viewBox="0 0 52 52" aria-hidden="true">
            <circle cx="26" cy="26" r="24" />
            <path d="m15 27 7 7 15-17" />
          </svg>
        </div>
        <p className="success-kicker">Alfiya Mehendi</p>
        <h2>{title}</h2>
        <p>{subtitle}</p>
        <div className="success-progress"><span /></div>
      </div>
    </div>
  );
}
