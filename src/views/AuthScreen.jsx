// ─────────────────────────────────────────────────────────────────────────────
//  src/views/AuthScreen.jsx
//  Sign in / Sign up / Forgot password UI
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";

export default function AuthScreen() {
  const { T } = useTheme();
  const { signIn, signUp, signInGoogle, resetPassword, authErr, setAuthErr } = useAuth();

  const [mode, setMode]           = useState("login"); // "login" | "signup" | "reset"
  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [busy, setBusy]           = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const R = Math.min((T.radius || 12) * 0.6, 10);

  const handle = async () => {
    setAuthErr("");
    setBusy(true);
    if (mode === "reset") {
      const ok = await resetPassword(email);
      if (ok) setResetSent(true);
    } else if (mode === "signup") {
      if (password !== confirm) { setAuthErr("Passwords do not match."); setBusy(false); return; }
      await signUp(email, password);
    } else {
      await signIn(email, password);
    }
    setBusy(false);
  };

  const inp = {
    width: "100%", background: T.bg, border: `1px solid ${T.border}`,
    borderRadius: R, color: T.text, padding: "11px 14px",
    fontSize: 14, outline: "none", boxSizing: "border-box", fontFamily: T.sans,
  };
  const lbl = (txt) => (
    <div style={{ color: T.textDim, fontSize: 12, fontWeight: 600, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 6, marginTop: 16 }}>
      {txt}
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: T.bg, fontFamily: T.sans, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <div style={{ width: 420, maxWidth: "100%" }}>

        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{ fontSize: 40, marginBottom: 8 }}>💰</div>
          <div style={{ color: T.text, fontSize: 26, fontWeight: 800, letterSpacing: "-0.02em" }}>FinTrack</div>
          <div style={{ color: T.muted, fontSize: 14, marginTop: 4 }}>Your personal finance dashboard</div>
        </div>

        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: T.radius, padding: "32px 28px" }}>

          {/* Mode tabs */}
          {mode !== "reset" && (
            <div style={{ display: "flex", background: T.bg, borderRadius: R + 2, padding: 4, marginBottom: 24 }}>
              {["login", "signup"].map((m) => (
                <button
                  key={m}
                  onClick={() => { setMode(m); setAuthErr(""); setResetSent(false); }}
                  style={{ flex: 1, background: mode === m ? T.accent : "none", border: "none", borderRadius: R, color: mode === m ? "#fff" : T.textDim, padding: "9px", fontSize: 13, fontWeight: 600, cursor: "pointer", transition: "all .15s" }}
                >
                  {m === "login" ? "Sign In" : "Create Account"}
                </button>
              ))}
            </div>
          )}

          {/* Reset mode header */}
          {mode === "reset" && (
            <div style={{ marginBottom: 20 }}>
              <button
                onClick={() => { setMode("login"); setAuthErr(""); setResetSent(false); }}
                style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 13, padding: 0, marginBottom: 12 }}
              >
                ← Back to sign in
              </button>
              <div style={{ color: T.text, fontWeight: 700, fontSize: 17 }}>Reset your password</div>
              <div style={{ color: T.muted, fontSize: 13, marginTop: 4 }}>We'll email you a reset link.</div>
            </div>
          )}

          {/* Reset sent confirmation */}
          {resetSent ? (
            <div style={{ textAlign: "center", padding: "20px 0" }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>📧</div>
              <div style={{ color: T.green, fontWeight: 700, fontSize: 16 }}>Reset email sent!</div>
              <div style={{ color: T.muted, fontSize: 13, marginTop: 8 }}>Check your inbox and follow the link.</div>
              <button
                onClick={() => { setMode("login"); setResetSent(false); }}
                style={{ marginTop: 20, background: T.accent, border: "none", borderRadius: R, color: "#fff", padding: "10px 24px", fontSize: 14, fontWeight: 600, cursor: "pointer" }}
              >
                Back to Sign In
              </button>
            </div>
          ) : (
            <>
              {/* Error banner */}
              {authErr && (
                <div style={{ background: "rgba(239,68,68,0.1)", border: `1px solid ${T.red}`, borderRadius: R, padding: "10px 14px", color: T.red, fontSize: 13, marginBottom: 16 }}>
                  {authErr}
                </div>
              )}

              {/* Fields */}
              {lbl("Email")}
              <input
                style={inp} type="email" value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                onKeyDown={(e) => e.key === "Enter" && handle()}
                autoComplete="email"
              />

              {mode !== "reset" && (
                <>
                  {lbl("Password")}
                  <input
                    style={inp} type="password" value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && handle()}
                    autoComplete={mode === "signup" ? "new-password" : "current-password"}
                  />
                </>
              )}

              {mode === "signup" && (
                <>
                  {lbl("Confirm Password")}
                  <input
                    style={inp} type="password" value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    onKeyDown={(e) => e.key === "Enter" && handle()}
                    autoComplete="new-password"
                  />
                </>
              )}

              {mode === "login" && (
                <button
                  onClick={() => { setMode("reset"); setAuthErr(""); }}
                  style={{ background: "none", border: "none", color: T.accent, cursor: "pointer", fontSize: 12, padding: "6px 0 0", display: "block" }}
                >
                  Forgot password?
                </button>
              )}

              {/* Submit */}
              <button
                onClick={handle}
                disabled={busy}
                style={{ marginTop: 20, width: "100%", background: busy ? T.muted : T.accent, border: "none", borderRadius: R, color: "#fff", padding: "13px", fontSize: 15, fontWeight: 700, cursor: busy ? "default" : "pointer", transition: "background .15s" }}
              >
                {busy ? "Please wait…" : mode === "reset" ? "Send Reset Link" : mode === "login" ? "Sign In" : "Create Account"}
              </button>

              {/* Google sign-in */}
              {mode !== "reset" && (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "20px 0" }}>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                    <span style={{ color: T.muted, fontSize: 12 }}>or</span>
                    <div style={{ flex: 1, height: 1, background: T.border }} />
                  </div>
                  <button
                    onClick={signInGoogle}
                    style={{ width: "100%", background: T.card, border: `1px solid ${T.border}`, borderRadius: R, color: T.text, padding: "12px", fontSize: 14, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}
                  >
                    <svg width="18" height="18" viewBox="0 0 48 48">
                      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.2l6.8-6.8C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13 17.8 9.5 24 9.5z"/>
                      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4 6.1-10 6.1-17z"/>
                      <path fill="#FBBC05" d="M10.6 28.6A14.8 14.8 0 0 1 9.5 24c0-1.6.3-3.2.9-4.6L2.5 13.3A24 24 0 0 0 0 24c0 3.9.9 7.5 2.7 10.7l7.9-6.1z"/>
                      <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.6 2.2-7.7 2.2-6.2 0-11.5-4.2-13.4-9.9l-7.9 6.1C6.6 42.6 14.6 48 24 48z"/>
                    </svg>
                    Continue with Google
                  </button>
                </>
              )}
            </>
          )}
        </div>

        <div style={{ textAlign: "center", color: T.muted, fontSize: 12, marginTop: 20 }}>
          Your data is private and synced securely via Firebase.
        </div>
      </div>
    </div>
  );
}
