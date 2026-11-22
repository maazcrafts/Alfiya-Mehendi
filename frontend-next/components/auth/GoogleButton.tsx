"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export default function GoogleButton({ mode = "signin" }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadGoogle = () =>
      new Promise<void>((resolve) => {
        if ((window as any).google?.accounts?.id) return resolve();
        const existing = document.querySelector('script[data-google-gsi]');
        if (existing) {
          ;(existing as any).addEventListener("load", resolve, { once: true });
          ;(existing as any).addEventListener("error", resolve, { once: true });
          return;
        }
        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.dataset.googleGsi = "true";
        script.onload = () => resolve();
        document.head.appendChild(script);
      });

    const init = async () => {
      try {
        await loadGoogle();
        if (cancelled || !containerRef.current) return;

        const clientId =
          process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
          "37574893420-so4mu6u3uuunkil58nek24nardjm46q4.apps.googleusercontent.com";
        if (!clientId) {
          setError("Google sign-in is not configured yet.");
          return;
        }

        containerRef.current.innerHTML = "";
        const google = window as any;
        google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response: any) => {
            try {
              setError("");
              const result = await fetch("/api/auth/google", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });

              const data = await result.json();
              if (!result.ok) throw new Error(data.message || "Google sign-in failed.");

              sessionStorage.setItem("alfiya_auth_token", data.token);
              sessionStorage.setItem("alfiya_user", JSON.stringify(data.user));
              if (mode === "signup") {
                localStorage.setItem("alfiya_new_user_tour", "pending");
                localStorage.removeItem("alfiya_new_user_tour_step");
              }
              router.push("/services");
            } catch (err) {
              setError((err as Error).message || "Unable to load Google sign-in.");
            }
          },
          ux_mode: "popup",
        });

        google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "left",
          width: 250,
        });
      } catch (e) {
        if (!cancelled) setError((e as Error).message || "Unable to load Google sign-in.");
      }
    };

    init();
    return () => {
      cancelled = true;
    };
  }, [mode, router]);

  return (
    <div className="google-auth-wrap">
      <div ref={containerRef} className="google-auth-button" />
      {error && <p className="google-auth-error">{error}</p>}
    </div>
  );
}