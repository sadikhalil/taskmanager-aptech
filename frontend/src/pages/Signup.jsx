import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/api";

export default function Signup({ onSwitch }) {
  const { login } = useAuth();
  const [form, setForm]       = useState({ username: "", email: "", password: "" });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiFetch("/auth/signup", {
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
        <div className="auth-icon">◈</div>
        <h1>Create account</h1>
        <p>Start organizing your work today</p>
      </div>

      <form onSubmit={handle} className="auth-form">
        {error && <div className="error-banner">{error}</div>}

        <div className="field">
          <label>Username</label>
          <input type="text" placeholder="choose a username"
            value={form.username}
            onChange={(e) => setForm({ ...form, username: e.target.value })}
            required minLength={3} />
        </div>

        <div className="field">
          <label>Email <span className="optional">(optional — for password reset)</span></label>
          <input type="email" placeholder="you@gmail.com"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })} />
        </div>

        <div className="field">
          <label>Password</label>
          <input type="password" placeholder="min 6 characters"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required minLength={6} />
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : "Create Account & Continue"}
        </button>
      </form>

      <p className="auth-switch">
        Already have an account?{" "}
        <button onClick={() => onSwitch("login")} className="link-btn">
          Sign in
        </button>
      </p>
    </div>
  );
}