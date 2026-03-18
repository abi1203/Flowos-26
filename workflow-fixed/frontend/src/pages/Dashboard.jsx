import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { workflowAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  active:   { bg: '#064e3b', text: '#34d399', border: '#065f46' },
  draft:    { bg: '#1e1b4b', text: '#a5b4fc', border: '#3730a3' },
  archived: { bg: '#1f2937', text: '#9ca3af', border: '#374151' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.draft;
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{status}</span>;
}

function StatCard({ label, value, icon, color }) {
  return (
    <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 16 }}>
      <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>{icon}</div>
      <div>
        <div style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{label}</div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, limit: 10 });
  const LIMIT = 10;

  const loadWorkflows = useCallback(async () => {
    setLoading(true);
    try {
      const params = { page, limit: LIMIT };
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await workflowAPI.getAll(params);
      // Handle both paginated and non-paginated responses
      if (res.data?.workflows) {
        setWorkflows(res.data.workflows);
        setPagination(res.data.pagination || { total: res.data.workflows.length, limit: LIMIT });
      } else {
        setWorkflows(res.data || []);
        setPagination({ total: (res.data || []).length, limit: LIMIT });
      }
    } catch (err) { toast.error(err.message); }
    finally { setLoading(false); }
  }, [page, search, statusFilter]);

  useEffect(() => { loadWorkflows(); }, [loadWorkflows]);

  // Debounce search
  useEffect(() => { setPage(1); }, [search, statusFilter]);

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"? This also deletes all steps, rules, and executions.`)) return;
    try { await workflowAPI.delete(id); toast.success('Workflow deleted'); loadWorkflows(); }
    catch (err) { toast.error(err.message); }
  };

  const totalPages = Math.ceil(pagination.total / LIMIT);

  const stats = {
    total: pagination.total || workflows.length,
    active: workflows.filter(w => w.status === 'active').length,
    draft: workflows.filter(w => w.status === 'draft').length,
    executions: workflows.reduce((s, w) => s + (w.executionCount || 0), 0),
  };

  return (
    <div style={{ padding: '32px 40px', maxWidth: 1200, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 }}>
        <div>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Workflows</h1>
          <p style={{ color: '#64748b', marginTop: 6, fontSize: 14, margin: '6px 0 0' }}>Design, manage and execute automated workflows</p>
        </div>
        <Link to="/workflows/new" style={{ background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: 10, textDecoration: 'none', fontSize: 14, fontWeight: 600 }}>
          + New Workflow
        </Link>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        <StatCard label="Total Workflows" value={stats.total} icon="⬡" color="#6366f1" />
        <StatCard label="Active" value={stats.active} icon="✓" color="#34d399" />
        <StatCard label="Drafts" value={stats.draft} icon="◷" color="#a5b4fc" />
        <StatCard label="Total Executions" value={stats.executions} icon="▶" color="#fb923c" />
      </div>

      {/* Search + Filter */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        <input
          style={{ flex: 1, background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 14px', fontSize: 14, color: '#f1f5f9', outline: 'none' }}
          placeholder="🔍  Search workflows by name..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <select
          style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 8, padding: '9px 14px', fontSize: 14, color: '#94a3b8', outline: 'none', minWidth: 140 }}
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
        <div style={{ padding: '14px 24px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>
            {loading ? 'Loading...' : `${pagination.total} workflow${pagination.total !== 1 ? 's' : ''}`}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: '60px 24px', textAlign: 'center', color: '#64748b' }}>Loading workflows...</div>
        ) : workflows.length === 0 ? (
          <div style={{ padding: '60px 24px', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>⬡</div>
            <div style={{ fontSize: 15, color: '#94a3b8', marginBottom: 8 }}>
              {search || statusFilter ? 'No workflows match your filters' : 'No workflows yet'}
            </div>
            {!search && !statusFilter && (
              <Link to="/workflows/new" style={{ background: '#4f46e5', color: 'white', padding: '10px 20px', borderRadius: 8, textDecoration: 'none', fontSize: 14, display: 'inline-block', marginTop: 12 }}>Create First Workflow</Link>
            )}
          </div>
        ) : (
          <>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #1e293b' }}>
                  {['ID', 'Name', 'Steps', 'Version', 'Status', 'Tags', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {workflows.map((wf, i) => (
                  <tr key={wf._id} style={{ borderBottom: i < workflows.length - 1 ? '1px solid #0f172a' : 'none' }}>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 11, color: '#475569' }}>{wf._id.slice(-8)}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <Link to={`/workflows/${wf._id}`} style={{ color: '#e2e8f0', textDecoration: 'none', fontWeight: 600, fontSize: 14, display: 'block' }}>{wf.name}</Link>
                      {wf.description && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{wf.description.slice(0, 55)}{wf.description.length > 55 ? '...' : ''}</div>}
                    </td>
                    <td style={{ padding: '14px 20px', color: '#94a3b8', fontSize: 13 }}>{wf.stepCount || 0}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#94a3b8', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>v{wf.version}</span>
                    </td>
                    <td style={{ padding: '14px 20px' }}><StatusBadge status={wf.status} /></td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                        {(wf.tags || []).slice(0, 3).map(t => <span key={t} style={{ background: '#1e293b', color: '#64748b', padding: '1px 6px', borderRadius: 4, fontSize: 11 }}>{t}</span>)}
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        <Link to={`/workflows/${wf._id}/edit`} style={{ color: '#94a3b8', textDecoration: 'none', fontSize: 13, fontWeight: 500 }}>Edit</Link>
                        <Link to={`/workflows/${wf._id}`} style={{ color: '#818cf8', textDecoration: 'none', fontSize: 13, fontWeight: 600 }}>Execute</Link>
                        <button onClick={() => handleDelete(wf._id, wf.name)} style={{ color: '#f87171', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, padding: 0 }}>Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div style={{ padding: '14px 24px', borderTop: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: '#64748b' }}>
                  Page {page} of {totalPages} · {pagination.total} total
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    style={{ background: '#1e293b', color: page === 1 ? '#334155' : '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: page === 1 ? 'default' : 'pointer', fontSize: 13 }}>
                    ← Prev
                  </button>
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => i + 1).map(p => (
                    <button key={p} onClick={() => setPage(p)}
                      style={{ background: page === p ? '#4f46e5' : '#1e293b', color: page === p ? 'white' : '#94a3b8', border: `1px solid ${page === p ? '#4f46e5' : '#334155'}`, borderRadius: 6, padding: '5px 10px', cursor: 'pointer', fontSize: 13, minWidth: 34 }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    style={{ background: '#1e293b', color: page === totalPages ? '#334155' : '#94a3b8', border: '1px solid #334155', borderRadius: 6, padding: '5px 12px', cursor: page === totalPages ? 'default' : 'pointer', fontSize: 13 }}>
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
