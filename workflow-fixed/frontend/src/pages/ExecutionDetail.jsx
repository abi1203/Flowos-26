import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { executionAPI } from '../services/api';
import toast from 'react-hot-toast';

const STATUS_COLORS = {
  completed:   { bg: '#064e3b', text: '#34d399', border: '#065f46' },
  failed:      { bg: '#450a0a', text: '#f87171', border: '#7f1d1d' },
  in_progress: { bg: '#1e1b4b', text: '#a5b4fc', border: '#3730a3' },
  canceled:    { bg: '#292524', text: '#a8a29e', border: '#44403c' },
  pending:     { bg: '#1c1917', text: '#78716c', border: '#44403c' },
};
const LOG_COLORS = {
  info:    { text: '#94a3b8', icon: '◦', bg: 'transparent' },
  success: { text: '#34d399', icon: '✓', bg: 'rgba(6,78,59,0.2)' },
  error:   { text: '#f87171', icon: '✕', bg: 'rgba(69,10,10,0.3)' },
  warn:    { text: '#fbbf24', icon: '!', bg: 'rgba(78,29,0,0.2)' },
};
const STEP_TYPE_COLORS = {
  task:         { color: '#818cf8', bg: '#1e1b4b' },
  approval:     { color: '#fbbf24', bg: '#451a03' },
  notification: { color: '#34d399', bg: '#064e3b' },
};

function StatusBadge({ status }) {
  const c = STATUS_COLORS[status] || STATUS_COLORS.pending;
  return <span style={{ background: c.bg, color: c.text, border: `1px solid ${c.border}`, borderRadius: 6, padding: '3px 10px', fontSize: 12, fontWeight: 600, textTransform: 'uppercase' }}>{status.replace(/_/g, ' ')}</span>;
}

function StepLogCard({ stepLog, index }) {
  const [open, setOpen] = useState(index === 0);
  const tc = STEP_TYPE_COLORS[stepLog.stepType] || STEP_TYPE_COLORS.task;
  const isOk = stepLog.status === 'completed';

  return (
    <div style={{ background: '#0f172a', border: `1px solid ${isOk ? '#1e293b' : '#7f1d1d'}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
      {/* Header */}
      <div onClick={() => setOpen(o => !o)} style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', userSelect: 'none' }}>
        <div style={{ width: 26, height: 26, borderRadius: 6, background: isOk ? '#064e3b' : '#450a0a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, flexShrink: 0 }}>
          {isOk ? '✓' : '✕'}
        </div>
        <div style={{ width: 28, height: 28, borderRadius: 6, background: tc.bg, color: tc.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0, textTransform: 'uppercase' }}>
          {(stepLog.stepType || 'T')[0]}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0' }}>{stepLog.stepName}</div>
          <div style={{ fontSize: 12, color: '#64748b' }}>
            {stepLog.stepType} · {stepLog.duration || '—'}{stepLog.selectedNextStep ? ` → ${stepLog.selectedNextStep}` : ''}
          </div>
        </div>
        <StatusBadge status={stepLog.status} />
        <span style={{ color: '#475569', fontSize: 14, marginLeft: 8 }}>{open ? '▲' : '▼'}</span>
      </div>

      {open && (
        <div style={{ borderTop: '1px solid #1e293b', padding: '16px 18px' }}>
          {/* Evaluated Rules */}
          {stepLog.evaluatedRules?.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, color: '#64748b', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Rules Evaluated</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {stepLog.evaluatedRules.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, background: '#020617', borderRadius: 7, padding: '8px 12px', border: `1px solid ${r.result ? '#065f46' : '#1e293b'}` }}>
                    <span style={{ fontSize: 13, color: r.result ? '#34d399' : '#ef4444', flexShrink: 0, marginTop: 1 }}>{r.result ? '✓' : '✕'}</span>
                    <code style={{ fontSize: 12, color: r.result ? '#6ee7b7' : '#9ca3af', fontFamily: 'JetBrains Mono, monospace', flex: 1, wordBreak: 'break-all' }}>{r.condition}</code>
                    <span style={{ background: r.result ? '#064e3b' : '#1f2937', color: r.result ? '#34d399' : '#6b7280', padding: '1px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, flexShrink: 0 }}>
                      {r.result ? 'MATCHED' : 'skip'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Next step + error */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {stepLog.selectedNextStep && (
              <div style={{ background: '#020617', borderRadius: 7, padding: '8px 14px', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Next Step: </span>
                <span style={{ color: '#a5b4fc', fontWeight: 600 }}>{stepLog.selectedNextStep}</span>
              </div>
            )}
            {stepLog.approverId && (
              <div style={{ background: '#020617', borderRadius: 7, padding: '8px 14px', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Approver: </span>
                <span style={{ color: '#e2e8f0' }}>{stepLog.approverId}</span>
              </div>
            )}
            {stepLog.startedAt && (
              <div style={{ background: '#020617', borderRadius: 7, padding: '8px 14px', fontSize: 13 }}>
                <span style={{ color: '#64748b' }}>Started: </span>
                <span style={{ color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{new Date(stepLog.startedAt).toISOString()}</span>
              </div>
            )}
          </div>

          {stepLog.errorMessage && (
            <div style={{ marginTop: 12, background: 'rgba(69,10,10,0.4)', border: '1px solid #7f1d1d', borderRadius: 7, padding: '10px 14px', color: '#f87171', fontSize: 13 }}>
              ✕ {stepLog.errorMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function LogEntry({ log }) {
  const lc = LOG_COLORS[log.level] || LOG_COLORS.info;
  return (
    <div style={{ display: 'flex', gap: 12, padding: '9px 16px', borderBottom: '1px solid #060c18', alignItems: 'flex-start', background: lc.bg }}>
      <span style={{ color: lc.text, fontSize: 13, width: 14, textAlign: 'center', flexShrink: 0, marginTop: 1 }}>{lc.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, color: '#334155', fontFamily: 'monospace' }}>
            {new Date(log.timestamp).toISOString().slice(11, 23)}
          </span>
          {log.stepName && <span style={{ background: '#1e1b4b', color: '#a5b4fc', padding: '1px 7px', borderRadius: 4, fontSize: 10, fontWeight: 600 }}>{log.stepName}</span>}
          {log.ruleName && <span style={{ background: '#064e3b', color: '#6ee7b7', padding: '1px 7px', borderRadius: 4, fontSize: 10 }}>rule: {log.ruleName}</span>}
        </div>
        <div style={{ fontSize: 13, color: lc.text }}>{log.message}</div>
        {log.data && <pre style={{ margin: '5px 0 0', fontSize: 11, color: '#475569', fontFamily: 'monospace', background: '#060c18', padding: '6px 10px', borderRadius: 6, overflow: 'auto', maxHeight: 120 }}>{JSON.stringify(log.data, null, 2)}</pre>}
      </div>
    </div>
  );
}

export default function ExecutionDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');
  const [acting, setActing] = useState(false);

  const load = () => {
    executionAPI.getById(id)
      .then(res => setExecution(res.data))
      .catch(err => toast.error(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleCancel = async () => {
    setActing(true);
    try { await executionAPI.cancel(id); toast.success('Canceled'); load(); }
    catch (err) { toast.error(err.message); }
    finally { setActing(false); }
  };

  const handleRetry = async () => {
    setActing(true);
    try { const res = await executionAPI.retry(id); toast.success(`Retry: ${res.data.status}`); load(); }
    catch (err) { toast.error(err.message); }
    finally { setActing(false); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Loading execution...</div>;
  if (!execution) return <div style={{ padding: 40, color: '#f87171' }}>Execution not found</div>;

  const duration = execution.completedAt
    ? ((new Date(execution.completedAt) - new Date(execution.startedAt)) / 1000).toFixed(2) + 's'
    : execution.status === 'in_progress' ? '⏳ Running...' : '—';

  const tabs = [
    { id: 'progress', label: `Step Progress (${execution.stepLogs?.length || 0})` },
    { id: 'logs', label: `Event Log (${execution.logs?.length || 0})` },
    { id: 'input', label: 'Input' },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto' }}>
      {/* Breadcrumb */}
      <div style={{ marginBottom: 20 }}>
        <Link to="/executions" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>← Executions</Link>
      </div>

      {/* Header card */}
      <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{execution.workflowName}</h1>
              <StatusBadge status={execution.status} />
              <span style={{ fontFamily: 'monospace', fontSize: 11, color: '#475569', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>v{execution.workflowVersion}</span>
            </div>
            <div style={{ fontFamily: 'monospace', fontSize: 11, color: '#334155' }}>ID: {execution._id}</div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            {['pending', 'in_progress'].includes(execution.status) && (
              <button onClick={handleCancel} disabled={acting}
                style={{ background: 'rgba(127,29,29,0.3)', color: '#f87171', border: '1px solid rgba(153,27,27,0.4)', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 500 }}>
                ✕ Cancel
              </button>
            )}
            {execution.status === 'failed' && (
              <button onClick={handleRetry} disabled={acting}
                style={{ background: '#064e3b', color: '#34d399', border: '1px solid #065f46', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>
                ↺ Retry Failed Step
              </button>
            )}
            {execution.workflowId && (
              <Link to={`/workflows/${execution.workflowId._id || execution.workflowId}`}
                style={{ background: '#1e293b', color: '#818cf8', padding: '8px 14px', borderRadius: 8, textDecoration: 'none', fontSize: 13, border: '1px solid #334155' }}>
                View Workflow →
              </Link>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
          {[
            { label: 'Status', value: execution.status.replace(/_/g, ' ') },
            { label: 'Duration', value: duration },
            { label: 'Steps Logged', value: execution.stepLogs?.length || 0 },
            { label: 'Retries', value: execution.retries || 0 },
          ].map(stat => (
            <div key={stat.label} style={{ background: '#020617', borderRadius: 8, padding: '12px 14px' }}>
              <div style={{ fontSize: 11, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{stat.label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0', textTransform: 'capitalize' }}>{stat.value}</div>
            </div>
          ))}
        </div>

        {execution.error && (
          <div style={{ marginTop: 14, background: 'rgba(127,29,29,0.2)', border: '1px solid rgba(153,27,27,0.4)', borderRadius: 8, padding: '10px 16px', color: '#f87171', fontSize: 13 }}>
            ✕ Error: {execution.error}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #1e293b', marginBottom: 20 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? '#818cf8' : '#64748b', borderBottom: `2px solid ${activeTab === tab.id ? '#818cf8' : 'transparent'}`, marginBottom: -1 }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Step Progress */}
      {activeTab === 'progress' && (
        <div>
          {execution.stepLogs?.length === 0 ? (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569', background: '#0f172a', borderRadius: 10, border: '1px solid #1e293b' }}>
              No step logs recorded yet
            </div>
          ) : (
            execution.stepLogs.map((sl, i) => <StepLogCard key={i} stepLog={sl} index={i} />)
          )}
        </div>
      )}

      {/* Event Logs */}
      {activeTab === 'logs' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, overflow: 'hidden' }}>
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: execution.status === 'in_progress' ? '#34d399' : '#334155', display: 'inline-block' }}></span>
            <span style={{ fontSize: 13, color: '#64748b', fontWeight: 500 }}>Execution Event Log</span>
          </div>
          {execution.logs?.length === 0 ? (
            <div style={{ padding: '30px 20px', textAlign: 'center', color: '#475569', fontSize: 13 }}>No log entries</div>
          ) : (
            <div style={{ maxHeight: 540, overflowY: 'auto' }}>
              {execution.logs.map((log, i) => <LogEntry key={i} log={log} />)}
            </div>
          )}
        </div>
      )}

      {/* Input */}
      {activeTab === 'input' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 12, padding: 24 }}>
          <div style={{ fontSize: 13, color: '#64748b', marginBottom: 12 }}>Input provided at execution start:</div>
          <pre style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#7dd3fc', background: '#020617', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(execution.input || {}, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}
