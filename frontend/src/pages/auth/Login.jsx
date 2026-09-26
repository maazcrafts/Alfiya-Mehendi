export default function Login() {
  return (
    <main className="auth-page">
      <section className="auth-card">
        <a className="auth-brand" href="/">Alfiya Mehendi</a>
        <div>
          <p className="eyebrow">Welcome back</p>
          <h1>Sign in to your account</h1>
          <p className="auth-muted">Continue shopping supplies or manage your mehendi bookings.</p>
        </div>
        <form className="auth-form">
          <label>Email or phone<input type="text" autoComplete="username" /></label>
          <label>Password<input type="password" autoComplete="current-password" /></label>
          <div className="auth-row">
            <label className="check"><input type="checkbox" /> Remember me</label>
            <a href="#forgot">Forgot password?</a>
          </div>
          <button type="button">Sign in</button>
        </form>
        <p className="auth-switch">New here? <a href="/signup">Create an account</a></p>
        <a className="auth-back" href="/">← Back to home</a>
      </section>
    </main>
  )
}
