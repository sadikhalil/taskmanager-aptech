import { useState, useEffect } from "react";
import { apiFetch } from "../api/api";

const DAYS   = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const MONTHS = ["January","February","March","April","May","June",
                "July","August","September","October","November","December"];

const PRIORITY_DOT = { high:"#f87171", medium:"#fbbf24", low:"#4ade80" };

export default function CalendarView() {
  const today    = new Date();
  const [year, setYear]     = useState(today.getFullYear());
  const [month, setMonth]   = useState(today.getMonth() + 1);
  const [calendar, setCalendar] = useState({});
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const data = await apiFetch(`/tasks/calendar?month=${month}&year=${year}`);
        setCalendar(data.calendar || {});
      } catch (e) {
        setCalendar({});
      } finally { setLoading(false); }
    };
    fetch();
  }, [month, year]);

  const prevMonth = () => {
    if (month === 1) { setMonth(12); setYear(y => y - 1); }
    else setMonth(m => m - 1);
  };

  const nextMonth = () => {
    if (month === 12) { setMonth(1); setYear(y => y + 1); }
    else setMonth(m => m + 1);
  };

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const dateStr = (d) => `${year}-${String(month).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
  const todayStr = today.toISOString().split("T")[0];
  const selectedStr = selected ? dateStr(selected) : null;
  const selectedTasks = selectedStr ? (calendar[selectedStr] || []) : [];

  return (
    <div className="calendar-wrap">
      <div className="calendar-header">
        <button className="cal-nav" onClick={prevMonth}>‹</button>
        <h3 className="cal-title">{MONTHS[month-1]} {year}</h3>
        <button className="cal-nav" onClick={nextMonth}>›</button>
      </div>

      {loading ? (
        <div className="cal-loading">Loading...</div>
      ) : (
        <>
          <div className="cal-grid">
            {DAYS.map(d => <div key={d} className="cal-day-name">{d}</div>)}
            {cells.map((day, i) => {
              if (!day) return <div key={`e-${i}`} />;
              const ds    = dateStr(day);
              const tasks = calendar[ds] || [];
              const isToday    = ds === todayStr;
              const isSelected = ds === selectedStr;
              const hasOverdue = tasks.some(t => !t.completed && ds < todayStr);

              return (
                <div key={day}
                  className={`cal-cell ${isToday ? "today" : ""} ${isSelected ? "selected" : ""} ${tasks.length ? "has-tasks" : ""}`}
                  onClick={() => setSelected(isSelected ? null : day)}>
                  <span className="cal-date">{day}</span>
                  {tasks.length > 0 && (
                    <div className="cal-dots">
                      {tasks.slice(0,3).map((t,i) => (
                        <span key={i} className="cal-dot"
                          style={{ background: PRIORITY_DOT[t.priority] || "#7c6aff" }} />
                      ))}
                      {tasks.length > 3 && <span className="cal-more">+{tasks.length-3}</span>}
                    </div>
                  )}
                  {hasOverdue && <span className="overdue-flag">!</span>}
                </div>
              );
            })}
          </div>

          {/* Selected day tasks */}
          {selected && (
            <div className="cal-task-list">
              <h4 className="cal-task-header">
                {MONTHS[month-1]} {selected}, {year}
                <span className="cal-task-count">{selectedTasks.length} task{selectedTasks.length !== 1?"s":""}</span>
              </h4>
              {selectedTasks.length === 0 ? (
                <p className="cal-empty">No tasks due on this day.</p>
              ) : (
                selectedTasks.map(t => (
                  <div key={t.id} className={`cal-task-item ${t.completed?"cal-done":""}`}>
                    <span className="cal-task-dot"
                      style={{ background: PRIORITY_DOT[t.priority] || "#7c6aff" }} />
                    <div>
                      <span className="cal-task-title">{t.title}</span>
                      {t.description && <p className="cal-task-desc">{t.description}</p>}
                    </div>
                    <span className={`badge ${t.completed?"badge-done":"badge-pending"}`} style={{marginLeft:"auto"}}>
                      {t.completed ? "Done" : "Pending"}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}