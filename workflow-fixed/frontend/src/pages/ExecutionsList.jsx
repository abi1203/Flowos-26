import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { executionAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  completed:   { bg: '#064e3b', text: '#34d399', border: '#065f46' },
  failed:      { bg: '#450a0a', text: '#f87171', border: '#7f1d1d' },
  in_progress: { bg: '#1e1b4b', text: '#a5b4fc', border: '#3730a3' },
  canceled:    { bg: '#292524', text: '#a8a29e', border: '#44403c' },
  pending:     { bg: '#1c1917', text: '#78716c', border: '#44403c' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status.replace('_', ' ')}</span>;
}

export default function ExecutionsList() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0 });
  const LIMIT = 20;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (filter) params.status = filter;
      const res = await executionAPI.getAll(params);
      if (res.data?.executions) {
        setExecutions(res.data.executions);
        setPagination(res.data.pagination || {});
      } else {
        setExecutions(res.data || []);
        setPagination({ total: (res.data || []).length });
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, [filter, page]);

  const handleCancel = async (id) => {
    try { await executionAPI.cancel(id); toast.success('Execution canceled'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const handleRetry = async (id) => {
    try { await executionAPI.retry(id); toast.success('Retrying execution...'); load(); }
    catch (err) { toast.error(err.message); }
  };

  const stats = {
    total: pagination.total || executions.length,
    completed: executions.filter(e => e.status === 'completed').length,
    failed: executions.filter(e => e.status === 'failed').length,
    running: executions.filter(e => e.status === 'in_progress').length,
  };

  const totalPages = Math.ceil((pagination.total || 0) / LIMIT);

  if (loading && executions.length === 0) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Loading executions...</div>
  );

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Executions</h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: 14, margin: '6px 0 0' }}>History of all workflow runs with full audit trail</p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {[
          { label: 'Total Runs', value: stats.total, color: '#6366f1' },
          { label: 'Completed', value: stats.completed, color: '#34d399' },
          { label: 'Failed', value: stats.failed, color: '#f87171' },
          { label: 'Running', value: stats.running, color: '#a5b4fc' },
        ].map(s => (
          <div key={s.label} style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '18px 22px' }}>
            <div style={{ fontSize: 26, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
        {['', 'completed', 'failed', 'in_progress', 'canceled', 'pending'].map(f => (
          <button key={f} onClick={() => { setFilter(f); setPage(1); }}
            style={{ background: filter === f ? '#4f46e5' : '#0f172a', color: filter === f ? 'white' : '#64748b', border: `1px solid ${filter === f ? '#4f46e5' : '#1e293b'}`, borderRadius: 8, padding: '6px 14px', cursor: 'pointer', fontSize: 12, fontWeight: 500 }}>
            {f === '' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
        {executions.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>
            <div style={{ fontSize: 40, marginBottom: 12 }}>▶</div>
            <div style={{ fontSize: 15, color: '#94a3b8' }}>No executions {filter ? `with status "${filter}"` : 'yet'}</div>
            <Link to="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 12 }}>Go to Workflows →</Link>
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {['Execution ID', 'Workflow', 'Version', 'Status', 'Started', 'Duration', 'Logs', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {executions.map((ex, i) => {
                  const duration = ex.completedAt
                    ? ((new Date(ex.completedAt) - new Date(ex.startedAt)) / 1000).toFixed(2) + 's'
                    : ex.status === 'in_progress' ? '⏳ Running' : '—';
                  return (
                    <tr key={ex._id} style={{ borderBottom: i < executions.length - 1 ? '1px solid #0a0f1a' : 'none' }}>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#475569' }}>{ex._id.slice(-12)}</span>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{ex.workflowName}</div>
                      </td>
                      <td style={{ padding: '13px 20px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b', background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>v{ex.workflowVersion || 1}</span>
                      </td>
                      <td style={{ padding: '13px 20px' }}><StatusBadge status={ex.status} /></td>
                      <td style={{ padding: '13px 20px', fontSize: 12, color: '#64748b' }}>
                        <div>{new Date(ex.startedAt).toLocaleDateString()}</div>
                        <div style={{ color: '#475569' }}>{new Date(ex.startedAt).toLocaleTimeString()}</div>
                      </td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#94a3b8', fontFamily: 'monospace' }}>{duration}</td>
                      <td style={{ padding: '13px 20px', fontSize: 13, color: '#64748b' }}>{ex.logs?.length || 0}</td>
                      <td style={{ padding: '13px 20px' }}>
                        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                          <Link to={`/executions/${ex._id}`} style={{ color: '#818cf8', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Details</Link>
                          {['pending', 'in_progress'].includes(ex.status) && (
                            <button onClick={() => handleCancel(ex._id)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12 }}>Cancel</button>
                          )}
                          {ex.status === 'failed' && (
                            <button onClick={() => handleRetry(ex._id)} style={{ color: '#34d399', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>↺ Retry</button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {totalPages > 1 && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {totalPages}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ background: '#1e293b', color: page === 1 ? '#334155' : '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13 }}>← Prev</button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ background: '#1e293b', color: page === totalPages ? '#334155' : '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13 }}>Next →</button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
