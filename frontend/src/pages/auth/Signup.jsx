export default function Signup() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">Alfiya Mehendi</a>
        <div>
          <p className="eyebrow">Create account</p>
          <h1>Join Alfiya Mehendi</h1>
          <p className="auth-muted">Create an account to shop supplies and book mehendi services.</p>
        </div>
        <form className="auth-form">
          <label>Full name<input type="text" autoComplete="name" /></label>
          <label>Email<input type="email" autoComplete="email" /></label>
          <label>Phone<input type="tel" autoComplete="tel" /></label>
          <div className="auth-grid">
            <label>Password<input type="password" autoComplete="new-password" /></label>
            <label>Confirm password<input type="password" autoComplete="new-password" /></label>
          </div>
          <label className="check"><input type="checkbox" /> I agree to the terms and privacy policy</label>
          <button type="button">Create account</button>
        </form>
        <p className="auth-switch">Already have an account? <a href="/login">Sign in</a></p>
        <a className="auth-back" href="/">← Back to home</a>
      </section>
    </main>
  )
}
