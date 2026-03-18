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
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{status.replace(/_/g, ' ')}</span>;
}

export default function AuditLog() {
  const [executions, setExecutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0 });
  const LIMIT = 25;

  const load = async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
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

  useEffect(() => { load(); }, [statusFilter, page]);

  const totalPages = Math.ceil((pagination.total || 0) / LIMIT);

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1300, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Audit Log</h1>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: 14, margin: '6px 0 0' }}>Complete execution history for tracking and compliance</p>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, alignItems: 'center' }}>
        <span style={{ fontSize: 13, color: '#64748b', marginRight: 4 }}>Filter:</span>
        {['', 'completed', 'failed', 'in_progress', 'canceled'].map(f => (
          <button key={f} onClick={() => { setStatusFilter(f); setPage(1); }}
            style={{ background: statusFilter === f ? '#4f46e5' : '#0f172a', color: statusFilter === f ? 'white' : '#64748b', border: `1px solid ${statusFilter === f ? '#4f46e5' : '#1e293b'}`, borderRadius: 8, padding: '5px 14px', cursor: 'pointer', fontSize: 12 }}>
            {f === '' ? 'All' : f.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase())}
          </button>
        ))}
        <span style={{ marginLeft: 'auto', fontSize: 13, color: '#475569' }}>
          {pagination.total || 0} total executions
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #1e293b', background: '#060c18' }}>
              {['Execution ID', 'Workflow', 'Version', 'Status', 'Started By', 'Start Time', 'End Time', 'Duration', 'Steps', 'Actions'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={10} style={{ padding: '40px 24px', textAlign: 'center', color: '#64748b' }}>Loading...</td></tr>
            ) : executions.length === 0 ? (
              <tr>
                <td colSpan={10} style={{ padding: '60px 24px', textAlign: 'center' }}>
                  <div style={{ fontSize: 40, marginBottom: 12 }}>📋</div>
                  <div style={{ fontSize: 15, color: '#94a3b8' }}>No executions {statusFilter ? `with status "${statusFilter}"` : 'yet'}</div>
                  <Link to="/" style={{ color: '#818cf8', textDecoration: 'none', fontSize: 13, display: 'block', marginTop: 12 }}>Go to Workflows →</Link>
                </td>
              </tr>
            ) : executions.map((ex, i) => {
              const duration = ex.completedAt
                ? ((new Date(ex.completedAt) - new Date(ex.startedAt)) / 1000).toFixed(2) + 's'
                : ex.status === 'in_progress' ? '⏳' : '—';
              const rowBg = ex.status === 'failed' ? 'rgba(127,29,29,0.08)' : 'transparent';
              return (
                <tr key={ex._id} style={{ borderBottom: i < executions.length - 1 ? '1px solid #0a0f1a' : 'none', background: rowBg }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#475569' }}>{ex._id.slice(-10)}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: '#e2e8f0' }}>{ex.workflowName}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#64748b', background: '#1e293b', padding: '2px 6px', borderRadius: 4 }}>{ex.workflowVersion || 1}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <StatusBadge status={ex.status} />
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8' }}>
                    {ex.triggered_by || 'user'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {new Date(ex.startedAt).toISOString().replace('T', ' ').slice(0, 19)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                    {ex.completedAt ? new Date(ex.completedAt).toISOString().replace('T', ' ').slice(0, 19) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{duration}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: '#64748b' }}>{ex.stepLogs?.length || 0}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <Link to={`/executions/${ex._id}`} style={{ color: '#818cf8', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>View →</Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ padding: '14px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 13, color: '#64748b' }}>Page {page} of {totalPages} · {pagination.total} total</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                style={{ background: '#1e293b', color: page === 1 ? '#334155' : '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13 }}>← Prev</button>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                style={{ background: '#1e293b', color: page === totalPages ? '#334155' : '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13 }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
