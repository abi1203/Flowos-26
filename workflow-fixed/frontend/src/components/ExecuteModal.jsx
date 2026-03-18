import React, { useState } from 'react';
import { workflowAPI } from '../services/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

const inputStyle = { width: '100%', background: '#1e293b', border: '1px solid #334155', borderRadius: 8, padding: '8px 12px', fontSize: 13, color: '#f1f5f9', outline: 'none', boxSizing: 'border-box', fontFamily: 'JetBrains Mono, monospace' };

export default function ExecuteModal({ workflow, onClose }) {
  const navigate = useNavigate();
  const [input, setInput] = useState('{\n  "amount": 500,\n  "country": "US",\n  "customerId": "cust_123"\n}');
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const handleExecute = async () => {
    let parsed;
    try { parsed = JSON.parse(input); setError(''); }
    catch { setError('Invalid JSON input'); return; }
    setRunning(true);
    try {
      const res = await workflowAPI.execute(workflow._id, { input: parsed });
      toast.success(`Execution ${res.data.status}`);
      onClose();
      navigate(`/executions/${res.data._id}`);
    } catch (err) { toast.error(err.message); }
    finally { setRunning(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20 }}>
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 32, width: '100%', maxWidth: 520 }}>
        <h2 style={{ fontSize: 18, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, marginTop: 0 }}>Execute Workflow</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 24 }}>{workflow.name}</p>

        <div style={{ marginBottom: 20 }}>
          <label style={{ display: 'block', fontSize: 11, fontWeight: 500, color: '#94a3b8', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Input JSON</label>
          <textarea
            style={{ ...inputStyle, minHeight: 160, resize: 'vertical' }}
            value={input} onChange={e => { setInput(e.target.value); setError(''); }}
          />
          {error && <div style={{ color: '#f87171', fontSize: 13, marginTop: 6 }}>{error}</div>}
        </div>

        {workflow.inputSchema && Object.keys(workflow.inputSchema).length > 0 && (
          <div style={{ background: '#020617', border: '1px solid #1e293b', borderRadius: 8, padding: 12, marginBottom: 20 }}>
            <div style={{ fontSize: 11, color: '#64748b', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Expected Schema</div>
            <pre style={{ margin: 0, fontSize: 11, color: '#64748b', fontFamily: 'monospace' }}>{JSON.stringify(workflow.inputSchema, null, 2)}</pre>
          </div>
        )}

        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={handleExecute} disabled={running} style={{ background: '#059669', color: 'white', padding: '10px 24px', borderRadius: 8, border: 'none', cursor: running ? 'not-allowed' : 'pointer', fontSize: 14, fontWeight: 500, flex: 1, opacity: running ? 0.7 : 1 }}>
            {running ? '▷ Running...' : '▶ Execute'}
          </button>
          <button onClick={onClose} style={{ background: '#1e293b', color: '#94a3b8', padding: '10px 20px', borderRadius: 8, border: '1px solid #334155', cursor: 'pointer', fontSize: 14 }}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
