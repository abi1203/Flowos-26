import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import WorkflowCreate from './pages/WorkflowCreate';
import WorkflowEdit from './pages/WorkflowEdit';
import WorkflowDetail from './pages/WorkflowDetail';
import ExecutionDetail from './pages/ExecutionDetail';
import ExecutionsList from './pages/ExecutionsList';
import AuditLog from './pages/AuditLog';

export default function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151', borderRadius: '0.5rem', fontSize: '0.875rem' },
          success: { iconTheme: { primary: '#34d399', secondary: '#1f2937' } },
          error: { iconTheme: { primary: '#f87171', secondary: '#1f2937' } },
        }}
      />
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/workflows/new" element={<WorkflowCreate />} />
          <Route path="/workflows/:id" element={<WorkflowDetail />} />
          <Route path="/workflows/:id/edit" element={<WorkflowEdit />} />
          <Route path="/executions" element={<ExecutionsList />} />
          <Route path="/executions/:id" element={<ExecutionDetail />} />
          <Route path="/audit" element={<AuditLog />} />
        </Routes>
      </Layout>
    </Router>
  );
}
