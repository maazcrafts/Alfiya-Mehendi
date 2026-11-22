"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthLayout } from "../../components/AuthLayout";
import { FormField, Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) return;

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: normalizedEmail }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(data.message || "Unable to send a verification code.");
      router.push("/reset-password?email=" + encodeURIComponent(normalizedEmail));
    } catch (err) {
      setError((err as Error).message || "Unable to send a verification code.");
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
          <p className="auth-eyebrow">Account recovery</p>
          <h1>Reset access</h1>
          <p className="auth-description">
            Enter the email linked to your Alfiya Mehendi account.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <FormField label="Email address">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              autoComplete="email"
              required
              autoCapitalize="none"
            />
          </FormField>

          <Button type="submit" variant="primary" className="auth-submit" disabled={loading}>
            {loading ? "Sending code…" : "Send verification code"}
          </Button>

          {error && <p className="auth-form-error" role="alert">{error}</p>}
        </form>

        <p className="auth-prompt">
          Remember your password?{" "}
          <Link href="/login" className="link-primary">
            Back to sign in
          </Link>
        </p>
      </AuthLayout>
    </main>
  );
}
