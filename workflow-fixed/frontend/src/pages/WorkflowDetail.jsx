import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { workflowAPI, stepAPI } from '../services/api';
import toast from 'react-hot-toast';
import StepEditor from '../components/StepEditor';
import RuleEditor from '../components/RuleEditor';
import ExecuteModal from '../components/ExecuteModal';

const STATUS_COLORS = {
  active: { bg: '#064e3b', text: '#34d399', border: '#065f46' },
  draft: { bg: '#1e1b4b', text: '#a5b4fc', border: '#3730a3' },
  archived: { bg: '#1f2937', text: '#9ca3af', border: '#374151' },
};

export default function WorkflowDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [workflow, setWorkflow] = useState(null);
  const [steps, setSteps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('steps');
  const [selectedStep, setSelectedStep] = useState(null);
  const [showExecute, setShowExecute] = useState(false);

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    try {
      const [wfRes, stepsRes] = await Promise.all([
        workflowAPI.getById(id),
        stepAPI.getByWorkflow(id),
      ]);
      setWorkflow(wfRes.data);
      setSteps(stepsRes.data || []);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete workflow "${workflow.name}"?`)) return;
    try {
      await workflowAPI.delete(id);
      toast.success('Workflow deleted');
      navigate('/');
    } catch (err) { toast.error(err.message); }
  };

  if (loading) return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>Loading...</div>;
  if (!workflow) return <div style={{ padding: 40, color: '#f87171' }}>Workflow not found</div>;

  const sc = STATUS_COLORS[workflow.status] || STATUS_COLORS.draft;

  const tabs = [
    { id: 'steps', label: `Steps (${steps.length})` },
    { id: 'schema', label: 'Input Schema' },
    { id: 'meta', label: 'Details' },
  ];

  return (
    <div style={{ padding: '32px 40px', maxWidth: 960, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <Link to="/" style={{ color: '#64748b', textDecoration: 'none', fontSize: 13 }}>← Dashboard</Link>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginTop: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
              <h1 style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{workflow.name}</h1>
              <span style={{ background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`, borderRadius: 6, padding: '2px 8px', fontSize: 11, fontWeight: 600, textTransform: 'uppercase' }}>{workflow.status}</span>
              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#64748b', background: '#1e293b', padding: '2px 8px', borderRadius: 4 }}>v{workflow.version}</span>
            </div>
            {workflow.description && <p style={{ color: '#64748b', margin: 0, fontSize: 14 }}>{workflow.description}</p>}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => setShowExecute(true)} style={{ background: '#059669', color: 'white', padding: '9px 18px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600 }}>▶ Execute</button>
            <Link to={`/workflows/${id}/edit`} style={{ background: '#1e293b', color: '#94a3b8', padding: '9px 16px', borderRadius: 8, textDecoration: 'none', fontSize: 13, fontWeight: 500, border: '1px solid #334155', display: 'inline-flex', alignItems: 'center' }}>Edit</Link>
            <button onClick={handleDelete} style={{ background: 'rgba(127,29,29,0.3)', color: '#f87171', padding: '9px 16px', borderRadius: 8, border: '1px solid rgba(153,27,27,0.4)', cursor: 'pointer', fontSize: 13 }}>Delete</button>
          </div>
        </div>
      </div>

      {/* Tags */}
      {workflow.tags?.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginBottom: 24, flexWrap: 'wrap' }}>
          {workflow.tags.map(t => <span key={t} style={{ background: '#1e293b', color: '#64748b', padding: '3px 10px', borderRadius: 6, fontSize: 12 }}>{t}</span>)}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 2, borderBottom: '1px solid #1e293b', marginBottom: 24 }}>
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '10px 16px', fontSize: 13, fontWeight: activeTab === tab.id ? 600 : 400, color: activeTab === tab.id ? '#818cf8' : '#64748b', borderBottom: `2px solid ${activeTab === tab.id ? '#818cf8' : 'transparent'}`, marginBottom: -1, transition: 'all 0.15s' }}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'steps' && (
        <>
          <StepEditor workflowId={id} steps={steps} onStepsChange={setSteps} onViewRules={setSelectedStep} />
          {selectedStep && (
            <div style={{ marginTop: 24 }}>
              <RuleEditor step={selectedStep} allSteps={steps} onClose={() => setSelectedStep(null)} />
            </div>
          )}
        </>
      )}

      {activeTab === 'schema' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 24 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: '#e2e8f0', marginTop: 0, marginBottom: 12 }}>Input Schema</h3>
          <pre style={{ margin: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: '#7dd3fc', background: '#020617', padding: 16, borderRadius: 8, overflow: 'auto' }}>
            {JSON.stringify(workflow.inputSchema || {}, null, 2)}
          </pre>
        </div>
      )}

      {activeTab === 'meta' && (
        <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 10, padding: 24 }}>
          {[
            { label: 'Workflow ID', value: workflow._id, mono: true },
            { label: 'Created', value: new Date(workflow.createdAt).toLocaleString() },
            { label: 'Updated', value: new Date(workflow.updatedAt).toLocaleString() },
            { label: 'Steps', value: steps.length },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #1e293b' }}>
              <span style={{ fontSize: 13, color: '#64748b' }}>{row.label}</span>
              <span style={{ fontSize: 13, color: '#e2e8f0', fontFamily: row.mono ? 'monospace' : 'inherit' }}>{row.value}</span>
            </div>
          ))}
        </div>
      )}

      {showExecute && <ExecuteModal workflow={workflow} onClose={() => setShowExecute(false)} />}
    </div>
  );
}
