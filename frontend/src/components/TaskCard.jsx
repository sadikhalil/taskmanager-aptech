import { useState } from "react";

const PRIORITY_CONFIG = {
  high:   { label: "High",   color: "#f87171", bg: "rgba(248,113,113,0.1)" },
  medium: { label: "Medium", color: "#fbbf24", bg: "rgba(251,191,36,0.1)"  },
  low:    { label: "Low",    color: "#4ade80", bg: "rgba(74,222,128,0.1)"  },
};

export default function TaskCard({ task, index, onToggle, onEdit, onDelete }) {
  const [deleting, setDeleting]  = useState(false);
  const [toggling, setToggling]  = useState(false);

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return;
    setDeleting(true);
    try { await onDelete(task.id); } finally { setDeleting(false); }
  };

  const handleToggle = async () => {
    setToggling(true);
    try { await onToggle(task); } finally { setToggling(false); }
  };

  const formatDate = (iso) => {
    if (!iso) return null;
    const d = new Date(iso);
    return d.toLocaleDateString("en-US", { month:"short", day:"numeric", year:"numeric" });
  };

  const today    = new Date().toISOString().split("T")[0];
  const isOverdue = !task.completed && task.due_date && task.due_date < today;
  const isDueToday = !task.completed && task.due_date === today;
  const priority = PRIORITY_CONFIG[task.priority] || PRIORITY_CONFIG.medium;

  return (
    <div className={`task-card ${task.completed ? "completed" : ""} ${isOverdue ? "overdue" : ""}`}
      style={{ animationDelay: `${index * 60}ms` }}>

      {/* Priority bar */}
      <div className="priority-bar" style={{ background: priority.color }} />

      <div className="task-card-top">
        <button
          className={`check-btn ${task.completed ? "checked" : ""}`}
          onClick={handleToggle} disabled={toggling}
          title={task.completed ? "Mark pending" : "Mark complete"}>
          {toggling ? <span className="spinner-sm" /> : task.completed ? "✓" : ""}
        </button>

        <div className="task-content">
          <h4 className={`task-title ${task.completed ? "struck" : ""}`}>{task.title}</h4>
          {task.description && <p className="task-desc">{task.description}</p>}
        </div>
      </div>

      <div className="task-badges">
        {/* Priority badge */}
        <span className="badge" style={{ color: priority.color, background: priority.bg }}>
          ● {priority.label}
        </span>

        {/* Status badge */}
        <span className={`badge ${task.completed ? "badge-done" : "badge-pending"}`}>
          {task.completed ? "Done" : "Pending"}
        </span>

        {/* Due date badge */}
        {task.due_date && (
          <span className={`badge ${isOverdue ? "badge-overdue" : isDueToday ? "badge-today" : "badge-due"}`}>
            {isOverdue ? "⚠ Overdue" : isDueToday ? "📅 Due Today" : `📅 ${formatDate(task.due_date)}`}
          </span>
        )}
      </div>

      <div className="task-card-bottom">
        <span className="task-date">Created {formatDate(task.created_at)}</span>
        <div className="task-actions">
          <button className="action-btn edit-btn" onClick={onEdit} title="Edit">✎</button>
          <button className="action-btn delete-btn" onClick={handleDelete}
            disabled={deleting} title="Delete">
            {deleting ? <span className="spinner-sm" /> : "✕"}
          </button>
        </div>
      </div>
    </div>
  );
}