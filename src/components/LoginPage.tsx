"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-6"
      style={{ background: "#0d0d0d" }}
    >
      {/* Background ambient glow */}
      <div
        className="pointer-events-none fixed inset-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 60%, rgba(79,209,197,0.06) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center max-w-sm w-full animate-fade-in">
        {/* Logo mark */}
        <div className="mb-8 flex items-center justify-center">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: "rgba(79,209,197,0.08)",
              border: "1px solid rgba(79,209,197,0.2)",
              boxShadow: "0 0 32px rgba(79,209,197,0.15)",
            }}
          >
            <svg
              width="28"
              height="28"
              viewBox="0 0 28 28"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="14" cy="14" r="3" fill="#4FD1C5" />
              <circle
                cx="14"
                cy="14"
                r="7"
                stroke="#4FD1C5"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              <circle
                cx="14"
                cy="14"
                r="12"
                stroke="#4FD1C5"
                strokeWidth="0.5"
                strokeOpacity="0.2"
              />
            </svg>
          </div>
        </div>

        {/* Title */}
        <h1
          className="text-3xl font-light mb-2"
          style={{ color: "#e8e8e8", letterSpacing: "-0.02em" }}
        >
          Momentum AI
        </h1>
        <p
          className="text-lg font-light mb-1"
          style={{ color: "#a0a0a0" }}
        >
          The Navigator
        </p>
        <p
          className="text-sm mb-12"
          style={{ color: "#606060" }}
        >
          Your way back to what you started.
        </p>

        {/* Google sign-in */}
        <button
          id="google-signin-btn"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="btn-capsule btn-capsule-teal w-full"
          style={{ gap: "0.75rem", padding: "0.875rem 2rem" }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#0d0d0d"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#0d0d0d"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            />
            <path
              fill="#0d0d0d"
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#0d0d0d"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          Continue with Google
        </button>

        <p
          className="mt-8 text-xs leading-relaxed"
          style={{ color: "#404040", maxWidth: "260px" }}
        >
          No password needed. No streaks. No pressure.
          <br />
          Just your goal and a calm path forward.
        </p>
      </div>
    </div>
  );
}
