import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const getApiBase = () => {
  const configured = import.meta.env.VITE_API_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;

  if (typeof window !== "undefined" && /^(localhost|127\.0\.0\.1)$/.test(window.location.hostname)) {
    return "http://localhost:5000";
  }

  return "https://alfiya-mehendi-api.onrender.com";
};

export default function GoogleButton({ mode = "signin" }) {
  const containerRef = useRef(null);
  const navigate = useNavigate();
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadGoogle = () => new Promise((resolve, reject) => {
      if (window.google?.accounts?.id) return resolve();
      const existing = document.querySelector('script[data-google-gsi]');
      if (existing) {
        existing.addEventListener("load", resolve, { once: true });
        existing.addEventListener("error", reject, { once: true });
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleGsi = "true";
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });

    const init = async () => {
      try {
        await loadGoogle();
        if (cancelled || !containerRef.current) return;

        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || "37574893420-so4mu6u3uuunkil58nek24nardjm46q4.apps.googleusercontent.com";
        if (!clientId) {
          setError("Google sign-in is not configured yet.");
          return;
        }

        containerRef.current.innerHTML = "";
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            try {
              setError("");
              const apiBase = getApiBase();
              const result = await fetch(apiBase + "/api/auth/google", {
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
              navigate("/services");
            } catch (err) {
              setError(err.message);
            }
          },
          ux_mode: "popup",
        });

        window.google.accounts.id.renderButton(containerRef.current, {
          type: "standard",
          theme: "outline",
          size: "large",
          shape: "rectangular",
          text: mode === "signup" ? "signup_with" : "continue_with",
          logo_alignment: "left",
          width: 250,
        });
      } catch {
        if (!cancelled) setError("Unable to load Google sign-in.");
      }
    };

    init();
    return () => { cancelled = true; };
  }, [mode, navigate]);

  return (
    <div className="google-auth-wrap">
      <div ref={containerRef} className="google-auth-button" />
      {error && <p className="google-auth-error">{error}</p>}
    </div>
  );
}
