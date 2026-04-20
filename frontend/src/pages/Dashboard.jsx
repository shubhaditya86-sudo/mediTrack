import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import { CheckCircle2, XCircle, Loader, RefreshCw } from 'lucide-react';

const DAYS   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

const Dashboard = () => {
  const { user } = useAuth();
  const [todayDoses, setTodayDoses] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [actionLoading, setActionLoading] = useState({});

  const now = new Date();

  const fetchDoses = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/logs/today');
      setTodayDoses(data);
    } catch {
      toast.error('Failed to load doses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoses(); }, [fetchDoses]);

  const handleAction = async (dose, status) => {
    const key = `${dose.medicine._id}_${dose.scheduledFor}`;
    setActionLoading((p) => ({ ...p, [key]: status }));
    try {
      await api.post('/logs', {
        medicineId: dose.medicine._id,
        scheduledFor: dose.scheduledFor,
        status,
      });
      setTodayDoses((prev) =>
        prev.map((d) =>
          d.medicine._id === dose.medicine._id && d.scheduledFor === dose.scheduledFor
            ? { ...d, status }
            : d
        )
      );
      toast.success(status === 'taken' ? 'Marked as taken' : status === 'pending' ? 'Undone' : 'Skipped');
    } catch {
      toast.error('Failed to update');
    } finally {
      setActionLoading((p) => ({ ...p, [key]: null }));
    }
  };

  const taken   = todayDoses.filter((d) => d.status === 'taken').length;
  const skipped = todayDoses.filter((d) => d.status === 'skipped').length;
  const pending = todayDoses.filter((d) => d.status === 'pending').length;

  const greeting = () => {
    const h = now.getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div style={{ maxWidth: 680, margin: '0 auto' }}>

      {/* Greeting */}
      <div style={{ marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 24, fontWeight: 700, color: 'var(--text-1)', marginBottom: 4 }}>
              {greeting()}, {user?.name?.split(' ')[0]}
            </h1>
            <p style={{ fontSize: 13, color: 'var(--text-4)' }}>
              {DAYS[now.getDay()]}, {MONTHS[now.getMonth()]} {now.getDate()}
            </p>
          </div>
          <button
            id="refresh-dashboard"
            className="btn btn-glass btn-sm"
            onClick={fetchDoses}
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* Summary row */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 28 }}>
        <SummaryBox label="Taken"   value={taken}   color="var(--green)" />
        <SummaryBox label="Pending" value={pending} color="var(--orange)" />
        <SummaryBox label="Skipped" value={skipped} color="var(--red)" />
         <SummaryBox label="SRM" value={skipped} color="var(--red)" />
         
         
      </div>

      {/* Today's doses */}
      <div style={{ marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        Today's Doses
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : todayDoses.length === 0 ? (
        <div style={{ padding: '40px 0', textAlign: 'center', color: 'var(--text-4)', fontSize: 14 }}>
          No doses scheduled today.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {todayDoses.map((dose, i) => {
            const key   = `${dose.medicine._id}_${dose.scheduledFor}`;
            const isAct = actionLoading[key];
            const color = dose.medicine.color || '#251b39ff';

            return (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  padding: '14px 18px',
                  background: 'var(--glass)',
                  border: `1px solid ${
                    dose.status === 'taken'   ? 'rgba(72,187,120,.25)' :
                    dose.status === 'skipped' ? 'rgba(83, 27, 27, 0.2)' :
                    'var(--glass-border)'
                  }`,
                  borderRadius: 12,
                  opacity: dose.status === 'skipped' ? 0.65 : 1,
                  transition: 'var(--t)',
                }}
              >
                {/* colour dot */}
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />

                {/* info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-1)' }}>
                    {dose.medicine.name}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text-4)', marginTop: 2 }}>
                    {dose.medicine.dosage} {dose.medicine.unit} · {dose.time}
                  </div>
                </div>

                {/* actions */}
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  {dose.status === 'pending' ? (
                    <>
                    
                      <button
                        id={`take-${i}`}
                        className="btn btn-success btn-xs"
                        onClick={() => handleAction(dose, 'taken')}
                        disabled={!!isAct}
                      >
                        {isAct === 'taken'
                          ? <Loader size={12} style={{ animation: 'spin 0.75s linear infinite' }} />
                          : <CheckCircle2 size={12} />}
                        Take
                      </button>
                      <button
                        id={`skip-${i}`}
                        className="btn btn-glass btn-xs"
                        onClick={() => handleAction(dose, 'skipped')}
                        disabled={!!isAct}
                        style={{ color: 'var(--text-4)' }}
                      >
                        {isAct === 'skipped'
                          ? <Loader size={12} style={{ animation: 'spin 0.75s linear infinite' }} />
                          : <XCircle size={12} />}
                        Skip
                      </button>
                      
                    </>
                  ) : (
                    <>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px',
                        borderRadius: 999,
                        background: dose.status === 'taken' ? 'rgba(72,187,120,.15)' : 'rgba(252,129,129,.15)',
                        color: dose.status === 'taken' ? 'var(--green)' : 'var(--red)',
                      }}>
                        {dose.status}
                      </span>
                      <button
                        className="btn btn-glass btn-xs"
                        onClick={() => handleAction(dose, 'pending')}
                        style={{ fontSize: 11 }}
                      >
                        Undo
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const SummaryBox = ({ label, value, color }) => (
  <div style={{
    flex: 1,
    padding: '16px',
    background: 'var(--glass)',
    border: '1px solid var(--glass-border)',
    borderRadius: 12,
    textAlign: 'center',
  }}>
    <div style={{ fontSize: 26, fontWeight: 800, color }}>{value}</div>
    <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</div>
  </div>
);

export default Dashboard;
