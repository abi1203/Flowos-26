import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { workflowAPI } from '../services/api';
import toast from 'react-hot-toast';

const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '9px 12px', fontSize: 14, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box' };
const labelStyle = { display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' };
const fieldStyle = { marginBottom: 20 };

export default function WorkflowCreate() {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', version: '1.0.0', status: 'draft',
    tags: '', inputSchema: '{\n  "type": "object",\n  "properties": {}\n}'
  });
  const [schemaError, setSchemaError] = useState('');

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    let inputSchema = {};
    try {
      inputSchema = JSON.parse(form.inputSchema);
      setSchemaError('');
    } catch (err) {
      setSchemaError('Invalid JSON in Input Schema');
      return;
    }
    setSaving(true);
    try {
      const res = await workflowAPI.create({
        name: form.name, description: form.description, version: form.version,
        status: form.status, tags: form.tags.split(',').map(t => t.trim()).filter(Boolean), inputSchema,
      });
      toast.success('Workflow created!');
      navigate(`/workflows/${res.data._id}`);
    } catch (err) {
      toast.error(err.message);
    } finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 680, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
        <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: '8px 0 4px' }}>New Workflow</h1>
        <p style={{ color: '#64748b', fontSize: 14 }}>Configure the workflow settings and input schema</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 28, marginBottom: 20 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 20, marginTop: 0 }}>Basic Information</h2>
          <div style={fieldStyle}>
            <label style={labelStyle}>Workflow Name *</label>
            <input style={inputStyle} placeholder="e.g. Order Approval Workflow" value={form.name} onChange={e => set('name', e.target.value)} required />
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} placeholder="What does this workflow do?" value={form.description} onChange={e => set('description', e.target.value)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div style={fieldStyle}>
              <label style={labelStyle}>Version</label>
              <input style={inputStyle} placeholder="1.0.0" value={form.version} onChange={e => set('version', e.target.value)} required />
            </div>
            <div style={fieldStyle}>
              <label style={labelStyle}>Status</label>
              <select style={inputStyle} value={form.status} onChange={e => set('status', e.target.value)}>
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          </div>
          <div style={fieldStyle}>
            <label style={labelStyle}>Tags (comma-separated)</label>
            <input style={inputStyle} placeholder="e.g. order, finance, approval" value={form.tags} onChange={e => set('tags', e.target.value)} />
          </div>
        </div>

        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 28, marginBottom: 24 }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', marginBottom: 8, marginTop: 0 }}>Input Schema</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>Define the JSON schema for execution inputs</p>
          <textarea
            style={{ ...inputStyle, minHeight: 160, fontFamily: 'JetBrains Mono, monospace', fontSize: 13 }}
            value={form.inputSchema}
            onChange={e => { set('inputSchema', e.target.value); setSchemaError(''); }}
          />
          {schemaError && <div style={{ color: '#f87171', fontSize: 13, marginTop: 8 }}>{schemaError}</div>}
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button type="submit" disabled={saving} style={{ background: '#4f46e5', color: 'white', padding: '10px 24px', borderRadius: 8, border: 'none', cursor: saving ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Creating...' : 'Create Workflow'}
          </button>
          <Link to="/" style={{ background: '#1e293b', color: '#94a3b8', padding: '10px 24px', borderRadius: 8, textDecoration: 'none', fontSize: 14, fontWeight: 500, display: 'inline-flex', alignItems: 'center' }}>Cancel</Link>
        </div>
      </form>
    </div>
  );
}
