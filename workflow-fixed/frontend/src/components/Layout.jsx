import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const NavItem = ({ to, icon, label, active }) => (
  <Link to={to} style={{
    display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
    textDecoration: 'none', fontSize: 14, fontWeight: active ? 600 : 400,
    color: active ? '#fff' : '#64748b',
    background: active ? '#4f46e5' : 'transparent',
    transition: 'all 0.15s',
  }}
    onMouseEnter={e => { if (!active) e.currentTarget.style.background = '#1e293b'; e.currentTarget.style.color = active ? '#fff' : '#e2e8f0'; }}
    onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = active ? '#fff' : '#64748b'; }}
  >
    <span style={{ fontSize: 16 }}>{icon}</span>
    {label}
  </Link>
);

export default function Layout({ children }) {
  const location = useLocation();
  const isActive = (path) => path === '/' ? location.pathname === '/' : location.pathname.startsWith(path);

  const nav = [
    { to: '/', icon: '⬡', label: 'Workflows' },
    { to: '/executions', icon: '▶', label: 'Executions' },
    { to: '/audit', icon: '📋', label: 'Audit Log' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#030712', overflow: 'hidden' }}>
      <aside style={{ width: 220, flexShrink: 0, background: '#0a0f1e', borderRight: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
        {/* Logo */}
        <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1e293b' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 34, height: 34, background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13, letterSpacing: '-0.5px' }}>FF</div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f1f5f9', letterSpacing: '-0.3px' }}>FlowForge</div>
              <div style={{ fontSize: 11, color: '#475569' }}>Workflow Engine</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
          {nav.map(item => <NavItem key={item.to} {...item} active={isActive(item.to)} />)}
        </nav>

        {/* CTA */}
        <div style={{ padding: '12px 8px', borderTop: '1px solid #1e293b' }}>
          <Link to="/workflows/new" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            padding: '10px', background: '#4f46e5', color: 'white', borderRadius: 8,
            textDecoration: 'none', fontSize: 14, fontWeight: 600,
          }}
            onMouseEnter={e => e.currentTarget.style.background = '#4338ca'}
            onMouseLeave={e => e.currentTarget.style.background = '#4f46e5'}
          >
            + New Workflow
          </Link>
        </div>
        <div style={{ padding: '12px 16px', fontSize: 11, color: '#1e293b', textAlign: 'center' }}>FlowForge v1.0.0</div>
      </aside>

      <main style={{ flex: 1, overflow: 'auto' }}>{children}</main>
    </div>
  );
}
