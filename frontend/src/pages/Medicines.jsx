import { useState, useEffect, useCallback } from 'react';
import api from '../api/axios';
import { toast } from 'react-hot-toast';
import {
  Plus, Pencil, Trash2, Pill, X, Loader, Package,
} from 'lucide-react';



const COLORS = [
  '#796f8fff', // Muted Purple
  '#38b2ac',   // Teal
  '#ed64a6',   // Pink
  '#ed8936',   // Orange
  '#48bb78',   // Green
  '#63b3ed',   // Blue
  '#fc8181',   // Red
  '#f6e05e',   // Yellow
  '#9f7aea',   // Violet
  '#4fd1c5',   // Cyan
  '#667eea',   // Indigo
  '#f687b3',   // Rose
];

const EMOJI_MAP = {
  General: '💊', Antibiotic: '🦠', Vitamin: '🍊', Supplement: '💪',
  'Pain Relief': '🩹', Heart: '❤️', Diabetes: '🩺', Other: '📦',
};

const EMPTY_FORM = {
  name: '', dosage: '', unit: 'mg', category: 'General',
  color: '#805ad5', notes: '',
};

const Medicines = () => {
  const [medicines, setMedicines] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [modal, setModal]         = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [deleteId, setDeleteId]   = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/medicines');
      setMedicines(data);
    } catch {
      toast.error('Failed to load medicines');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openAdd = () => {
    setEditTarget(null);
    setForm(EMPTY_FORM);
    setModal(true);
  };

  const openEdit = (med) => {
    setEditTarget(med);
    setForm({
      name: med.name, dosage: med.dosage, unit: med.unit,
      category: med.category, color: med.color, notes: med.notes || '',
    });
    setModal(true);
  };

  const closeModal = () => { setModal(false); setEditTarget(null); };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.dosage.trim()) {
      toast.error('Name and dosage are required');
      return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        const { data } = await api.put(`/medicines/${editTarget._id}`, form);
        setMedicines((prev) => prev.map((m) => (m._id === data._id ? data : m)));
        toast.success('Medicine updated ✅');
      } else {
        const { data } = await api.post('/medicines', form);
        setMedicines((prev) => [data, ...prev]);
        toast.success('Medicine added 💊');
      }
      closeModal();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    setDeleteId(id);
    try {
      await api.delete(`/medicines/${id}`);
      setMedicines((prev) => prev.filter((m) => m._id !== id));
      toast.success('Medicine removed');
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
          <h1 className="page-title">Medicines</h1>
          <p className="page-subtitle">Manage your medication list</p>
        </div>
        <button id="add-medicine-btn" className="btn btn-primary" onClick={openAdd}>
          <Plus size={16} /> Add Medicine
        </button>
      </div>

      {loading ? (
        <div className="loading-wrap"><div className="spinner" /></div>
      ) : medicines.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon"><Pill size={36} /></div>
          <div className="empty-title">No medicines yet</div>
          <div className="empty-desc">Add your first medicine to start tracking your health.</div>
          <button className="btn btn-primary" onClick={openAdd}>
            <Plus size={15} /> Add Your First Medicine
          </button>
        </div>
      ) : (
        <div className="med-grid">
          {medicines.map((med) => (
            <MedCard
              key={med._id}
              med={med}
              onEdit={() => openEdit(med)}
              onDelete={() => handleDelete(med._id)}
              deleting={deleteId === med._id}
            />
          ))}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && closeModal()}>
          <div className="modal">
            <div className="modal-header">
              <h2 className="modal-title">{editTarget ? 'Edit Medicine' : 'Add Medicine'}</h2>
              <button className="btn btn-glass btn-icon" onClick={closeModal}><X size={16} /></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Medicine Name *</label>
                <input
                  id="med-name"
                  name="name"
                  className="form-input"
                  placeholder="e.g. Aspirin"
                  value={form.name}
                  onChange={handleChange}
                  autoFocus
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Dosage *</label>
                  <input
                    id="med-dosage"
                    name="dosage"
                    className="form-input"
                    placeholder="e.g. 500"
                    value={form.dosage}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select id="med-unit" name="unit" className="form-select" value={form.unit} onChange={handleChange}>
                    <option value="mg">mg</option>
                    <option value="ml">ml</option>
                    <option value="tablet">tablet</option>
                    <option value="capsule">capsule</option>
                  
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Category</label>
                <select id="med-category" name="category" className="form-select" value={form.category} onChange={handleChange}>
                  <option value="General">General</option>
                  <option value="Antibiotic">Antibiotic</option>
                  <option value="Vitamin">Vitamin</option>
                  <option value="Supplement">Supplement</option>
                  <option value="Pain Relief">Pain Relief</option>
                  
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Color Label</label>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 4 }}>
                  {COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, color: c })}
                      style={{
                        width: 32, height: 32, borderRadius: '50%', background: c,
                        border: form.color === c ? '3px solid white' : '2px solid transparent',
                        cursor: 'pointer', transition: 'var(--t)',
                        boxShadow: form.color === c ? `0 0 0 3px ${c}66` : 'none',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Notes (optional)</label>
                <textarea
                  id="med-notes"
                  name="notes"
                  className="form-textarea"
                  placeholder="Any special instructions..."
                  value={form.notes}
                  onChange={handleChange}
                  rows={3}
                />
              </div>

              <div className="modal-actions">
                <button type="button" className="btn btn-glass" onClick={closeModal}>Cancel</button>
                <button id="med-save" type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? <><Loader size={14} style={{ animation: 'spin 0.75s linear infinite' }} /> Saving...</> : (editTarget ? 'Update' : 'Add Medicine')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const MedCard = ({ med, onEdit, onDelete, deleting }) => (
  <div className="med-card">
    <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, width: 4, background: med.color, borderRadius: '4px 0 0 4px' }} />

    <div className="med-card-header">
      <div className="med-card-dot" style={{ background: `${med.color}22` }}>
        <span style={{ fontSize: 20 }}>{EMOJI_MAP[med.category] || '💊'}</span>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <button id={`edit-${med._id}`} className="btn btn-glass btn-xs" onClick={onEdit}>
          <Pencil size={12} />
        </button>
        <button
          id={`delete-${med._id}`}
          className="btn btn-danger btn-xs"
          onClick={onDelete}
          disabled={deleting}
        >
          {deleting ? <Loader size={12} style={{ animation: 'spin 0.75s linear infinite' }} /> : <Trash2 size={12} />}
        </button>
      </div>
    </div>

    <div className="med-card-name">{med.name}</div>
    <div className="med-card-dosage">{med.dosage} {med.unit}</div>
    <div className="med-card-category">{med.category}</div>
    {med.notes && <div className="med-card-notes">{med.notes}</div>}

    <div style={{ marginTop: 14, paddingTop: 12, borderTop: '1px solid var(--glass-border)' }}>
      <span className={`badge ${med.active ? 'badge-active' : 'badge-inactive'}`}>
        <Package size={10} />
        {med.active ? 'Active' : 'Inactive'}
      </span>
    </div>
  </div>
);

export default Medicines;
