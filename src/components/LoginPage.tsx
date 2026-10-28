"use client";

import { signIn } from "next-auth/react";

export default function LoginPage() {
  return (
    <div
      className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center px-6"
      style={{
        background: "linear-gradient(160deg, #e8f4ff 0%, #f0f7ff 40%, #e8f0ff 100%)",
      }}
    >
      {/* Decorative blurred circle blobs */}
      {/* Top left blob: 140px, blue: #bfdbfe to #93c5fd */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          top: "-20px",
          left: "-20px",
          width: "140px",
          height: "140px",
          background: "linear-gradient(135deg, #bfdbfe, #93c5fd)",
          filter: "blur(40px)",
        }}
      />
      {/* Top right blob: 100px, green: #a7f3d0 to #6ee7b7 */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          top: "10%",
          right: "-10px",
          width: "100px",
          height: "100px",
          background: "linear-gradient(135deg, #a7f3d0, #6ee7b7)",
          filter: "blur(35px)",
        }}
      />
      {/* Bottom left blob: 80px, soft purple: #c7d2fe to #a5b4fc, opacity 0.3 */}
      <div
        className="pointer-events-none absolute rounded-full"
        style={{
          bottom: "10%",
          left: "5%",
          width: "80px",
          height: "80px",
          background: "linear-gradient(135deg, #c7d2fe, #a5b4fc)",
          opacity: 0.3,
          filter: "blur(30px)",
        }}
      />

      {/* Centered Glassmorphism Card */}
      <div
        className="relative z-10 flex flex-col items-center text-center max-w-sm w-full animate-fade-in"
        style={{
          background: "rgba(255, 255, 255, 0.6)",
          backdropFilter: "blur(12px)",
          WebkitBackdropFilter: "blur(12px)",
          border: "1px solid rgba(255, 255, 255, 0.8)",
          borderRadius: "24px",
          padding: "1.75rem 1.5rem",
          boxShadow: "0 2px 16px rgba(0, 0, 0, 0.06)",
        }}
      >
        {/* (1) Logo/emoji 🧭 in a white rounded square (72px, border-radius 22px, soft green box-shadow) */}
        <div
          className="flex items-center justify-center text-3xl mb-4"
          style={{
            width: "72px",
            height: "72px",
            background: "#ffffff",
            borderRadius: "22px",
            boxShadow: "0 4px 16px rgba(16, 185, 129, 0.18)",
          }}
        >
          🧭
        </div>

        {/* (2) App name ‘Momentum AI’ in bold dark text */}
        <h1
          className="text-2xl font-bold mb-1"
          style={{ color: "#111827", letterSpacing: "-0.02em" }}
        >
          Momentum AI
        </h1>

        {/* (3) Subtitle ‘The Navigator’ in grey */}
        <p
          className="text-sm font-medium mb-1"
          style={{ color: "#6b7280" }}
        >
          The Navigator
        </p>

        {/* (4) Tagline ‘Your way back to what you started.’ in light grey */}
        <p
          className="text-xs mb-6"
          style={{ color: "#9ca3af" }}
        >
          Your way back to what you started.
        </p>

        {/* (5) Green Google button — full width, border-radius 50px, background gradient #10b981 to #059669, box-shadow 0 4px 16px rgba(16,185,129,0.35), white text ‘Continue with Google’ with Google G icon */}
        <button
          id="google-signin-btn"
          onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
          className="w-full flex items-center justify-center gap-3 text-sm font-medium transition-all hover:opacity-95 active:scale-[0.99]"
          style={{
            borderRadius: "50px",
            background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
            boxShadow: "0 4px 16px rgba(16, 185, 129, 0.35)",
            color: "#ffffff",
            padding: "0.85rem 1.5rem",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
            <path
              fill="#ffffff"
              d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"
            />
            <path
              fill="#ffffff"
              d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"
            />
            <path
              fill="#ffffff"
              d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"
            />
            <path
              fill="#ffffff"
              d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"
            />
          </svg>
          Continue with Google
        </button>

        {/* (6) A thin divider with text ‘why we are different’ in the center */}
        <div className="w-full flex items-center my-5">
          <div className="flex-1 h-px" style={{ background: "rgba(0, 0, 0, 0.08)" }} />
          <span
            className="px-2.5 text-[11px] uppercase tracking-wider font-medium"
            style={{ color: "#9ca3af" }}
          >
            why we are different
          </span>
          <div className="flex-1 h-px" style={{ background: "rgba(0, 0, 0, 0.08)" }} />
        </div>

        {/* (7) Three small equal chips side by side — ‘🚫 No streaks’, ‘🔑 No password’, ‘🧘 No pressure’ — white background, green border, small font */}
        <div className="w-full grid grid-cols-3 gap-1.5">
          {[
            { label: "🚫 No streaks" },
            { label: "🔑 No password" },
            { label: "🧘 No pressure" },
          ].map((chip) => (
            <div
              key={chip.label}
              className="py-1.5 px-1 rounded-xl text-center text-[10px] font-medium whitespace-nowrap flex items-center justify-center shadow-xs"
              style={{
                background: "#ffffff",
                border: "1px solid #a7f3d0",
                color: "#065f46",
              }}
            >
              {chip.label}
            </div>
          ))}
        </div>
      </div>

      {/* Below the card add one line in light grey: ‘Just your goal and a calm path forward.’ */}
      <p
        className="relative z-10 mt-5 text-xs text-center"
        style={{ color: "#9ca3af" }}
      >
        Just your goal and a calm path forward.
      </p>
    </div>
  );
}
