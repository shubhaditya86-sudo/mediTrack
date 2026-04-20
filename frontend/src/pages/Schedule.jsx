import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import {
  Plus, Trash2, CalendarClock, X, Loader, Clock,
} from 'lucide-react';

// Days of the week — each entry: { num: 0-6, label: display name }
const DAYS = [
  { num: 0, label: 'Sun' }, // Sunday
  { num: 1, label: 'Mon' }, // Monday
  { num: 2, label: 'Tue' }, // Tuesday
  { num: 3, label: 'Wed' }, // Wednesday
  { num: 4, label: 'Thu' }, // Thursday
  { num: 5, label: 'Fri' }, // Friday
  { num: 6, label: 'Sat' }, // Saturday
];

const EMPTY_FORM = {
  medicine: '',
  times: ['08:00'],
  daysOfWeek: [],
  startDate: new Date().toISOString().split('T')[0],
  endDate: '',
};

const Schedule = () => {
  const [schedules, setSchedules] = useState([]);
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [deleteId, setDeleteId] = useState(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [sch, med] = await Promise.all([
        api.get('/schedules'),
        api.get('/medicines'),
      ]);
      setSchedules(sch.data);
      setMedicines(med.data.filter((m) => m.active));
    } catch {
      toast.error('Failed to load schedules');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const openAdd = () => {
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const closeModal = () => { setModal(false); };

  /* ----- Time management ----- */
  const addTime = () => {
    if (form.times.length >= 6) {
      toast.error('Maximum 6 times per schedule');
      return;
    }
    setForm({ ...form, times: [...form.times, '12:00'] });
  };

  const updateTime = (i, val) => {
    const t = [...form.times];
    t[i] = val;
    setForm({ ...form, times: t });
  };

  const removeTime = (i) => {
    const t = form.times.filter((_, idx) => idx !== i);
    setForm({ ...form, times: t.length ? t : ['08:00'] });
  };

  /* ----- Day toggles ----- */
  const toggleDay = (d) => {
    const days = form.daysOfWeek.includes(d)
      ? form.daysOfWeek.filter((x) => x !== d)
      : [...form.daysOfWeek, d];
    setForm({ ...form, daysOfWeek: days });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.medicine) { toast.error('Please select a medicine'); return; }
    setSaving(true);
    try {
      const { data } = await api.post('/schedules', {
        ...form,
        endDate: form.endDate || undefined,
      });
      setSchedules((prev) => [data, ...prev]);
      toast.success('Schedule created 📅');
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleActive = async (sch) => {
    try {
      const { data } = await api.put(`/schedules/${sch._id}`, { active: !sch.active });
      setSchedules((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      toast.success(data.active ? 'Schedule activated' : 'Schedule paused');
    } catch {
      toast.error('Update failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this schedule?')) return;
    setDeleteId(id);
    try {
      await api.delete(`/schedules/${id}`);
      setSchedules((prev) => prev.filter((s) => s._id !== id));
      toast.success('Schedule removed');
    } catch {
      toast.error('Delete failed');
    } finally {
      setDeleteId(null);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Schedule</h1>
          <p className="page-subtitle">Set up when to take each medicine</p>
        </div>
        <button id="add-schedule-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Schedule
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : schedules.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><CalendarClock size={36} /></div>
          <div className="empty-title">No schedules yet</div>
          <div className="empty-desc">Create a schedule to get reminders and track your doses each day.</div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Create Your First Schedule
          </button>
        </div>
      ) : (
        <div>
          {schedules.map((sch) => (
            <ScheduleCard
              key={sch._id}
              sch={sch}
              onToggle={() => handleToggleActive(sch)}
              onDelete={() => handleDelete(sch._id)}
              deleting={deleteId === sch._id}
            />
          ))}
        </div>
      )}

      {/* Add Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">Create Schedule</h2>
              <button className="btn btn-glass btn-icon" onClick={closeModal}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              {/* Medicine */}
              <div className="form-group">
                <label className="form-label">Medicine *</label>
                <select
                  id="sch-medicine"
                  name="medicine"
                  className="form-select"
                  value={form.medicine}
                  onChange={(e) => setForm({ ...form, medicine: e.target.value })}
                >
                  <option value="">— Select a medicine —</option>
                  {medicines.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.name} ({m.dosage} {m.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Times */}
              <div className="form-group">
                <label className="form-label">Times *</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {form.times.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <input
                        type="time"
                        className="form-input"
                        value={t}
                        onChange={(e) => updateTime(i, e.target.value)}
                        style={{ flex: 1 }}
                      />
                      {form.times.length > 1 && (
                        <button type="button" className="btn btn-danger btn-icon" onClick={() => removeTime(i)}>
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <button type="button" className="btn btn-glass btn-sm" style={{ marginTop: 8 }} onClick={addTime}>
                  <Plus size={13} /> Add Time
                </button>
              </div>

              {/* Days of week */}
              <div className="form-group">
                <label className="form-label">Days (empty = every day)</label>
                <div className="day-pills" style={{ marginTop: 6 }}>
                  {DAYS.map(({ num, label }) => (
                    <button
                      key={num}
                      type="button"
                      className={`day-pill${form.daysOfWeek.includes(num) ? ' active' : ''}`}
                      onClick={() => toggleDay(num)}
                    >
                      {label.charAt(0)}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date range */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Start Date</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.startDate}
                    onChange={(e) => setForm({ ...form, startDate: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">End Date (optional)</label>
                  <input
                    type="date"
                    className="form-input"
                    value={form.endDate}
                    onChange={(e) => setForm({ ...form, endDate: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-glass" onClick={closeModal}>Cancel</button>
                <button id="sch-save" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader size={14} style={{ animation: 'spin 0.75s linear infinite' }} /> Saving...</> : 'Create Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const ScheduleCard = ({ sch, onToggle, onDelete, deleting }) => {
  const med = sch.medicine;
  if (!med) return null;

  return (
    <div className="schedule-card">
      {/* Color + Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 180 }}>
        <div
          style={{
            width: 10, height: 44, borderRadius: 5,
            background: med.color || '#805ad5', flexShrink: 0,
          }}
        />
        <div>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{med.name}</div>
          <div style={{ fontSize: 13, color: 'var(--text-3)' }}>{med.dosage} {med.unit}</div>
        </div>
      </div>

      {/* Days */}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Days</div>
        <div className="day-pills">
          {DAYS.map(({ num, label }) => (
            <div key={num} className={`day-pill${sch.daysOfWeek.includes(num) || sch.daysOfWeek.length === 0 ? ' active' : ''}`}>
              {label.charAt(0)}
            </div>
          ))}
        </div>
      </div>

      {/* Times */}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }}>Times</div>
        <div className="time-chips">
          {sch.times.map((t, i) => (
            <span key={i} className="time-chip"><Clock size={10} />{t}</span>
          ))}
        </div>
      </div>

      {/* Status + Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <label className="toggle" title={sch.active ? 'Pause schedule' : 'Activate schedule'}>
          <input type="checkbox" checked={sch.active} onChange={onToggle} />
          <span className="toggle-slider" />
        </label>
        <span className={`badge ${sch.active ? 'badge-active' : 'badge-inactive'}`}>
          {sch.active ? 'Active' : 'Paused'}
        </span>
        <button
          id={`del-sch-${sch._id}`}
          className="btn btn-danger btn-xs"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? <Loader size={12} style={{ animation: 'spin 0.75s linear infinite' }} /> : <Trash2 size={12} />}
        </button>
      </div>
    </div>
  );
};

export default Schedule;
