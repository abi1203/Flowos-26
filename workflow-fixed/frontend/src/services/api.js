import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    const message = err.response?.data?.message || err.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

export const workflowAPI = {
  getAll:   (params) => api.get('/workflows', { params }),       // supports search, status, page, limit
  getById:  (id)     => api.get(`/workflows/${id}`),
  create:   (data)   => api.post('/workflows', data),
  update:   (id, data) => api.put(`/workflows/${id}`, data),    // auto-increments version
  delete:   (id)     => api.delete(`/workflows/${id}`),
  execute:  (id, payload) => api.post(`/workflows/${id}/execute`, payload),
};

export const stepAPI = {
  getByWorkflow: (workflowId) => api.get(`/workflows/${workflowId}/steps`),
  create: (workflowId, data) => api.post(`/workflows/${workflowId}/steps`, data),
  update: (id, data) => api.put(`/steps/${id}`, data),
  delete: (id)       => api.delete(`/steps/${id}`),
};

export const ruleAPI = {
  getByStep: (stepId) => api.get(`/steps/${stepId}/rules`),
  create: (stepId, data) => api.post(`/steps/${stepId}/rules`, data),
  update: (id, data) => api.put(`/rules/${id}`, data),
  delete: (id)       => api.delete(`/rules/${id}`),
};

export const executionAPI = {
  getAll:   (params) => api.get('/executions', { params }),
  getById:  (id)     => api.get(`/executions/${id}`),
  cancel:   (id)     => api.post(`/executions/${id}/cancel`),
  retry:    (id)     => api.post(`/executions/${id}/retry`),
};

export default api;
