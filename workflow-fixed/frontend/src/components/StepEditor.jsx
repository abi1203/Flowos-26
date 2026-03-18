import React, { useState } from 'react';
import { stepAPI } from '../services/api';
import toast from 'react-hot-toast';

const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 500, color: '#94a3b8', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' };

const TYPE_CONFIG = {
  task:         { color: '#6366f1', bg: '#1e1b4b', icon: '⚙', label: 'Task' },
  approval:     { color: '#f59e0b', bg: '#451a03', icon: '✓', label: 'Approval' },
  notification: { color: '#10b981', bg: '#064e3b', icon: '◎', label: 'Notification' },
};

function StepCard({ step, onEdit, onDelete, onViewRules }) {
  const tc = TYPE_CONFIG[step.type] || TYPE_CONFIG.task;
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 16, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 8, background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>{tc.icon}</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
          <span style={{ fontWeight: 600, fontSize: 14, color: '#e2e8f0' }}>{step.name}</span>
          <span style={{ background: tc.bg, color: tc.color, padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>{step.type}</span>
          {step.isStart && <span style={{ background: '#064e3b', color: '#34d399', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>START</span>}
          {step.isEnd && <span style={{ background: '#450a0a', color: '#f87171', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>END</span>}
        </div>
        <div style={{ fontSize: 12, color: '#64748b' }}>Order: {step.order} {step.description ? '· ' + step.description.slice(0, 60) : ''}</div>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={() => onViewRules(step)} style={{ background: '#1e293b', color: '#818cf8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>Rules</button>
        <button onClick={() => onEdit(step)} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>Edit</button>
        <button onClick={() => onDelete(step._id)} style={{ background: 'rgba(127,29,29,0.3)', color: '#f87171', border: '1px solid rgba(153,27,27,0.4)', borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
    </div>
  );
}

function StepForm({ workflowId, step, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: step?.name || '', type: step?.type || 'task', order: step?.order || 1,
    description: step?.description || '', isStart: step?.isStart || false, isEnd: step?.isEnd || false,
    metadata: step?.metadata ? JSON.stringify(step.metadata, null, 2) : '{}',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      let metadata = {};
      try { metadata = JSON.parse(form.metadata); } catch {}
      const data = { ...form, order: parseInt(form.order, 10), metadata };
      let res;
      if (step?._id) { res = await stepAPI.update(step._id, data); }
      else { res = await stepAPI.create(workflowId, data); }
      toast.success(step?._id ? 'Step updated' : 'Step created');
      onSave(res.data);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 20, marginBottom: 12 }}>
      <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginBottom: 16, marginTop: 0 }}>{step?._id ? 'Edit Step' : 'New Step'}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Name *</label>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="Step name" required />
        </div>
        <div>
          <label style={labelStyle}>Type</label>
          <select style={inputStyle} value={form.type} onChange={e => set('type', e.target.value)}>
            <option value="task">Task</option>
            <option value="approval">Approval</option>
            <option value="notification">Notification</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 }}>
        <div>
          <label style={labelStyle}>Order</label>
          <input style={inputStyle} type="number" min="1" value={form.order} onChange={e => set('order', e.target.value)} />
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, paddingBottom: 4 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
            <input type="checkbox" checked={form.isStart} onChange={e => set('isStart', e.target.checked)} /> Start Step
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', color: '#94a3b8', fontSize: 13 }}>
            <input type="checkbox" checked={form.isEnd} onChange={e => set('isEnd', e.target.checked)} /> End Step
          </label>
        </div>
      </div>
      <div style={{ marginBottom: 12 }}>
        <label style={labelStyle}>Description</label>
        <input style={inputStyle} value={form.description} onChange={e => set('description', e.target.value)} placeholder="Optional description" />
      </div>
      <div style={{ marginBottom: 16 }}>
        <label style={labelStyle}>Metadata (JSON)</label>
        <textarea style={{ ...inputStyle, minHeight: 60, fontFamily: 'monospace', fontSize: 12, resize: 'vertical' }} value={form.metadata} onChange={e => set('metadata', e.target.value)} />
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ background: '#4f46e5', color: 'white', padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          {saving ? 'Saving...' : (step?._id ? 'Update Step' : 'Create Step')}
        </button>
        <button onClick={onCancel} style={{ background: '#1e293b', color: '#94a3b8', padding: '8px 16px', borderRadius: 8, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

export default function StepEditor({ workflowId, steps, onStepsChange, onViewRules }) {
  const [showForm, setShowForm] = useState(false);
  const [editingStep, setEditingStep] = useState(null);

  const handleSave = (savedStep) => {
    if (editingStep?._id) {
      onStepsChange(steps.map(s => s._id === savedStep._id ? savedStep : s));
    } else {
      onStepsChange([...steps, savedStep]);
    }
    setShowForm(false);
    setEditingStep(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this step and all its rules?')) return;
    try {
      await stepAPI.delete(id);
      toast.success('Step deleted');
      onStepsChange(steps.filter(s => s._id !== id));
    } catch (err) { toast.error(err.message); }
  };

  const handleEdit = (step) => {
    setEditingStep(step);
    setShowForm(true);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Steps <span style={{ color: '#64748b', fontWeight: 400 }}>({steps.length})</span></h2>
        <button onClick={() => { setEditingStep(null); setShowForm(true); }} style={{ background: '#4f46e5', color: 'white', padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>+ Add Step</button>
      </div>

      {showForm && (
        <StepForm workflowId={workflowId} step={editingStep} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingStep(null); }} />
      )}

      {steps.length === 0 && !showForm ? (
        <div style={{ textAlign: 'center', padding: '40px 20px', color: '#475569', background: '#0f172a', borderRadius: 10, border: '1px dashed #1e293b' }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>⚙</div>
          <div style={{ fontSize: 14, color: '#64748b' }}>No steps yet. Add a step to define the workflow flow.</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[...steps].sort((a, b) => a.order - b.order).map(step => (
            editingStep?._id === step._id ? null :
            <StepCard key={step._id} step={step} onEdit={handleEdit} onDelete={handleDelete} onViewRules={onViewRules} />
          ))}
        </div>
      )}
    </div>
  );
}
