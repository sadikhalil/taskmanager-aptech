import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/api";

export default function Login({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ identifier: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/login", {
        method: "POST",
        body: JSON.stringify(form),
      });
      login(data.access_token, data.username);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-card">

      {/* App Brand */}
      <div className="auth-brand">
        <span className="auth-brand-icon">⬡</span>
        <span className="auth-brand-name">Taskr</span>
      </div>

      <div className="auth-header">
        <div className="auth-icon">✦</div>
        <h1>Welcome back</h1>
        <p>Sign in to your workspace</p>
      </div>

      <form onSubmit={handle} className="auth-form">
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Username or Email</label>
          <input type="text" placeholder="username or you@gmail.com"
            value={form.identifier}
            onChange={(e) => setForm({ ...form, identifier: e.target.value })}
            required />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="••••••••"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required />
        </div>

        <button type="button" className="forgot-link"
          onClick={() => onSwitch("forgot")}>
          Forgot password?
        </button>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : "Sign In"}
        </button>
      </form>

      <p className="auth-switch">
        No account?{" "}
        <button onClick={() => onSwitch("signup")} className="link-btn">
          Create one
        </button>
      </p>
    </div>
  );
}