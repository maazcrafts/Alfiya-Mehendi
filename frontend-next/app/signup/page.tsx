"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import GoogleButton from "../../components/auth/GoogleButton";
import { AuthLayout } from "../../components/AuthLayout";
import { FormField, Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function Signup() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    accepted: false,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  const updateField = (field: keyof typeof form) => (event: React.ChangeEvent) => {
    const value =
      field === "accepted"
        ? (event.target as HTMLInputElement).checked
        : (event.target as HTMLInputElement).value;
    setForm((current) => ({ ...current, [field]: value }));
  };

  const handleSubmit = async (event: React.FormEvent) => {
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
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password }),
      });
      const data = await response.json();
      if (!response.ok)
        throw new Error(data.message || "Unable to create your account.");

      sessionStorage.setItem("alfiya_auth_token", data.token);
      sessionStorage.setItem("alfiya_user", JSON.stringify(data.user));
      localStorage.setItem("alfiya_new_user_tour", "pending");
      localStorage.removeItem("alfiya_new_user_tour_step");
      setShowSuccess(true);
    } catch (err) {
      setError((err as Error).message || "Unable to create your account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="page">
      <AuthLayout>
        {showSuccess && (
          <div className="auth-success-message">
            <h2>Account created!</h2>
            <p>Welcome to Alfiya Mehendi. Your account is ready.</p>
            <Link href="/services" className="btn btn-primary btn-block">
              Explore services
            </Link>
          </div>
        )}
        {!showSuccess && (
          <>
            <div className="auth-header">
              <Link href="/" className="auth-logo">
                <span className="logo-mark">✦</span>
                <span className="logo-text">Alfiya<span className="logo-sub"> Mehendi</span></span>
              </Link>
              <p className="auth-eyebrow">Create account</p>
              <h1>Sign up</h1>
              <p className="auth-description">
                Create your account to start booking mehendi services.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="auth-form">
              <FormField label="Full name">
                <Input
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  value={form.name}
                  onChange={updateField("name")}
                  required
                />
              </FormField>

              <FormField label="Email address">
                <Input
                  type="email"
                  placeholder="Enter your email address"
                  autoComplete="email"
                  value={form.email}
                  onChange={updateField("email")}
                  required
                  autoCapitalize="none"
                />
              </FormField>

              <FormField label="Password">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  autoComplete="new-password"
                  value={form.password}
                  onChange={updateField("password")}
                  required
                />
              </FormField>

              <FormField label="Confirm password">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  autoComplete="new-password"
                  value={form.confirmPassword}
                  onChange={updateField("confirmPassword")}
                  required
                />
              </FormField>

              <FormField label="" className="terms-field">
                <label className="terms-label">
                  <input
                    type="checkbox"
                    checked={form.accepted}
                    onChange={updateField("accepted")}
                  />
                  <span>
                    I agree to the <Link href="/terms">Terms & Conditions</Link>{" "}
                    and <Link href="/privacy">Privacy Policy</Link>
                  </span>
                </label>
              </FormField>

              <Button type="submit" variant="primary" className="auth-submit" disabled={loading}>
                {loading ? "Creating…" : "Create account"}
              </Button>

              {error && <p className="auth-form-error" role="alert">{error}</p>}
            </form>

            <div className="auth-divider">
              <span>Or continue with</span>
            </div>

            <div className="auth-social">
              <GoogleButton mode="signup" />
            </div>

            <p className="auth-prompt">
              Already have an account?{" "}
              <Link href="/login" className="link-primary">
                Sign in
              </Link>
            </p>
          </>
        )}
      </AuthLayout>
    </main>
  );
}
