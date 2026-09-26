export default function PasswordStrength({ password }) {
  if (!password) return null;

  const checks = [
    password.length >= 8,
    /[A-Z]/.test(password),
    /[0-9]/.test(password),
    /[^A-Za-z0-9]/.test(password),
  ];
  const score = checks.filter(Boolean).length;
  const label = score <= 1 ? "Weak" : score === 2 ? "Fair" : score === 3 ? "Good" : "Strong";

  return (
    <div className="password-feedback" aria-live="polite">
      <div className="password-feedback-top">
        <span>Password strength</span>
        <strong className={score >= 3 ? "is-good" : ""}>{label}</strong>
      </div>
      <div className="password-strength-bars" aria-hidden="true">
        {[0, 1, 2, 3].map((bar) => (
          <span key={bar} className={bar < score ? "filled" : ""} />
        ))}
      </div>
      <div className="password-vault-note">
        <span className="vault-pulse" />
        Password is handled securely and never shown here in plain text.
      </div>
    </div>
  );
}
