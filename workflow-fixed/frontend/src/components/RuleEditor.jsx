import React, { useState, useEffect } from 'react';
import { ruleAPI } from '../services/api';
import toast from 'react-hot-toast';

const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 11, fontWeight: 500, color: '#94a3b8', marginBottom: 5, textTransform: 'uppercase', letterSpacing: '0.05em' };

function RuleCard({ rule, onEdit, onDelete }) {
  const isDefault = rule.isDefault;
  return (
    <div style={{ background: '#0f172a', border: `1px solid ${isDefault ? '#334155' : '#1e293b'}`, borderRadius: 10, padding: 14, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
      <div style={{ width: 28, height: 28, borderRadius: 6, background: '#1e293b', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, flexShrink: 0, marginTop: 2 }}>
        {rule.priority}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{rule.name}</span>
          {isDefault && <span style={{ background: '#1e293b', color: '#64748b', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600, textTransform: 'uppercase' }}>DEFAULT</span>}
          <span style={{ background: '#1e1b4b', color: '#a5b4fc', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{rule.action}</span>
        </div>
        <div style={{ background: '#0a0f1a', border: '1px solid #1e293b', borderRadius: 6, padding: '6px 10px', fontFamily: 'JetBrains Mono, monospace', fontSize: 12, color: '#7dd3fc', marginBottom: 6 }}>
          {rule.condition || 'DEFAULT'}
        </div>
        {rule.nextStepId && (
          <div style={{ fontSize: 12, color: '#64748b' }}>
            → <span style={{ color: '#94a3b8' }}>{rule.nextStepId?.name || rule.nextStepId}</span>
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
        <button onClick={() => onEdit(rule)} style={{ background: '#1e293b', color: '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>Edit</button>
        <button onClick={() => onDelete(rule._id)} style={{ background: 'rgba(127,29,29,0.3)', color: '#f87171', border: '1px solid rgba(153,27,27,0.4)', borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 12 }}>✕</button>
      </div>
    </div>
  );
}

function RuleForm({ stepId, rule, allSteps, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: rule?.name || '', priority: rule?.priority || 1,
    condition: rule?.condition || '', nextStepId: rule?.nextStepId?._id || rule?.nextStepId || '',
    action: rule?.action || 'move_to_step', isDefault: rule?.isDefault || false,
    description: rule?.description || '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = { ...form, priority: parseInt(form.priority, 10), nextStepId: form.nextStepId || null };
      if (form.isDefault) payload.condition = 'DEFAULT';
      let res;
      if (rule?._id) { res = await ruleAPI.update(rule._id, payload); }
      else { res = await ruleAPI.create(stepId, payload); }
      toast.success(rule?._id ? 'Rule updated' : 'Rule created');
      onSave(res.data);
    } catch (err) { toast.error(err.message); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ background: '#0f172a', border: '1px solid #334155', borderRadius: 10, padding: 18, marginBottom: 12 }}>
      <h4 style={{ fontSize: 13, fontWeight: 600, color: '#e2e8f0', marginBottom: 14, marginTop: 0 }}>{rule?._id ? 'Edit Rule' : 'New Rule'}</h4>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10, marginBottom: 10 }}>
        <div>
          <label style={labelStyle}>Rule Name *</label>
          <input style={inputStyle} value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. High Value Order" required />
        </div>
        <div>
          <label style={labelStyle}>Priority</label>
          <input style={inputStyle} type="number" min="1" value={form.priority} onChange={e => set('priority', e.target.value)} />
        </div>
      </div>

      <div style={{ marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
          <label style={{ ...labelStyle, margin: 0 }}>Condition</label>
          <label style={{ display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', color: '#64748b', fontSize: 11 }}>
            <input type="checkbox" checked={form.isDefault} onChange={e => set('isDefault', e.target.checked)} />
            DEFAULT (always matches)
          </label>
        </div>
        <input
          style={{ ...inputStyle, fontFamily: 'monospace', opacity: form.isDefault ? 0.4 : 1 }}
          value={form.isDefault ? 'DEFAULT' : form.condition}
          onChange={e => set('condition', e.target.value)}
          disabled={form.isDefault}
          placeholder='e.g. amount > 1000 && country == "US"'
        />
        <div style={{ fontSize: 11, color: '#475569', marginTop: 4 }}>Supports JS expressions: amount &gt; 100 &amp;&amp; status == 'pending'</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 14 }}>
        <div>
          <label style={labelStyle}>Action</label>
          <select style={inputStyle} value={form.action} onChange={e => set('action', e.target.value)}>
            <option value="move_to_step">Move to Step</option>
            <option value="complete">Complete Workflow</option>
            <option value="fail">Fail Workflow</option>
          </select>
        </div>
        {form.action === 'move_to_step' && (
          <div>
            <label style={labelStyle}>Next Step</label>
            <select style={inputStyle} value={form.nextStepId} onChange={e => set('nextStepId', e.target.value)}>
              <option value="">— Select Step —</option>
              {allSteps.map(s => <option key={s._id} value={s._id}>{s.order}. {s.name}</option>)}
            </select>
          </div>
        )}
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={handleSave} disabled={saving} style={{ background: '#4f46e5', color: 'white', padding: '7px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
          {saving ? 'Saving...' : (rule?._id ? 'Update Rule' : 'Create Rule')}
        </button>
        <button onClick={onCancel} style={{ background: '#1e293b', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 }}>Cancel</button>
      </div>
    </div>
  );
}

export default function RuleEditor({ step, allSteps, onClose }) {
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  useEffect(() => {
    ruleAPI.getByStep(step._id).then(res => setRules(res.data || [])).catch(e => toast.error(e.message)).finally(() => setLoading(false));
  }, [step._id]);

  const handleSave = (saved) => {
    if (editingRule?._id) { setRules(rules.map(r => r._id === saved._id ? saved : r)); }
    else { setRules([...rules, saved]); }
    setShowForm(false); setEditingRule(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this rule?')) return;
    try { await ruleAPI.delete(id); toast.success('Rule deleted'); setRules(rules.filter(r => r._id !== id)); }
    catch (err) { toast.error(err.message); }
  };

  const sortedRules = [...rules].sort((a, b) => {
    if (a.isDefault && !b.isDefault) return 1;
    if (!a.isDefault && b.isDefault) return -1;
    return a.priority - b.priority;
  });

  return (
    <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', margin: 0 }}>Rules for: {step.name}</h3>
          <p style={{ fontSize: 12, color: '#64748b', margin: '4px 0 0' }}>Rules evaluated in priority order. First match wins.</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={() => { setEditingRule(null); setShowForm(true); }} style={{ background: '#4f46e5', color: 'white', padding: '7px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>+ Add Rule</button>
          <button onClick={onClose} style={{ background: '#1e293b', color: '#94a3b8', padding: '7px 14px', borderRadius: 8, border: '1px solid #334155', cursor: 'pointer', fontSize: 13 }}>Close</button>
        </div>
      </div>

      {showForm && <RuleForm stepId={step._id} rule={editingRule} allSteps={allSteps.filter(s => s._id !== step._id)} onSave={handleSave} onCancel={() => { setShowForm(false); setEditingRule(null); }} />}

      {loading ? <div style={{ color: '#64748b', padding: '20px 0' }}>Loading rules...</div> :
        sortedRules.length === 0 && !showForm ? (
          <div style={{ textAlign: 'center', padding: '30px 20px', color: '#475569', background: '#0f172a', borderRadius: 8, border: '1px dashed #1e293b' }}>
            <div style={{ fontSize: 24, marginBottom: 6 }}>◇</div>
            <div style={{ fontSize: 13 }}>No rules yet. Add a rule to control step transitions.</div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {sortedRules.map(rule => (
              editingRule?._id === rule._id ? null :
              <RuleCard key={rule._id} rule={rule} onEdit={r => { setEditingRule(r); setShowForm(true); }} onDelete={handleDelete} />
            ))}
          </div>
        )
      }
    </div>
  );
}
