import { useState } from "react";
import { apiFetch } from "../api/api";

export default function ForgotPassword({ onSwitch }) {
  const [step, setStep]     = useState("request"); // request | reset | done
  const [email, setEmail]   = useState("");
  const [token, setToken]   = useState("");
  const [newPass, setNewPass] = useState("");
  const [error, setError]   = useState("");
  const [loading, setLoading] = useState(false);
  const [devToken, setDevToken] = useState("");

  const handleRequest = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const data = await apiFetch("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
      if (data.reset_token_dev) setDevToken(data.reset_token_dev);
      setStep("reset");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      await apiFetch("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, new_password: newPass }),
      });
      setStep("done");
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  };

  if (step === "done") return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-icon" style={{color:"var(--accent-green)"}}>✓</div>
        <h1>Password Reset!</h1>
        <p>Your password has been updated successfully.</p>
      </div>
      <button className="btn-primary" onClick={() => onSwitch("login")}>
        Back to Sign In
      </button>
    </div>
  );

  return (
    <div className="auth-card">
      <div className="auth-header">
        <div className="auth-icon">🔑</div>
        <h1>{step === "request" ? "Forgot Password" : "Reset Password"}</h1>
        <p>{step === "request"
          ? "Enter your email to receive a reset token"
          : "Enter your reset token and new password"}</p>
      </div>

      {step === "request" ? (
        <form onSubmit={handleRequest} className="auth-form">
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label>Email Address</label>
            <input type="email" placeholder="you@gmail.com"
              value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : "Send Reset Token"}
          </button>
          {devToken && (
            <div className="dev-token-box">
              <p>🛠 Dev Mode — Reset Token:</p>
              <code>{devToken}</code>
              <button type="button" className="copy-btn"
                onClick={() => { navigator.clipboard.writeText(devToken); setToken(devToken); setStep("reset"); }}>
                Copy & Continue →
              </button>
            </div>
          )}
        </form>
      ) : (
        <form onSubmit={handleReset} className="auth-form">
          {error && <div className="error-banner">{error}</div>}
          <div className="field">
            <label>Reset Token</label>
            <input type="text" placeholder="paste your token here"
              value={token} onChange={(e) => setToken(e.target.value)} required />
          </div>
          <div className="field">
            <label>New Password</label>
            <input type="password" placeholder="min 6 characters"
              value={newPass} onChange={(e) => setNewPass(e.target.value)}
              required minLength={6} />
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? <span className="spinner" /> : "Reset Password"}
          </button>
        </form>
      )}

      <p className="auth-switch">
        <button onClick={() => onSwitch("login")} className="link-btn">← Back to Sign In</button>
      </p>
    </div>
  );
}