"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const OTP_LENGTH = 6;
const DEFAULT_RESEND_COOLDOWN = 60;

function maskEmail(email: string) {
  const [name, domain] = String(email).split("@");
  if (!name || !domain) return email;
  const visible = name.length <= 2 ? name.slice(0, 1) : name.slice(0, 2);
  return visible + "•••@" + domain;
}

// Read email from query params using useSearchParams inside a useEffect
export default function ResetPassword() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  // Initialize email from search params on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailFromParams = params.get("email")?.trim().toLowerCase() || "";
    setEmail(emailFromParams);
    if (!emailFromParams) {
      router.push("/forgot-password");
    }
  }, [router]);

  const [step, setStep] = useState("otp");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown <= 0) return undefined;
    const timer = window.setInterval(
      () => setResendCooldown((v: number) => Math.max(0, v - 1)),
      1000
    );
    return () => window.clearInterval(timer);
  }, [resendCooldown]);

  async function pasteOtp() {
    setError("");
    setMessage("");

    if (!navigator.clipboard?.readText) {
      throw new Error("Clipboard access is not available on this device.");
    }

    const clipboardText = await navigator.clipboard.readText();
    const pastedOtp = clipboardText.replace(/\D/g, "").slice(0, OTP_LENGTH);

    if (pastedOtp.length !== OTP_LENGTH) {
      throw new Error("No complete 6-digit code was found in your clipboard.");
    }

    setOtp(pastedOtp);
    setMessage("Verification code pasted.");
  }

  async function verifyOtp(event: React.FormEvent) {
    event.preventDefault();
    const cleanOtp = otp.replace(/\D/g, "");
    if (cleanOtp.length !== OTP_LENGTH) {
      setError("Enter the complete 6-digit verification code.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp: cleanOtp }),
      });
      const data = (await response.json()) as {
        resetToken?: string;
        message?: string;
      };
      if (!response.ok)
        throw new Error(data.message || "Unable to verify the code.");

      if (data.resetToken) {
        setResetToken(data.resetToken);
        setStep("password");
      }
      setError("");
    } catch (err) {
      setError((err as Error).message || "Unable to verify the code.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (resendCooldown > 0 || loading) return;

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await response.json()) as {
        retryAfterSeconds?: number;
        resendCooldownSeconds?: number;
        message?: string;
      };
      if (!response.ok) {
        if (data.retryAfterSeconds)
          setResendCooldown(Number(data.retryAfterSeconds));
        throw new Error(data.message || "Unable to resend the code.");
      }

      setOtp("");
      setResendCooldown(Number(data.resendCooldownSeconds || DEFAULT_RESEND_COOLDOWN));
      setMessage(data.message || "A new verification code has been sent.");
    } catch (err) {
      setError((err as Error).message || "Unable to resend the code.");
    } finally {
      setLoading(false);
    }
  }

  async function savePassword(event: React.FormEvent) {
    event.preventDefault();

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (!resetToken) {
      setError("Your verification session is missing. Please start again.");
      return;
    }

    setLoading(true);
    setError("");
    setMessage("");

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken, password }),
      });
      const data = (await response.json()) as { message?: string };
      if (!response.ok)
        throw new Error(data.message || "Unable to reset your password.");

      setMessage(data.message || "Password updated successfully.");
      router.push("/login");
    } catch (err) {
      setError((err as Error).message || "Unable to reset your password.");
    } finally {
      setLoading(false);
    }
  }

  if (!email) return null;

  return (
    <main className="signup-page auth-split-page">
      <section className="signup-shell">
        <div className="signup-story">
          <div className="story-image" aria-hidden="true" />
          <div className="story-overlay" />
          <div className="story-content">
            <p className="story-eyebrow">
              {step === "otp" ? "Verify your email" : "Secure recovery"}
            </p>
            <h1>
              {step === "otp"
                ? "Check your Gmail inbox."
                : "Create a new password."}
            </h1>
            <p className="story-description">
              {step === "otp"
                ? 'Enter the six-digit code we sent to your registered email address.'
                : 'Your email has been verified. Choose a new password for your Alfiya account.'}
            </p>
          </div>
        </div>

        <div className="signup-form-panel login-form-panel">
          <div className="signup-form-inner login-form-inner">
            {step === "otp" ? (
              <>
                <p className="form-eyebrow">Step 1 of 2</p>
                <h2>Verify code.</h2>
                <p className="form-intro">
                  We sent a 6-digit code to <strong>{maskEmail(email)}</strong>.</p>

                <form className="signup-form" onSubmit={verifyOtp}>
                  <label className="input-group">
                    <span>Verification code</span>
                    <div className="input-shell otp-input-shell">
                      <input
                        className="otp-input"
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={OTP_LENGTH}
                        value={otp}
                        onChange={(event) =>
                          setOtp(
                            (event.currentTarget as HTMLInputElement).value
                              .replace(/\D/g, "")
                              .slice(0, OTP_LENGTH)
                          )
                        }
                        autoComplete="one-time-code"
                        autoFocus
                        aria-label="6-digit verification code"
                      />
                    </div>
                  </label>
                  <button
                    type="button"
                    className="paste-otp-button"
                    onClick={pasteOtp}
                    disabled={loading}
                  >
                    Paste code from clipboard
                  </button>

                  <button
                    type="submit"
                    className="signup-submit"
                    disabled={loading || otp.length !== OTP_LENGTH}
                  >
                    <span>
                      {loading ? "Verifying…" : "Verify code"}
                    </span>
                  </button>
                </form>

                {message && (
                  <p className="auth-form-success" role="status">{message}</p>
                )}
                {error && (
                  <p className="auth-form-error" role="alert">{error}</p>
                )}

                <div className="recovery-meta">
                  <button
                    type="button"
                    className="recovery-link-button"
                    onClick={resendOtp}
                    disabled={loading || resendCooldown > 0}
                  >
                    {resendCooldown > 0
                      ? `Resend code in ${resendCooldown}s`
                      : "Resend verification code"}
                  </button>
                  <Link
                    href="/forgot-password"
                    className="recovery-secondary-link"
                  >
                    Use a different email
                  </Link>
                </div>
              </>
            ) : (
              <>
                <p className="form-eyebrow">Step 2 of 2</p>
                <h2>New password.</h2>
                <p className="form-intro">
                  Create a new password for <strong>{maskEmail(email)}</strong>.</p>

                <form className="signup-form" onSubmit={savePassword}>
                  <label className="input-group">
                    <span>New Password</span>
                    <div className="input-shell">
                      <input
                        type="password"
                        value={password}
                        onChange={(event) =>
                          setPassword(
                            (event.currentTarget as HTMLInputElement).value
                          )
                        }
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </label>
                  <label className="input-group">
                    <span>Confirm Password</span>
                    <div className="input-shell">
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) =>
                          setConfirmPassword(
                            (event.currentTarget as HTMLInputElement).value
                          )
                        }
                        autoComplete="new-password"
                        required
                      />
                    </div>
                  </label>

                  <button
                    type="submit"
                    className="signup-submit"
                    disabled={loading}
                  >
                    <span>
                      {loading ? "Saving…" : "Save new password"}
                    </span>
                  </button>
                </form>

                {message && (
                  <p className="auth-form-success" role="status">{message}</p>
                )}
                {error && (
                  <p className="auth-form-error" role="alert">{error}</p>
                )}

                <div className="recovery-meta">
                  <button
                    type="button"
                    className="recovery-link-button"
                    onClick={() => {
                      setStep("otp");
                      setResetToken("");
                      setMessage("");
                      setError("");
                    }}
                    disabled={loading}
                  >
                    ← Back to verification
                  </button>
                  <Link href="/login" className="recovery-secondary-link">
                    Back to Login
                  </Link>
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}