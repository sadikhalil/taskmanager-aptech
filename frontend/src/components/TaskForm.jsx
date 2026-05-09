import { useState } from "react";

const PRIORITIES = [
  { value: "low",    label: "Low",    color: "#4ade80" },
  { value: "medium", label: "Medium", color: "#fbbf24" },
  { value: "high",   label: "High",   color: "#f87171" },
];

export default function TaskForm({ initial, onSubmit, onCancel }) {
  const [form, setForm] = useState({
    title:       initial?.title       || "",
    description: initial?.description || "",
    priority:    initial?.priority    || "medium",
    due_date:    initial?.due_date    || "",
  });
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);

  const handle = async (e) => {
    e.preventDefault();
    setError("");
    if (form.title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    setLoading(true);
    try {
      await onSubmit({
        title:       form.title.trim(),
        description: form.description.trim(),
        priority:    form.priority,
        due_date:    form.due_date || null,
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handle} className="task-form">
      {error && <div className="error-banner">{error}</div>}

      <div className="field">
        <label>Task Title <span className="required">*</span></label>
        <input type="text" placeholder="What needs to be done?"
          value={form.title} autoFocus maxLength={200}
          onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        <span className="char-count">{form.title.length}/200</span>
      </div>

      <div className="field">
        <label>Description <span className="optional">(optional)</span></label>
        <textarea placeholder="Add more details..." rows={3} maxLength={1000}
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <span className="char-count">{form.description.length}/1000</span>
      </div>

      <div className="form-row">
        <div className="field">
          <label>Priority</label>
          <div className="priority-selector">
            {PRIORITIES.map((p) => (
              <button key={p.value} type="button"
                className={`priority-btn ${form.priority === p.value ? "active" : ""}`}
                style={{ "--p-color": p.color }}
                onClick={() => setForm({ ...form, priority: p.value })}>
                {p.label}
              </button>
            ))}
          </div>
        </div>

        <div className="field">
          <label>Due Date <span className="optional">(optional)</span></label>
          <input type="date" value={form.due_date}
            min={new Date().toISOString().split("T")[0]}
            onChange={(e) => setForm({ ...form, due_date: e.target.value })} />
        </div>
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? <span className="spinner" /> : initial ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </form>
  );
}