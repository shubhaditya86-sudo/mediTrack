import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { ChevronLeft, ChevronRight, History, CheckCircle2, XCircle, Clock } from 'lucide-react';

const DAYS_SHORT  = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS_FULL = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December',
];

const HistoryPage = () => {
  const now = new Date();
  const [viewDate, setViewDate]   = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [logs, setLogs]           = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selectedDay, setSelectedDay] = useState(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const from = new Date(viewDate.year, viewDate.month, 1).toISOString();
      const to   = new Date(viewDate.year, viewDate.month + 1, 0, 23, 59, 59).toISOString();
      const { data } = await api.get(`/logs?from=${from}&to=${to}`);
      setLogs(data);
    } catch {
      toast.error('Failed to load history');
    } finally {
      setLoading(false);
    }
  }, [viewDate]);

  useEffect(() => { fetchLogs(); setSelectedDay(null); }, [fetchLogs]);

  const prevMonth = () => {
    setViewDate((v) => {
      if (v.month === 0) return { year: v.year - 1, month: 11 };
      return { ...v, month: v.month - 1 };
    });
  };

  const nextMonth = () => {
    const cur = new Date();
    if (viewDate.year === cur.getFullYear() && viewDate.month === cur.getMonth()) return;
    setViewDate((v) => {
      if (v.month === 11) return { year: v.year + 1, month: 0 };
      return { ...v, month: v.month + 1 };
    });
  };

  /* Build a map: day number → { total, taken, skipped } */
  const dayMap = {};
  logs.forEach((log) => {
    const d = new Date(log.scheduledFor).getDate();
    if (!dayMap[d]) dayMap[d] = { total: 0, taken: 0, skipped: 0 };
    dayMap[d].total++;
    if (log.status === 'taken')   dayMap[d].taken++;
    if (log.status === 'skipped') dayMap[d].skipped++;
  });

  /* Calendar cells */
  const firstDow  = new Date(viewDate.year, viewDate.month, 1).getDay();
  const daysIn    = new Date(viewDate.year, viewDate.month + 1, 0).getDate();
  const todayDate = now.getDate();
  const isCurrentMonth = viewDate.year === now.getFullYear() && viewDate.month === now.getMonth();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysIn; d++) cells.push(d);

  const getDayClass = (d) => {
    const isFuture = isCurrentMonth && d > todayDate;
    if (isFuture) return 'future';
    const data = dayMap[d];
    if (!data) return 'no-data';
    if (data.taken === data.total) return 'all-taken';
    if (data.taken === 0 && data.skipped > 0) return 'all-skipped';
    return 'partial';
  };

  /* Selected day logs */
  const selectedLogs = selectedDay
    ? logs.filter((l) => new Date(l.scheduledFor).getDate() === selectedDay)
    : [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">History</h1>
          <p className="page-subtitle">View your medication log calendar</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>
        {/* Calendar */}
        <div className="card">
          {/* Month nav */}
          <div className="cal-header">
            <button className="btn btn-glass btn-icon" onClick={prevMonth}>
              <ChevronLeft size={18} />
            </button>
            <h2 className="cal-month">
              {MONTHS_FULL[viewDate.month]} {viewDate.year}
            </h2>
            <button
              className="btn btn-glass btn-icon"
              onClick={nextMonth}
              disabled={isCurrentMonth}
            >
              <ChevronRight size={18} />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="cal-weekdays">
            {DAYS_SHORT.map((d) => (
              <div key={d} className="cal-weekday">{d}</div>
            ))}
          </div>

          {/* Calendar grid */}
          {loading ? (
            <div className="loading-wrap"><div className="spinner" /></div>
          ) : (
            <div className="cal-grid">
              {cells.map((d, i) => {
                if (d === null) return <div key={`e-${i}`} className="cal-day empty-cell" />;
                const cls = getDayClass(d);
                const isToday = isCurrentMonth && d === todayDate;
                const data = dayMap[d];
                return (
                  <div
                    key={d}
                    className={`cal-day ${cls}${isToday ? ' today-cal' : ''}${selectedDay === d ? ' today-cal' : ''}`}
                    onClick={() => setSelectedDay(selectedDay === d ? null : d)}
                    title={data ? `${data.taken}/${data.total} taken` : ''}
                  >
                    <span>{d}</span>
                    {data && (
                      <span style={{ fontSize: 9, marginTop: 2, fontWeight: 800 }}>
                        {data.taken}/{data.total}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Legend */}
          <div style={{ display: 'flex', gap: 16, marginTop: 20, flexWrap: 'wrap' }}>
            {[
              { cls: 'all-taken',   label: 'All taken',    color: 'var(--green)'  },
              { cls: 'partial',     label: 'Partial',      color: 'var(--yellow)' },
              { cls: 'all-skipped', label: 'All skipped',  color: 'var(--red)'    },
              { cls: 'no-data',     label: 'No data',      color: 'var(--text-4)' },
            ].map(({ label, color }) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}>
                <span style={{ width: 10, height: 10, borderRadius: 3, background: color, display: 'inline-block' }} />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div className="card" style={{ minHeight: 200 }}>
          {!selectedDay ? (
            <div className="empty-state" style={{ padding: '40px 16px' }}>
              <div className="empty-icon" style={{ width: 64, height: 64 }}>
                <History size={28} />
              </div>
              <div className="empty-title" style={{ fontSize: 16 }}>Select a day</div>
              <div className="empty-desc" style={{ fontSize: 13 }}>
                Click a date on the calendar to see detailed logs
              </div>
            </div>
          ) : (
            <>
              <h3 style={{ fontWeight: 700, margin: '0 0 16px', fontSize: 16 }}>
                {MONTHS_FULL[viewDate.month]} {selectedDay}
              </h3>
              {selectedLogs.length === 0 ? (
                <div style={{ color: 'var(--text-4)', fontSize: 14 }}>No logs for this day</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {selectedLogs.map((log, i) => (
                    <LogEntry key={i} log={log} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const LogEntry = ({ log }) => {
  const statusIcon = {
    taken:   <CheckCircle2 size={14} color="var(--green)" />,
    skipped: <XCircle     size={14} color="var(--red)"   />,
    pending: <Clock       size={14} color="var(--yellow)" />,
  };

  const scheduledTime = new Date(log.scheduledFor).toLocaleTimeString([], {
    hour: '2-digit', minute: '2-digit',
  });

  return (
    <div
      style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 14px',
        background: 'var(--glass)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--r-sm)',
      }}
    >
      <div
        style={{
          width: 6, height: 36, borderRadius: 3,
          background: log.medicine?.color || '#805ad5', flexShrink: 0,
        }}
      />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 600, fontSize: 14 }}>
          {log.medicine?.name || 'Unknown'}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
          {log.medicine?.dosage} {log.medicine?.unit} · {scheduledTime}
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
        <span className={`badge badge-${log.status}`}>
          {statusIcon[log.status]} {log.status}
        </span>
        {log.takenAt && (
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>
            {new Date(log.takenAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        )}
      </div>
    </div>
  );
};

export default HistoryPage;
