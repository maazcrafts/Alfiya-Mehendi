"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleButton from "../../components/auth/GoogleButton";
import { AuthLayout } from "../../components/AuthLayout";
import { FormField, Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

const getApiBase = () => {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return "http://localhost:5000";
  }

  return "https://alfiya-mehendi-api.onrender.com";
};

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch(getApiBase() + "/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Unable to log in.");

      sessionStorage.setItem("alfiya_auth_token", data.token);
      sessionStorage.setItem("alfiya_user", JSON.stringify(data.user));
      const returnTo = sessionStorage.getItem("alfiya_return_to") || "/services";
      router.push(returnTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to log in.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <AuthLayout>
        <div className="auth-header">
          <Link href="/" className="auth-logo">
            <span className="logo-mark">✦</span>
            <span className="logo-text">Alfiya<span className="logo-sub"> Mehendi</span></span>
          </Link>
          <p className="auth-eyebrow">Welcome back</p>
          <h1>Sign in to your account</h1>
          <p className="auth-description">
            Sign in to continue shopping and managing your mehendi services.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <FormField label="Email address">
            <Input
              type="email"
              placeholder="Enter your email address"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoCapitalize="none"
            />
          </FormField>

          <FormField label="Password">
            <Input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </FormField>

          <div className="auth-login-options">
            <Link href="/forgot-password" className="link-soft">
              Forgot password?
            </Link>
          </div>

          <Button type="submit" variant="primary" className="auth-submit" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>

          {error && <p className="auth-form-error" role="alert">{error}</p>}
        </form>

        <div className="auth-divider">
          <span>Or continue with</span>
        </div>

        <div className="auth-social">
          <GoogleButton mode="signin" />
        </div>

        <p className="auth-prompt">
          Don’t have an account?{" "}
          <Link href="/auth/signup" className="link-primary">
            Sign up
          </Link>
        </p>
      </AuthLayout>
    </main>
  );
}
