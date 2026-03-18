import React from 'react';

export const Spinner = ({ size = 'md', className = '' }) => {
  const sizes = { sm: 'h-4 w-4', md: 'h-6 w-6', lg: 'h-8 w-8' };
  return (
    <div className={`${sizes[size]} animate-spin rounded-full border-2 border-gray-700 border-t-indigo-500 ${className}`} />
  );
};

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-16 text-center">
    <div className="text-4xl mb-3">{icon}</div>
    <h3 className="text-base font-semibold text-gray-300 mb-1">{title}</h3>
    <p className="text-sm text-gray-500 mb-4">{description}</p>
    {action}
  </div>
);

export const Modal = ({ isOpen, onClose, title, children, size = 'md' }) => {
  if (!isOpen) return null;
  const sizes = { sm: 'max-w-md', md: 'max-w-lg', lg: 'max-w-2xl', xl: 'max-w-3xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative w-full ${sizes[size]} card shadow-2xl animate-slide-up max-h-[90vh] overflow-y-auto`}>
        <div className="flex items-center justify-between p-5 border-b border-gray-800">
          <h2 className="text-base font-semibold text-white">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors text-xl leading-none">×</button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

export const ConfirmDialog = ({ isOpen, onClose, onConfirm, title, message, danger = false }) => (
  <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
    <p className="text-sm text-gray-400 mb-5">{message}</p>
    <div className="flex gap-2 justify-end">
      <button onClick={onClose} className="btn-secondary">Cancel</button>
      <button onClick={onConfirm} className={danger ? 'btn-danger' : 'btn-primary'}>Confirm</button>
    </div>
  </Modal>
);

export const StatusBadge = ({ status }) => {
  const styles = {
    pending: 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20',
    in_progress: 'bg-blue-500/10 text-blue-400 border border-blue-500/20',
    completed: 'bg-green-500/10 text-green-400 border border-green-500/20',
    failed: 'bg-red-500/10 text-red-400 border border-red-500/20',
    draft: 'bg-gray-500/10 text-gray-400 border border-gray-500/20',
    active: 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20',
    archived: 'bg-gray-500/10 text-gray-500 border border-gray-600/20',
  };
  return (
    <span className={`badge ${styles[status] || styles.draft}`}>
      {status?.replace('_', ' ')}
    </span>
  );
};

export const StepTypeBadge = ({ type }) => {
  const styles = {
    task: 'bg-purple-500/10 text-purple-400 border border-purple-500/20',
    approval: 'bg-amber-500/10 text-amber-400 border border-amber-500/20',
    notification: 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20',
  };
  const icons = { task: '⚙️', approval: '✅', notification: '🔔' };
  return (
    <span className={`badge ${styles[type] || styles.task}`}>
      {icons[type]} {type}
    </span>
  );
};

export const PageHeader = ({ title, subtitle, actions }) => (
  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
    <div>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
    </div>
    {actions && <div className="flex items-center gap-2">{actions}</div>}
  </div>
);

export const FormField = ({ label, error, children, hint }) => (
  <div className="mb-4">
    {label && <label className="label">{label}</label>}
    {children}
    {hint && !error && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    {error && <p className="text-xs text-red-400 mt-1">{error}</p>}
  </div>
);

export const Select = ({ className = '', ...props }) => (
  <select
    className={`input ${className}`}
    style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.5rem center', backgroundSize: '1.25rem', paddingRight: '2rem', appearance: 'none' }}
    {...props}
  />
);
