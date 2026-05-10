import { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../api/api";
import TaskForm from "../components/TaskForm";
import TaskCard from "../components/TaskCard";
import CalendarView from "../components/CalendarView";

const FILTERS = [
  { value: "all",       label: "All",       icon: "◈" },
  { value: "pending",   label: "Pending",   icon: "◯" },
  { value: "completed", label: "Completed", icon: "◉" },
  { value: "overdue",   label: "Overdue",   icon: "⚠" },
  { value: "calendar",  label: "Calendar",  icon: "📅" },
];

export default function Dashboard() {
  const { username, logout } = useAuth();
  const [tasks, setTasks]         = useState([]);
  const [pagination, setPagination] = useState(null);
  const [filter, setFilter]       = useState("all");
  const [priority, setPriority]   = useState("");
  const [search, setSearch]       = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy]       = useState("created_at");
  const [page, setPage]           = useState(1);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");
  const [showForm, setShowForm]   = useState(false);
  const [editTask, setEditTask]   = useState(null);
  const [showLogout, setShowLogout] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const fetchTasks = useCallback(async () => {
    if (filter === "calendar") return;
    setLoading(true); setError("");
    try {
      const params = new URLSearchParams({
        filter, page, limit: 10, sort_by: sortBy,
        ...(priority && { priority }),
        ...(search   && { search }),
      });
      const data = await apiFetch(`/tasks?${params}`);
      setTasks(data.tasks);
      setPagination(data.pagination);
    } catch (err) {
      setError(err.message);
    } finally { setLoading(false); }
  }, [filter, page, priority, search, sortBy]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);
  useEffect(() => { setPage(1); }, [filter, priority, search, sortBy]);

  // Close sidebar when filter selected on mobile
  const handleFilterSelect = (val) => {
    setFilter(val);
    setSidebarOpen(false);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput.trim());
  };

  const handleCreate = async (d) => {
    await apiFetch("/tasks", { method: "POST", body: JSON.stringify(d) });
    setShowForm(false); fetchTasks();
  };

  const handleUpdate = async (id, d) => {
    await apiFetch(`/tasks/${id}`, { method: "PUT", body: JSON.stringify(d) });
    setEditTask(null); fetchTasks();
  };

  const handleDelete = async (id) => {
    await apiFetch(`/tasks/${id}`, { method: "DELETE" });
    fetchTasks();
  };

  const handleToggle = async (task) => {
    await apiFetch(`/tasks/${task.id}`, {
      method: "PUT",
      body: JSON.stringify({ completed: !task.completed }),
    });
    fetchTasks();
  };

  const today = new Date().toISOString().split("T")[0];
  const overdueCount = tasks.filter(
    t => !t.completed && t.due_date && t.due_date < today
  ).length;

  return (
    <div className="dashboard">

      {/* ── Logout Confirm ── */}
      {showLogout && (
        <div className="modal-overlay" onClick={() => setShowLogout(false)}>
          <div className="modal confirm-modal" onClick={e => e.stopPropagation()}>
            <div className="confirm-icon">⇤</div>
            <h3>Sign out?</h3>
            <p>You'll need to sign in again to access your tasks.</p>
            <div className="confirm-actions">
              <button className="btn-secondary" onClick={() => setShowLogout(false)}>Cancel</button>
              <button className="btn-danger" onClick={logout}>Yes, Sign Out</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Sidebar Overlay ── */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ── Sidebar ── */}
      <aside className={`sidebar ${sidebarOpen ? "sidebar-open" : ""}`}>
        <div className="sidebar-brand">
          <span className="brand-icon">⬡</span>
          <span className="brand-name">Taskr</span>
          {/* Close button on mobile */}
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>✕</button>
        </div>

        <div className="user-info">
          <div className="user-avatar">{username?.[0]?.toUpperCase()}</div>
          <div>
            <div className="user-name">{username}</div>
            <div className="user-role">Personal workspace</div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {FILTERS.map(f => (
            <button key={f.value}
              className={`nav-item ${filter === f.value ? "active" : ""}`}
              onClick={() => handleFilterSelect(f.value)}>
              <span className="nav-icon">{f.icon}</span>
              <span>{f.label}</span>
              {f.value === "all" && pagination && (
                <span className="nav-badge">{pagination.total}</span>
              )}
              {f.value === "overdue" && overdueCount > 0 && (
                <span className="nav-badge overdue-badge">{overdueCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sidebar-stats">
          <div className="stat">
            <span className="stat-value">{pagination?.total ?? 0}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: "var(--accent-green)" }}>
              {tasks.filter(t => t.completed).length}
            </span>
            <span className="stat-label">Done</span>
          </div>
          <div className="stat">
            <span className="stat-value" style={{ color: "var(--accent-yellow)" }}>
              {tasks.filter(t => !t.completed).length}
            </span>
            <span className="stat-label">Pending</span>
          </div>
        </div>

        <button className="logout-btn" onClick={() => { setSidebarOpen(false); setShowLogout(true); }}>
          <span>⇤</span> Sign out
        </button>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">

        {/* ── Mobile Top Bar ── */}
        <div className="mobile-topbar">
          <button className="hamburger-btn" onClick={() => setSidebarOpen(true)}>
            ☰
          </button>
          <span className="mobile-brand">⬡ Taskr</span>
          <button className="mobile-logout-btn" onClick={() => setShowLogout(true)}>
            ⇤
          </button>
        </div>

        {/* ── Desktop Header ── */}
        <header className="main-header">
          <div>
            <h2 className="page-title">
              {FILTERS.find(f => f.value === filter)?.label || "Tasks"}
            </h2>
            <p className="page-subtitle">
              {filter === "calendar"
                ? "Tasks with due dates"
                : pagination
                ? `${pagination.total} task${pagination.total !== 1 ? "s" : ""} total`
                : "Loading..."}
            </p>
          </div>
          {filter !== "calendar" && (
            <button className="btn-add"
              onClick={() => { setShowForm(true); setEditTask(null); }}>
              <span>+</span> New Task
            </button>
          )}
        </header>

        {/* ── Mobile Filter Pills ── */}
        {filter !== "calendar" && (
          <div className="mobile-filters">
            {FILTERS.filter(f => f.value !== "calendar").map(f => (
              <button key={f.value}
                className={`mobile-filter-pill ${filter === f.value ? "active" : ""}`}
                onClick={() => setFilter(f.value)}>
                {f.icon} {f.label}
                {f.value === "overdue" && overdueCount > 0 && (
                  <span className="pill-badge">{overdueCount}</span>
                )}
              </button>
            ))}
            <button
              className={`mobile-filter-pill ${filter === "calendar" ? "active" : ""}`}
              onClick={() => setFilter("calendar")}>
              📅 Calendar
            </button>
          </div>
        )}

        {/* ── Toolbar ── */}
        {filter !== "calendar" && (
          <div className="toolbar">
            <form onSubmit={handleSearch} className="search-form">
              <input className="search-input" placeholder="Search tasks..."
                value={searchInput}
                onChange={e => setSearchInput(e.target.value)} />
              <button type="submit" className="search-btn">🔍</button>
              {search && (
                <button type="button" className="search-clear"
                  onClick={() => { setSearch(""); setSearchInput(""); }}>✕</button>
              )}
            </form>

            <div className="toolbar-selects">
              <select className="filter-select" value={priority}
                onChange={e => setPriority(e.target.value)}>
                <option value="">All Priorities</option>
                <option value="high">🔴 High</option>
                <option value="medium">🟡 Medium</option>
                <option value="low">🟢 Low</option>
              </select>

              <select className="filter-select" value={sortBy}
                onChange={e => setSortBy(e.target.value)}>
                <option value="created_at">Newest</option>
                <option value="due_date">Due Date</option>
                <option value="priority">Priority</option>
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="error-banner" style={{ marginBottom: "1rem" }}>{error}</div>
        )}

        {/* ── Mobile Add Button ── */}
        {filter !== "calendar" && (
          <button className="mobile-fab"
            onClick={() => { setShowForm(true); setEditTask(null); }}>
            +
          </button>
        )}

        {/* ── Task Form Modal ── */}
        {(showForm || editTask) && (
          <div className="modal-overlay"
            onClick={() => { setShowForm(false); setEditTask(null); }}>
            <div className="modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>{editTask ? "Edit Task" : "New Task"}</h3>
                <button className="modal-close"
                  onClick={() => { setShowForm(false); setEditTask(null); }}>✕</button>
              </div>
              <TaskForm
                initial={editTask}
                onSubmit={editTask ? d => handleUpdate(editTask.id, d) : handleCreate}
                onCancel={() => { setShowForm(false); setEditTask(null); }}
              />
            </div>
          </div>
        )}

        {/* ── Calendar View ── */}
        {filter === "calendar" ? (
          <CalendarView />
        ) : loading ? (
          <div className="loading-grid">
            {[1, 2, 3].map(i => <div key={i} className="skeleton-card" />)}
          </div>
        ) : tasks.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">◎</div>
            <h3>No tasks here</h3>
            <p>
              {filter === "completed" ? "No completed tasks yet."
               : filter === "pending" ? "No pending tasks — all caught up!"
               : filter === "overdue" ? "No overdue tasks. Great job!"
               : search ? `No tasks found for "${search}"`
               : "Tap + to create your first task."}
            </p>
          </div>
        ) : (
          <div className="task-grid">
            {tasks.map((task, i) => (
              <TaskCard key={task.id} task={task} index={i}
                onToggle={handleToggle}
                onEdit={() => { setEditTask(task); setShowForm(false); }}
                onDelete={handleDelete} />
            ))}
          </div>
        )}

        {/* ── Pagination ── */}
        {pagination && pagination.total_pages > 1 && filter !== "calendar" && (
          <div className="pagination">
            <button className="page-btn" disabled={!pagination.has_prev}
              onClick={() => setPage(p => p - 1)}>← Prev</button>
            <div className="page-info">
              {pagination.page} / {pagination.total_pages}
            </div>
            <button className="page-btn" disabled={!pagination.has_next}
              onClick={() => setPage(p => p + 1)}>Next →</button>
          </div>
        )}
      </main>
    </div>
  );
}